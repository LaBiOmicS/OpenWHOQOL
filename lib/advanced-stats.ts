
import { TTestResult, AnovaResult, AdvancedTestResult, PostHocResult, CorrelationResult, ReliabilityResult, Participant, WHOQOLResponse, ContingencyTable, ChiSquaredResult, SocioeconomicData, RegressionResult, MannWhitneyUTestResult, KruskalWallisTestResult } from '../types';
import { calculateMean, calculateVariance, calculateStdDev } from './statistics';
import { WHOQOL_QUESTIONS } from '../constants';

const NEGATIVE_QUESTIONS = new Set(WHOQOL_QUESTIONS.filter(q => q.negative).map(q => q.id));

// --- Funções Auxiliares para Cálculo de P-Valor ---
// Nota: Estas são aproximações. Para precisão de nível de publicação, uma biblioteca estatística completa seria recomendada.
// Esta implementação usa a função de erro (erf) para a distribuição t e uma aproximação para a distribuição F.

/**
 * Função de erro (erf) - aproximação de Abramowitz e Stegun.
 * @param x O valor de entrada.
 * @returns O valor da função de erro.
 */
function erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
}

/**
 * Calcula a CDF da distribuição T de Student (aproximação).
 * @param t A estatística t.
 * @param df Graus de liberdade.
 * @returns A probabilidade acumulada.
 */
function studentT_CDF(t: number, df: number): number {
    const t_squared = t * t;
    let cdf;

    if (df === 1) {
        cdf = 0.5 + Math.atan(t) / Math.PI;
    } else if (df === 2) {
        cdf = 0.5 + t / (2 * Math.sqrt(2 + t_squared));
    } else {
        // Aproximação de Hill para df > 2
        const Z = t / Math.sqrt(df);
        const P = 0.5 * (1 + erf(Z / Math.sqrt(2)));
        const df_inv = 1 / df;
        const correction = (Z / (4 * Math.sqrt(2 * Math.PI))) * (1 + Z * Z) * df_inv * Math.exp(-0.5 * Z * Z);
        cdf = P - correction;
    }
    return isNaN(cdf) || cdf < 0 ? 0 : cdf > 1 ? 1 : cdf;
}

/**
 * Calcula o p-valor para um dado valor t e graus de liberdade (bicaudal).
 * @param tValue O valor da estatística t.
 * @param df Graus de liberdade.
 * @returns O p-valor.
 */
function calculatePValueFromT(tValue: number, df: number): number {
    const tAbs = Math.abs(tValue);
    const cdf = studentT_CDF(tAbs, df);
    return 2 * (1 - cdf);
}

/**
 * Calcula o p-valor para um dado valor F e graus de liberdade (aproximação).
 * @param fValue O valor da estatística F.
 * @param df1 Graus de liberdade do numerador.
 * @param df2 Graus de liberdade do denominador.
 * @returns O p-valor.
 */
function calculatePValueFromF(fValue: number, df1: number, df2: number): number {
    if (fValue < 0 || df1 <= 0 || df2 <= 0) return 1.0;
    
    // Aproximação usando a distribuição Chi-quadrado, que é mais simples que Beta incompleta
    const chi2 = fValue * df1;
    const k = df1;
    
    if (chi2 <= 0) return 1.0;
    
    // Aproximação de Wilson-Hilferty (Normal) para a CDF Chi-quadrado
    const p = Math.pow(chi2 / k, 1/3);
    const z = (p - (1 - 2/(9*k))) / Math.sqrt(2/(9*k));
    const norm_cdf = 0.5 * (1 + erf(z / Math.sqrt(2)));
    
    return 1 - norm_cdf;
}

/**
 * Calcula o p-valor para um dado valor Chi-Quadrado e graus de liberdade.
 * @param chi2 O valor da estatística Chi-Quadrado.
 * @param df Graus de liberdade.
 * @returns O p-valor.
 */
function calculatePValueFromChi2(chi2: number, df: number): number {
    if (chi2 <= 0 || df <= 0) return 1.0;

    // Aproximação de Wilson-Hilferty para a CDF da distribuição Chi-quadrado
    const p = Math.pow(chi2 / df, 1/3);
    const z = (p - (1 - 2/(9*df))) / Math.sqrt(2/(9*df));
    const norm_cdf = 0.5 * (1 + erf(z / Math.sqrt(2)));

    return 1 - norm_cdf;
}

/**
 * Calculates the p-value for a given z-score (two-tailed).
 * @param z The z-score.
 * @returns The p-value.
 */
function calculatePValueFromZ(z: number): number {
    const zAbs = Math.abs(z);
    // P(Z <= z) = 0.5 * (1 + erf(z / sqrt(2)))
    const cdf = 0.5 * (1 + erf(zAbs / Math.sqrt(2)));
    return 2 * (1 - cdf);
}

/**
 * Ranks an array of numbers, handling ties by assigning the average rank.
 * @param data The array of numbers to rank.
 * @returns An array of ranks.
 */
const rank = (data: number[]): number[] => {
    const sorted = [...data].sort((a, b) => a - b);
    return data.map(value => {
        const firstIndex = sorted.indexOf(value);
        const lastIndex = sorted.lastIndexOf(value);
        const rankSum = (firstIndex + 1) + (lastIndex + 1);
        return rankSum / 2;
    });
};

// --- Funções de Teste Estatístico ---

/**
 * Realiza um Teste T de Student para duas amostras independentes com variâncias desiguais (Teste de Welch).
 * @param sample1 Array de números da primeira amostra.
 * @param sample2 Array de números da segunda amostra.
 * @param groupNames Nomes dos dois grupos.
 * @returns Um objeto com os resultados do teste T.
 */
export const performTTest = (sample1: number[], sample2: number[], groupNames: [string, string]): AdvancedTestResult => {
    const n1 = sample1.length;
    const n2 = sample2.length;
    if (n1 < 2 || n2 < 2) return { testType: 'Error', message: 'Cada grupo deve ter pelo menos 2 pontos de dados para o Teste T.' };

    const mean1 = calculateMean(sample1);
    const mean2 = calculateMean(sample2);
    const var1 = calculateVariance(sample1);
    const var2 = calculateVariance(sample2);

    if (var1 === 0 && var2 === 0) return { testType: 'Error', message: 'A variância em ambos os grupos é zero.' };

    // T-Statistic for Welch's T-Test
    const tValue = (mean1 - mean2) / Math.sqrt(var1 / n1 + var2 / n2);
    
    // Welch-Satterthwaite equation for degrees of freedom
    const df_num = Math.pow((var1 / n1 + var2 / n2), 2);
    const df_den = (Math.pow(var1 / n1, 2) / (n1 - 1)) + (Math.pow(var2 / n2, 2) / (n2 - 1));
    const df = Math.floor(df_num / df_den);

    const pValue = calculatePValueFromT(tValue, df);
    
    // Cálculo do d de Cohen (Tamanho do Efeito)
    // Usando o desvio padrão combinado (pooled) padrão, mesmo com Welch.
    const pooledStdDev = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));
    const cohensD = pooledStdDev > 0 ? (mean1 - mean2) / pooledStdDev : 0;
    
    return { testType: 'T-Test', method: "Welch's T-Test", tValue, pValue, df, groupNames, isSignificant: pValue < 0.05, cohensD };
};

/**
 * Realiza um teste post-hoc (comparações par a par) após uma ANOVA significativa.
 * Usa o método Holm-Bonferroni (mais poderoso que o Bonferroni simples, mantendo o controle do erro familiar).
 * 
 * @param groups Array de amostras numéricas.
 * @param groupNames Nomes dos grupos.
 * @param dfWithin Graus de liberdade dentro dos grupos (da ANOVA).
 * @param msw Erro quadrado médio dentro dos grupos (da ANOVA).
 * @returns Um objeto com os resultados do teste Post-Hoc.
 */
const performHolmBonferroniPostHoc = (groups: number[][], groupNames: string[], dfWithin: number, msw: number): PostHocResult => {
    const rawPairs = [];
    const k = groups.length;
    
    for (let i = 0; i < k; i++) {
        for (let j = i + 1; j < k; j++) {
            const group1 = groups[i];
            const group2 = groups[j];
            const mean1 = calculateMean(group1);
            const mean2 = calculateMean(group2);
            const n1 = group1.length;
            const n2 = group2.length;

            // T-test using MSW from ANOVA
            const se = Math.sqrt(msw * (1/n1 + 1/n2));
            const tValue = (mean1 - mean2) / se;
            const rawPValue = calculatePValueFromT(tValue, dfWithin);
            
            rawPairs.push({
                group1: groupNames[i],
                group2: groupNames[j],
                meanDiff: mean1 - mean2,
                rawPValue: rawPValue,
            });
        }
    }

    // Sort pairs by p-value ascending
    rawPairs.sort((a, b) => a.rawPValue - b.rawPValue);
    
    const m = rawPairs.length;
    const pairs = rawPairs.map((pair, index) => {
        // Holm-Bonferroni adjustment
        // p_adj = min(1, max(p_adj_previous, p_raw * (m - rank + 1)))
        // Note: We apply the max check conceptually, but usually it's computed iteratively.
        // Simple step-up:
        const k = index + 1;
        const correctionFactor = m - k + 1;
        let adjustedPValue = pair.rawPValue * correctionFactor;
        adjustedPValue = Math.min(1.0, adjustedPValue);
        
        return {
            ...pair,
            pValue: adjustedPValue, // This will be corrected for monotonicity in a second pass if needed, but basic Holm is often sufficient.
        };
    });

    // Enforce monotonicity (the adjusted p-value for a larger raw p-value cannot be smaller than a previous one)
    for (let i = 1; i < m; i++) {
        pairs[i].pValue = Math.max(pairs[i].pValue, pairs[i-1].pValue);
    }

    const finalPairs = pairs.map(p => ({
        group1: p.group1,
        group2: p.group2,
        meanDiff: p.meanDiff,
        pValue: p.pValue,
        isSignificant: p.pValue < 0.05,
    }));

    return { testType: 'PostHoc', method: 'Holm-Bonferroni', pairs: finalPairs };
};


/**
 * Realiza uma Análise de Variância (ANOVA) de uma via.
 * Se o resultado for significativo, também realiza um teste post-hoc (Holm-Bonferroni).
 * @param groups Um array de arrays, onde cada subarray é um grupo de amostras.
 * @param groupNames Nomes dos grupos.
 * @param runPostHoc Se o teste post-hoc deve ser executado em caso de resultado significativo.
 * @returns Um objeto com os resultados da ANOVA, incluindo post-hoc se aplicável.
 */
export const performAnova = (groups: number[][], groupNames: string[], runPostHoc: boolean = true): AdvancedTestResult => {
    const k = groups.length;
    if (k < 2) return { testType: 'Error', message: 'ANOVA requer pelo menos 2 grupos.' };
    
    const n_i = groups.map(g => g.length);
    const N = n_i.reduce((a, b) => a + b, 0);
    if (N <= k) return { testType: 'Error', message: 'O número total de pontos de dados deve ser maior que o número de grupos.'};

    const grandMean = calculateMean(groups.flat());
    const groupMeans = groups.map(calculateMean);
    
    const ssb = groupMeans.reduce((sum, mean, i) => sum + n_i[i] * Math.pow(mean - grandMean, 2), 0);
    const ssw = groups.reduce((sum, group, i) => sum + group.reduce((ss, val) => ss + Math.pow(val - calculateMean(group), 2), 0), 0);
    
    const dfBetween = k - 1;
    const dfWithin = N - k;
    if (dfWithin <= 0) return { testType: 'Error', message: 'Graus de liberdade inválidos. Verifique se os grupos não estão vazios.'};

    const msb = ssb / dfBetween;
    const msw = ssw / dfWithin;
    const fValue = msw > 0 ? msb / msw : 0;
    const pValue = calculatePValueFromF(fValue, dfBetween, dfWithin);
    const isSignificant = pValue < 0.05;
    
    // Cálculo do Eta-quadrado (η²)
    const sst = ssb + ssw;
    const etaSquared = sst > 0 ? ssb / sst : 0;

    // Cálculo do Omega-quadrado (ω²) - Menos enviesado
    const omegaSquaredNumerator = ssb - (dfBetween * msw);
    const omegaSquaredDenominator = sst + msw;
    const omegaSquared = omegaSquaredDenominator > 0 ? omegaSquaredNumerator / omegaSquaredDenominator : 0;

    const result: AnovaResult = { testType: 'ANOVA', fValue, pValue, dfBetween, dfWithin, isSignificant, etaSquared, omegaSquared };
    
    if (isSignificant && runPostHoc) {
        result.postHoc = performHolmBonferroniPostHoc(groups, groupNames, dfWithin, msw);
    }

    return result;
};


/**
 * Calcula a correlação de Pearson entre duas variáveis.
 * @param data1 Array numérico da primeira variável.
 * @param data2 Array numérico da segunda variável.
 * @returns Um objeto com os resultados da correlação.
 */
export const performCorrelation = (data1: number[], data2: number[]): CorrelationResult => {
    const n = data1.length;
    if (n !== data2.length || n < 3) {
        throw new Error("As variáveis devem ter o mesmo tamanho e pelo menos 3 pontos de dados.");
    }

    const mean1 = calculateMean(data1);
    const mean2 = calculateMean(data2);
    const stdDev1 = calculateStdDev(data1);
    const stdDev2 = calculateStdDev(data2);

    if (stdDev1 === 0 || stdDev2 === 0) {
        return { testType: 'Correlation', rValue: NaN, rSquared: NaN, pValue: NaN, n, isSignificant: false };
    }

    const covariance = data1.reduce((sum, val, i) => sum + (val - mean1) * (data2[i] - mean2), 0) / (n - 1);
    const rValue = covariance / (stdDev1 * stdDev2);
    const rSquared = rValue * rValue;

    // Teste de significância
    const tValue = rValue * Math.sqrt((n - 2) / (1 - rValue * rValue));
    const df = n - 2;
    const pValue = calculatePValueFromT(tValue, df);

    return { testType: 'Correlation', rValue, rSquared, pValue, n, isSignificant: pValue < 0.05 };
};

/**
 * Realiza um Teste Qui-Quadrado de Independência.
 * @param participants A lista de participantes.
 * @param var1Id O ID da primeira variável categórica.
 * @param var2Id O ID da segunda variável categórica.
 * @returns Um objeto com os resultados do teste Qui-Quadrado.
 */
export const performChiSquaredTest = (participants: Participant[], var1Id: keyof SocioeconomicData, var2Id: keyof SocioeconomicData): AdvancedTestResult => {
    // 1. Construir a tabela de contingência com as frequências observadas
    const counts: { [key1: string]: { [key2: string]: number } } = {};
    const rowLabels = new Set<string>();
    const colLabels = new Set<string>();

    participants.forEach(p => {
        const val1 = p.socioeconomic?.[var1Id] as string;
        const val2 = p.socioeconomic?.[var2Id] as string;
        if (val1 && val2) {
            rowLabels.add(val1);
            colLabels.add(val2);
            if (!counts[val1]) counts[val1] = {};
            counts[val1][val2] = (counts[val1][val2] || 0) + 1;
        }
    });

    const sortedRowLabels = Array.from(rowLabels).sort();
    const sortedColLabels = Array.from(colLabels).sort();

    if (sortedRowLabels.length < 2 || sortedColLabels.length < 2) {
        return { testType: 'NotEnoughData', message: 'São necessárias pelo menos duas categorias em cada variável para o teste Qui-Quadrado.' };
    }

    const observed = sortedRowLabels.map(r => sortedColLabels.map(c => counts[r]?.[c] || 0));

    // 2. Calcular totais de linha, coluna e o total geral
    const rowTotals = observed.map(row => row.reduce((a, b) => a + b, 0));
    const colTotals = sortedColLabels.map((_, cIdx) => observed.reduce((sum, row) => sum + row[cIdx], 0));
    const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

    if (grandTotal === 0) {
      return { testType: 'NotEnoughData', message: 'Nenhum dado válido encontrado para as variáveis selecionadas.' };
    }

    // 3. Calcular frequências esperadas e o valor de Qui-Quadrado
    let chi2Value = 0;
    let lowExpectedCount = 0;
    const totalCells = sortedRowLabels.length * sortedColLabels.length;

    const expected = sortedRowLabels.map((_, rIdx) => {
        return sortedColLabels.map((_, cIdx) => {
            const expectedFreq = (rowTotals[rIdx] * colTotals[cIdx]) / grandTotal;
            
            // Regra de Cochran: Verifica células com frequência esperada < 5
            if (expectedFreq < 5) {
                lowExpectedCount++;
            }

            const observedFreq = observed[rIdx][cIdx];
            if (expectedFreq > 0) {
                chi2Value += Math.pow(observedFreq - expectedFreq, 2) / expectedFreq;
            }
            return expectedFreq;
        });
    });

    // 4. Calcular graus de liberdade e p-valor
    const df = (sortedRowLabels.length - 1) * (sortedColLabels.length - 1);
    if (df <= 0) {
      return { testType: 'Error', message: 'Não foi possível calcular os graus de liberdade. Certifique-se de que cada variável tem mais de uma categoria.' };
    }
    const pValue = calculatePValueFromChi2(chi2Value, df);

    // Aviso sobre a Regra de Cochran
    let warning: string | undefined = undefined;
    if (lowExpectedCount > 0) {
        const percentage = (lowExpectedCount / totalCells) * 100;
        // Se mais de 20% das células têm valor esperado < 5, a aproximação chi-quadrado é ruim.
        if (percentage > 20) {
             warning = `${lowExpectedCount} célula(s) (${percentage.toFixed(1)}% do total) possuem frequência esperada menor que 5. A Regra de Cochran recomenda que não mais que 20% das células tenham valor esperado menor que 5 para que o teste Qui-Quadrado seja válido. O valor de p pode não ser confiável.`;
        }
    }

    const contingencyTable: ContingencyTable = {
        headers: { rows: sortedRowLabels, cols: sortedColLabels },
        data: observed,
        expected,
        rowTotals,
        colTotals,
        grandTotal,
    };

    return {
        testType: 'ChiSquared',
        chi2Value,
        pValue,
        df,
        isSignificant: pValue < 0.05,
        contingencyTable,
        warning,
    };
};

/**
 * Calcula o Alfa de Cronbach para avaliar a consistência interna de uma escala (ex: um domínio do WHOQOL-BREF).
 * O cálculo segue o procedimento psicométrico padrão:
 * 1. Usa os escores brutos (1-5) para cada item do domínio.
 * 2. Inverte os escores para questões negativas, conforme as diretrizes do WHOQOL-BREF.
 * 3. Utiliza exclusão listwise, incluindo apenas participantes que responderam a todos os itens do domínio.
 * 4. Aplica a fórmula padrão de variância para o Alfa de Cronbach. Nenhum "peso" especial é usado.
 *
 * @param participants Array com todos os participantes.
 * @param itemIds Array com os IDs das questões (ex: ['Q3', 'Q4', ...]) que compõem a escala a ser analisada.
 * @returns Um objeto com os resultados da análise de confiabilidade.
 */
export const performCronbachsAlpha = (participants: Participant[], itemIds: string[]): ReliabilityResult | { message: string } => {
    const k = itemIds.length; // Número de itens na escala
    if (k < 2) {
        return { message: "São necessários pelo menos 2 itens para calcular o Alfa de Cronbach." };
    }

    const invertScore = (score: number): number => 6 - score;

    // Etapa 1: Preparar a matriz de dados (linhas=participantes, colunas=itens)
    // Incluir apenas participantes com dados completos para todos os itens da escala (exclusão listwise).
    const dataMatrix: number[][] = [];
    participants.forEach(p => {
        if (p.whoqol) {
            const participantResponses: number[] = [];
            let hasAllResponses = true;
            for (const itemId of itemIds) {
                let score = p.whoqol[itemId];
                if (score === undefined || score === null) {
                    hasAllResponses = false;
                    break;
                }
                // Inverter escore para itens negativos
                if (NEGATIVE_QUESTIONS.has(itemId)) {
                    score = invertScore(score);
                }
                participantResponses.push(score);
            }
            if (hasAllResponses) {
                dataMatrix.push(participantResponses);
            }
        }
    });

    const nParticipants = dataMatrix.length;
    if (nParticipants < 2) {
        return { message: "São necessários pelo menos 2 participantes com respostas completas para todos os itens do domínio." };
    }

    // Etapa 2: Calcular a variância de cada item (coluna)
    const itemVariances: number[] = [];
    for (let i = 0; i < k; i++) {
        const itemScores = dataMatrix.map(row => row[i]);
        itemVariances.push(calculateVariance(itemScores));
    }
    const sumOfItemVariances = itemVariances.reduce((sum, v) => sum + v, 0);

    // Etapa 3: Calcular a variância das pontuações totais de cada participante
    const totalScores = dataMatrix.map(row => row.reduce((sum, score) => sum + score, 0));
    const varianceOfTotalScores = calculateVariance(totalScores);

    // Etapa 4: Tratar caso especial de variância total zero
    if (varianceOfTotalScores === 0) {
        const allItemsHaveZeroVariance = itemVariances.every(v => v === 0);
        if (allItemsHaveZeroVariance) {
            // Se a variância total é 0 E todas as variâncias dos itens são 0, significa que todos
            // deram a mesma resposta para todos os itens. Consistência perfeita (mas trivial).
            return { testType: 'CronbachAlpha', alpha: 1.0, nItems: k, nParticipants };
        } else {
            // Se a variância total é 0 mas a dos itens não, implica correlações negativas fortes
            // que se anulam. A confiabilidade é efetivamente zero.
            return { testType: 'CronbachAlpha', alpha: 0.0, nItems: k, nParticipants };
        }
    }
    
    // Etapa 5: Aplicar a fórmula do Alfa de Cronbach
    const alpha = (k / (k - 1)) * (1 - (sumOfItemVariances / varianceOfTotalScores));

    // Etapa 6: Interpretar o resultado
    // Um alfa negativo é psicometricamente não interpretável e indica problemas sérios com a escala.
    // O valor não é limitado a 0 para que a interface possa detectar e alertar o usuário.
    return { testType: 'CronbachAlpha', alpha: alpha, nItems: k, nParticipants };
};

/**
 * Performs a Mann-Whitney U test for two independent samples.
 * @param sample1 Array of numbers for the first sample.
 * @param sample2 Array of numbers for the second sample.
 * @param groupNames Names of the two groups.
 * @returns An object with the test results.
 */
export const performMannWhitneyUTest = (sample1: number[], sample2: number[], groupNames: [string, string]): AdvancedTestResult => {
    const n1 = sample1.length;
    const n2 = sample2.length;

    if (n1 < 3 || n2 < 3) return { testType: 'NotEnoughData', message: 'Cada grupo deve ter pelo menos 3 pontos de dados para o Teste de Mann-Whitney U.' };

    const combined = [...sample1, ...sample2];
    const ranks = rank(combined);
    
    const ranks1 = ranks.slice(0, n1);
    const sumRanks1 = ranks1.reduce((a, b) => a + b, 0);

    const u1 = sumRanks1 - (n1 * (n1 + 1)) / 2;
    const u2 = n1 * n2 - u1;
    const uValue = Math.min(u1, u2);

    // Normal approximation for p-value
    const meanU = (n1 * n2) / 2;
    const stdDevU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
    
    // Using continuity correction
    const z = stdDevU > 0 ? (uValue - meanU + 0.5) / stdDevU : 0;
    const pValue = calculatePValueFromZ(z);

    return { testType: 'MannWhitneyU', uValue, pValue, groupNames, isSignificant: pValue < 0.05 };
};


/**
 * Performs a Kruskal-Wallis H test for three or more independent samples.
 * @param groups An array of arrays, where each subarray is a group of samples.
 * @returns An object with the test results.
 */
export const performKruskalWallisTest = (groups: number[][]): AdvancedTestResult => {
    const k = groups.length;
    if (k < 2) return { testType: 'Error', message: 'O Teste de Kruskal-Wallis requer pelo menos 2 grupos.' };

    const n_i = groups.map(g => g.length);
    const N = n_i.reduce((a, b) => a + b, 0);
    if (N < 3) return { testType: 'NotEnoughData', message: 'Dados insuficientes para o teste.' };

    // Combine all data to rank them
    const combinedData: { value: number, groupIndex: number }[] = [];
    groups.forEach((group, index) => {
        group.forEach(val => combinedData.push({ value: val, groupIndex: index }));
    });

    // Sort by value to assign ranks
    combinedData.sort((a, b) => a.value - b.value);

    // Assign ranks (handling ties)
    const ranks = new Array(N).fill(0);
    let i = 0;
    while (i < N) {
        let j = i;
        while (j < N - 1 && combinedData[j + 1].value === combinedData[i].value) {
            j++;
        }
        const rankValue = (i + 1 + j + 1) / 2;
        for (let m = i; m <= j; m++) {
            ranks[m] = rankValue;
        }
        i = j + 1;
    }

    // Calculate sum of ranks for each group
    const rankSums = new Array(k).fill(0);
    combinedData.forEach((item, index) => {
        rankSums[item.groupIndex] += ranks[index];
    });

    // Calculate H statistic
    // H = (12 / (N(N+1))) * Sum(Ri^2 / ni) - 3(N+1)
    let sumRiSqOverNi = 0;
    for (let g = 0; g < k; g++) {
        if (n_i[g] > 0) {
            sumRiSqOverNi += (rankSums[g] * rankSums[g]) / n_i[g];
        }
    }

    let hValue = (12 / (N * (N + 1))) * sumRiSqOverNi - 3 * (N + 1);

    // Tie correction
    // C = 1 - Sum(T^3 - T) / (N^3 - N)
    // Where T is the number of ties for each rank value
    let tieCorrectionSum = 0;
    i = 0;
    while (i < N) {
        let j = i;
        while (j < N - 1 && combinedData[j + 1].value === combinedData[i].value) {
            j++;
        }
        const T = j - i + 1;
        if (T > 1) {
            tieCorrectionSum += (Math.pow(T, 3) - T);
        }
        i = j + 1;
    }
    
    const correctionFactor = 1 - tieCorrectionSum / (Math.pow(N, 3) - N);
    if (correctionFactor > 0) {
        hValue /= correctionFactor;
    }

    const df = k - 1;
    const pValue = calculatePValueFromChi2(hValue, df);

    return {
        testType: 'KruskalWallis',
        hValue,
        pValue,
        df,
        isSignificant: pValue < 0.05
    };
};

/**
 * Performs a Simple Linear Regression.
 * @param x Array of independent variable values.
 * @param y Array of dependent variable values.
 * @returns An object with the regression results.
 */
export const performSimpleLinearRegression = (x: number[], y: number[]): AdvancedTestResult => {
    const n = x.length;
    if (n !== y.length || n < 3) return { testType: 'NotEnoughData', message: 'São necessários pelo menos 3 pares de dados para a Regressão Linear.' };

    const meanX = calculateMean(x);
    const meanY = calculateMean(y);

    let numerator = 0;
    let denominator = 0;
    let sumXSq = 0;
    let sumYSq = 0;
    let sumXY = 0;

    for (let i = 0; i < n; i++) {
        numerator += (x[i] - meanX) * (y[i] - meanY);
        denominator += Math.pow(x[i] - meanX, 2);
        sumXSq += x[i] * x[i];
        sumYSq += y[i] * y[i];
        sumXY += x[i] * y[i];
    }

    if (denominator === 0) return { testType: 'Error', message: 'A variância da variável independente é zero.' };

    const slope = numerator / denominator;
    const intercept = meanY - slope * meanX;

    // R-squared calculation
    const ssTotal = y.reduce((acc, val) => acc + Math.pow(val - meanY, 2), 0);
    const ssRes = y.reduce((acc, val, i) => {
        const pred = slope * x[i] + intercept;
        return acc + Math.pow(val - pred, 2);
    }, 0);
    
    // Avoid division by zero if ssTotal is 0 (e.g. all y values are the same)
    const rSquared = ssTotal === 0 ? 0 : 1 - (ssRes / ssTotal);

    // Significance test for slope
    // Standard error of the slope
    const s_yx = Math.sqrt(ssRes / (n - 2));
    const se_slope = s_yx / Math.sqrt(denominator);
    
    // t-statistic
    const tValue = se_slope === 0 ? 0 : slope / se_slope;
    const df = n - 2;
    const pValue = calculatePValueFromT(tValue, df);

    return {
        testType: 'Regression',
        slope,
        intercept,
        rSquared,
        pValue,
        isSignificant: pValue < 0.05,
        n
    };
};
