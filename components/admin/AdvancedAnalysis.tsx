
import React, { useState, useMemo, useEffect } from 'react';
import { Participant, DomainScores, SocioeconomicData, AdvancedTestResult, ReliabilityResult, CorrelationResult, PostHocResult, AnovaResult, TTestResult, ChiSquaredResult, ContingencyTable, MannWhitneyUTestResult, KruskalWallisTestResult, RegressionResult } from '../../types';
import { DOMAIN_LABELS, SOCIOECONOMIC_FIELDS, NUMERICAL_SOCIOECONOMIC_FIELDS, DOMAIN_QUESTIONS_MAP } from '../../constants';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { calculateDomainScores } from '../../lib/whoqol';
import { performAnova, performTTest, performCorrelation, performCronbachsAlpha, performChiSquaredTest, performMannWhitneyUTest, performKruskalWallisTest, performSimpleLinearRegression } from '../../lib/advanced-stats';
import { StyledTable, StyledThead, StyledTh, StyledTbody, StyledTd } from './shared/TableComponents';
import { TestTube2, Link2, Group, Database, TrendingUp, AlertTriangle, Info } from 'lucide-react';


interface AdvancedAnalysisProps {
  participants: Participant[];
}

// Tipo auxiliar para participantes com escores pré-calculados
type ParticipantWithScores = {
    id: string;
    socioeconomic: SocioeconomicData | undefined;
    scores: DomainScores | null;
    whoqol: Participant['whoqol'];
};

const categoricalFields = SOCIOECONOMIC_FIELDS.filter(f => f.type === 'select');
const domainOptions: { key: keyof DomainScores; label: string }[] = Object.entries(DOMAIN_LABELS).map(([key, label]) => ({
    key: key as keyof DomainScores,
    label,
}));
const reliabilityDomainOptions = domainOptions.filter(d => d.key !== 'overall' && d.key !== 'qualidadeDeVidaMedia');

// Combina campos socioeconômicos numéricos e escores de domínio para seleção em correlação/regressão
const numericVarOptions = [
    ...NUMERICAL_SOCIOECONOMIC_FIELDS.map(f => ({ key: f.id, label: `(Socio) ${f.label}`, type: 'socio' })),
    ...domainOptions.map(d => ({ key: d.key, label: `(Domínio) ${d.label}`, type: 'domain' }))
];


const MeanComparison: React.FC<{ participants: ParticipantWithScores[] }> = ({ participants }) => {
    const [dependentVar, setDependentVar] = useState<keyof DomainScores>('qualidadeDeVidaMedia');
    const [independentVar, setIndependentVar] = useState<keyof SocioeconomicData>('gender');
    const [result, setResult] = useState<AdvancedTestResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [runPostHoc, setRunPostHoc] = useState(true);
    const [useNonParametric, setUseNonParametric] = useState(false);

    // Limpa o resultado se as variáveis mudarem
    useEffect(() => { setResult(null); }, [dependentVar, independentVar, useNonParametric, runPostHoc]);

    // Pré-cálculo e Análise da Viabilidade do Teste
    const analysisPreview = useMemo(() => {
        const groups: { [key: string]: number } = {};
        let totalValidParticipants = 0;

        participants.forEach(p => {
            const groupValue = p.socioeconomic?.[independentVar];
            const outcomeValue = p.scores?.[dependentVar];
            
            if (groupValue && typeof outcomeValue === 'number' && !isNaN(outcomeValue)) {
                if (!groups[groupValue as string]) groups[groupValue as string] = 0;
                groups[groupValue as string]++;
                totalValidParticipants++;
            }
        });

        const validGroups = Object.entries(groups).filter(([_, count]) => count >= 3); // Mínimo de 3 por grupo
        const validGroupsCount = validGroups.length;
        
        let predictedTest = 'Análise Indisponível';
        if (validGroupsCount === 2) {
            predictedTest = useNonParametric ? 'Teste U de Mann-Whitney' : 'Teste T de Welch (Amostras Independentes)';
        } else if (validGroupsCount > 2) {
            predictedTest = useNonParametric ? 'Teste H de Kruskal-Wallis' : 'ANOVA One-Way (Análise de Variância)';
        }

        return {
            totalValidParticipants,
            validGroupsCount,
            groupDetails: validGroups.map(([g, c]) => `${g} (n=${c})`).join(', '),
            predictedTest,
            canRun: validGroupsCount >= 2
        };
    }, [participants, dependentVar, independentVar, useNonParametric]);


    const handleRunAnalysis = () => {
        setIsLoading(true);
        
        // Reagrupamento dos dados (lógica duplicada do preview mas necessária para extrair os arrays de dados)
        const groups: { [key: string]: number[] } = {};
        participants.forEach(p => {
            const groupValue = p.socioeconomic?.[independentVar];
            const outcomeValue = p.scores?.[dependentVar];

            if (groupValue && typeof outcomeValue === 'number' && !isNaN(outcomeValue)) {
                if (!groups[groupValue as string]) groups[groupValue as string] = [];
                groups[groupValue as string].push(outcomeValue);
            }
        });
        
        const validGroups = Object.entries(groups).filter(([, scores]) => scores.length >= 3);
        
        if (validGroups.length < 2) {
            setResult({ testType: 'NotEnoughData', message: 'Dados insuficientes. São necessários pelo menos dois grupos com 3 ou mais participantes cada.' });
            setIsLoading(false);
            return;
        }

        const groupData = validGroups.map(([, scores]) => scores);
        const groupNames = validGroups.map(([name]) => name);
        let testResult: AdvancedTestResult;

        if (useNonParametric) {
            if (groupData.length === 2) {
                testResult = performMannWhitneyUTest(groupData[0], groupData[1], groupNames as [string, string]);
            } else {
                testResult = performKruskalWallisTest(groupData);
            }
        } else {
            if (groupData.length === 2) {
                testResult = performTTest(groupData[0], groupData[1], groupNames as [string, string]);
            } else {
                testResult = performAnova(groupData, groupNames, runPostHoc);
            }
        }

        setResult(testResult);
        setIsLoading(false);
    };

    const renderPostHocTable = (postHoc: PostHocResult) => (
        <div className="mt-6">
            <h4 className="font-semibold text-lg mb-2 text-center">Teste Post-Hoc ({postHoc.method})</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                Comparações par a par com correção de Holm-Bonferroni.
            </p>
            <StyledTable>
                <StyledThead>
                    <StyledTh>Comparação de Grupos</StyledTh>
                    <StyledTh>Diferença das Médias</StyledTh>
                    <StyledTh>Valor-p (Ajustado)</StyledTh>
                </StyledThead>
                <StyledTbody>
                    {postHoc.pairs.map((pair, index) => (
                        <tr key={index} className={pair.isSignificant ? 'bg-green-50 dark:bg-green-900/20' : ''}>
                            <StyledTd>{pair.group1} vs {pair.group2}</StyledTd>
                            <StyledTd>{pair.meanDiff.toFixed(2)}</StyledTd>
                            <StyledTd className={pair.isSignificant ? 'font-bold' : ''}>
                                {pair.pValue < 0.001 ? '< 0.001' : pair.pValue.toFixed(3)}
                            </StyledTd>
                        </tr>
                    ))}
                </StyledTbody>
            </StyledTable>
        </div>
    );
    
    const getEffectSizeInterpretation = (testType: 'T-Test' | 'ANOVA', value: number) => {
        if (testType === 'T-Test') { // Cohen's d
            const d = Math.abs(value);
            if (d < 0.2) return 'Insignificante';
            if (d < 0.5) return 'Pequeno';
            if (d < 0.8) return 'Médio';
            return 'Grande';
        } else { // Eta-squared
            const eta = value;
            if (eta < 0.01) return 'Insignificante';
            if (eta < 0.06) return 'Pequeno';
            if (eta < 0.14) return 'Médio';
            return 'Grande';
        }
    };

    const renderResult = () => {
        if (isLoading) return <p className="text-center p-4">Calculando...</p>;
        if (!result) return null;
        if (result.testType === 'Error' || result.testType === 'NotEnoughData') return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">{result.message}</div>;

        if (!('isSignificant' in result) || !('pValue' in result)) {
            return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">Tipo de resultado de teste inesperado.</div>;
        }

        const pValueColor = result.isSignificant ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        const interpretationText = result.isSignificant
            ? `A análise encontrou uma diferença estatisticamente significativa nos escores de "${DOMAIN_LABELS[dependentVar]}" entre os diferentes grupos de "${SOCIOECONOMIC_FIELDS.find(f => f.id === independentVar)?.label}" (p < 0.05).`
            : `A análise não encontrou uma diferença estatisticamente significativa nos escores de "${DOMAIN_LABELS[dependentVar]}" entre os diferentes grupos de "${SOCIOECONOMIC_FIELDS.find(f => f.id === independentVar)?.label}" (p ≥ 0.05).`;
        
        return (
            <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">Interpretação</h4>
                    <p>{interpretationText}</p>
                    {result.testType === 'T-Test' && result.isSignificant && (
                        <p className="mt-2">O tamanho do efeito (d de Cohen) da diferença encontrada é considerado <strong>{getEffectSizeInterpretation('T-Test', (result as TTestResult).cohensD)}</strong>.</p>
                    )}
                    {result.testType === 'ANOVA' && result.isSignificant && (
                        <p className="mt-2">O tamanho do efeito (Eta-quadrado) da diferença encontrada é considerado <strong>{getEffectSizeInterpretation('ANOVA', (result as AnovaResult).etaSquared)}</strong>.</p>
                    )}
                </div>
                 <StyledTable>
                    <StyledThead><StyledTh>Métrica</StyledTh><StyledTh>Valor</StyledTh></StyledThead>
                    <StyledTbody>
                        <tr><StyledTd>Teste Realizado</StyledTd><StyledTd>{result.testType} {result.testType === 'T-Test' ? `(${(result as TTestResult).method})` : ''}</StyledTd></tr>
                        {(result.testType === 'T-Test' || result.testType === 'MannWhitneyU') && (
                            <tr><StyledTd>Grupos Comparados</StyledTd><StyledTd>{(result as TTestResult | MannWhitneyUTestResult).groupNames.join(' vs ')}</StyledTd></tr>
                        )}
                        {result.testType === 'T-Test' && (<>
                            <tr><StyledTd>Estatística t</StyledTd><StyledTd>{(result as TTestResult).tValue.toFixed(3)}</StyledTd></tr>
                            <tr><StyledTd>Graus de Liberdade (gl)</StyledTd><StyledTd>{(result as TTestResult).df}</StyledTd></tr>
                            <tr><StyledTd>Tamanho do Efeito (d de Cohen)</StyledTd><StyledTd>{(result as TTestResult).cohensD.toFixed(3)} ({getEffectSizeInterpretation('T-Test', (result as TTestResult).cohensD)})</StyledTd></tr>
                        </>)}
                        {result.testType === 'ANOVA' && (<>
                            <tr><StyledTd>Estatística F</StyledTd><StyledTd>{(result as AnovaResult).fValue.toFixed(3)}</StyledTd></tr>
                            <tr><StyledTd>Graus de Liberdade (entre/dentro)</StyledTd><StyledTd>{(result as AnovaResult).dfBetween} / {(result as AnovaResult).dfWithin}</StyledTd></tr>
                            <tr><StyledTd>Tamanho do Efeito (Eta-quadrado, η²)</StyledTd><StyledTd>{(result as AnovaResult).etaSquared.toFixed(3)} ({getEffectSizeInterpretation('ANOVA', (result as AnovaResult).etaSquared)})</StyledTd></tr>
                            <tr><StyledTd>Tamanho do Efeito (Omega-quadrado, ω²)</StyledTd><StyledTd>{((result as AnovaResult).omegaSquared ?? 0).toFixed(3)}</StyledTd></tr>
                         </>)}
                        {result.testType === 'MannWhitneyU' && (
                            <tr><StyledTd>Estatística U</StyledTd><StyledTd>{(result as MannWhitneyUTestResult).uValue.toFixed(1)}</StyledTd></tr>
                        )}
                        {result.testType === 'KruskalWallis' && (<>
                            <tr><StyledTd>Estatística H</StyledTd><StyledTd>{(result as KruskalWallisTestResult).hValue.toFixed(3)}</StyledTd></tr>
                            <tr><StyledTd>Graus de Liberdade (gl)</StyledTd><StyledTd>{(result as KruskalWallisTestResult).df}</StyledTd></tr>
                        </>)}
                        <tr><StyledTd><strong>Valor-p</strong></StyledTd><StyledTd className={`font-bold ${pValueColor}`}>{result.pValue < 0.001 ? '< 0.001' : result.pValue.toFixed(3)}</StyledTd></tr>
                    </StyledTbody>
                 </StyledTable>
                 {result.testType === 'ANOVA' && result.isSignificant && (result as AnovaResult).postHoc && renderPostHocTable((result as AnovaResult).postHoc!)}
            </div>
        );
    };

    return (
        <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Use esta análise para verificar se existe uma <strong>diferença estatisticamente significativa</strong> entre as médias de uma <strong>métrica de qualidade de vida</strong> em diferentes <strong>grupos categóricos</strong> (ex: Gênero, Escolaridade). O sistema seleciona automaticamente o teste mais adequado (Teste T ou ANOVA) com base no número de grupos encontrados.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4">
                <div>
                    <label htmlFor="dependent-var" className="block text-sm font-medium">1. Métrica de Qualidade de Vida (Dependente)</label>
                    <select id="dependent-var" value={dependentVar} onChange={(e) => setDependentVar(e.target.value as keyof DomainScores)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                       {domainOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="independent-var" className="block text-sm font-medium">2. Variável de Agrupamento (Independente)</label>
                    <select id="independent-var" value={independentVar} onChange={(e) => setIndependentVar(e.target.value as keyof SocioeconomicData)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                       {categoricalFields.map(field => <option key={field.id} value={field.id}>{field.label}</option>)}
                    </select>
                </div>
            </div>
            
            {/* Painel de Previsão da Análise */}
            <div className={`p-4 rounded-md mb-6 text-sm border ${analysisPreview.canRun ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                <div className="flex items-start gap-3">
                    <Info className={`flex-shrink-0 h-5 w-5 ${analysisPreview.canRun ? 'text-blue-500' : 'text-red-500'}`} />
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Previsão da Análise:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                            <li>Grupos válidos (n ≥ 3) identificados: <strong>{analysisPreview.validGroupsCount}</strong> <span className="text-xs text-gray-500">({analysisPreview.groupDetails})</span></li>
                            <li>Teste estatístico a ser aplicado: <strong>{analysisPreview.predictedTest}</strong></li>
                        </ul>
                         {!analysisPreview.canRun && (
                             <p className="text-red-600 dark:text-red-400 mt-2 font-medium">
                                 Atenção: Dados insuficientes. São necessários pelo menos 2 grupos com no mínimo 3 participantes cada.
                             </p>
                         )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mb-6">
                 <div className="flex items-center space-x-2 pt-2">
                    <input
                        type="checkbox"
                        id="use-nonparametric"
                        checked={useNonParametric}
                        onChange={(e) => setUseNonParametric(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="use-nonparametric" className="text-sm font-medium">
                        Usar teste não paramétrico (Mann-Whitney U / Kruskal-Wallis)
                    </label>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <input
                        type="checkbox"
                        id="run-posthoc"
                        name="runPostHoc"
                        checked={runPostHoc}
                        onChange={(e) => setRunPostHoc(e.target.checked)}
                        disabled={useNonParametric || analysisPreview.validGroupsCount < 3}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <label htmlFor="run-posthoc" className={`text-sm font-medium ${useNonParametric || analysisPreview.validGroupsCount < 3 ? 'text-gray-400 dark:text-gray-500' : ''}`}>
                        Executar teste post-hoc (Holm-Bonferroni) se ANOVA for significativa
                    </label>
                </div>
            </div>
            <div className="flex justify-center mb-6"><Button onClick={handleRunAnalysis} disabled={isLoading || !analysisPreview.canRun}>{isLoading ? 'Calculando...' : 'Executar Análise'}</Button></div>
            {result && <div className="border-t border-gray-200 dark:border-gray-700 pt-6"><h3 className="text-lg font-semibold text-center mb-4">Resultados</h3>{renderResult()}</div>}
        </div>
    );
};

const CorrelationAnalysis: React.FC<{ participants: ParticipantWithScores[] }> = ({ participants }) => {
    const [var1, setVar1] = useState<string>('age'); // Pode ser ID socioeconômico ou ID de domínio
    const [var2, setVar2] = useState<keyof DomainScores>('qualidadeDeVidaMedia');
    const [result, setResult] = useState<CorrelationResult | { message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => { setResult(null); }, [var1, var2]);

    // Pré-cálculo
    const analysisPreview = useMemo(() => {
        let validPairs = 0;
        const var1Option = numericVarOptions.find(o => o.key === var1);
        participants.forEach(p => {
            let val1: number | undefined;
            if (var1Option?.type === 'socio') {
                const rawVal = p.socioeconomic?.[var1];
                if (typeof rawVal === 'number') val1 = rawVal;
            } else if (var1Option?.type === 'domain') {
                val1 = p.scores?.[var1 as keyof DomainScores];
            }
            const val2 = p.scores?.[var2];
            if (typeof val1 === 'number' && typeof val2 === 'number' && !isNaN(val1) && !isNaN(val2)) {
                validPairs++;
            }
        });
        return { validPairs, canRun: validPairs >= 3 };
    }, [participants, var1, var2]);

    const handleRunAnalysis = () => {
        setIsLoading(true);
        const data1: number[] = [];
        const data2: number[] = [];
        const var1Option = numericVarOptions.find(o => o.key === var1);

        participants.forEach(p => {
            let val1: number | undefined;
            if (var1Option?.type === 'socio') {
                const rawVal = p.socioeconomic?.[var1];
                if (typeof rawVal === 'number') val1 = rawVal;
            } else if (var1Option?.type === 'domain') {
                val1 = p.scores?.[var1 as keyof DomainScores];
            }
            const val2 = p.scores?.[var2];
            if (typeof val1 === 'number' && typeof val2 === 'number' && !isNaN(val1) && !isNaN(val2)) {
                data1.push(val1);
                data2.push(val2);
            }
        });

        if (data1.length < 3) {
            setResult({ message: 'Dados insuficientes. São necessários pelo menos 3 pares de dados válidos.' });
            setIsLoading(false);
            return;
        }

        setResult(performCorrelation(data1, data2));
        setIsLoading(false);
    };

    const renderResult = () => {
        if (isLoading) return <p className="text-center p-4">Calculando...</p>;
        if (!result) return null;
        if ('message' in result) return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">{result.message}</div>;

        let interpretation = '';
        if (result.isSignificant) {
            const strength = Math.abs(result.rValue) < 0.3 ? 'fraca' : Math.abs(result.rValue) < 0.7 ? 'moderada' : 'forte';
            const direction = result.rValue > 0 ? 'positiva' : 'negativa';
            interpretation = `Há uma correlação estatisticamente significativa, ${strength} e ${direction} (r = ${result.rValue.toFixed(3)}, p < 0.05).`;
        } else {
            interpretation = `Não foi encontrada uma correlação estatisticamente significativa entre as variáveis (p ≥ 0.05).`;
        }

        return (
            <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><h4 className="font-semibold text-lg mb-2">Interpretação</h4><p>{interpretation}</p></div>
                <StyledTable>
                    <StyledThead><StyledTh>Métrica</StyledTh><StyledTh>Valor</StyledTh></StyledThead>
                    <StyledTbody>
                        <tr><StyledTd>Coeficiente de Correlação de Pearson (r)</StyledTd><StyledTd>{result.rValue.toFixed(3)}</StyledTd></tr>
                         <tr><StyledTd>Coeficiente de Determinação (r²)</StyledTd><StyledTd>{((result.rSquared ?? 0) * 100).toFixed(1)}%</StyledTd></tr>
                        <tr><StyledTd><strong>Valor-p</strong></StyledTd><StyledTd className={`font-bold ${result.isSignificant ? 'text-green-600' : 'text-red-600'}`}>{result.pValue < 0.001 ? '< 0.001' : result.pValue.toFixed(3)}</StyledTd></tr>
                        <tr><StyledTd>Número de Pares (n)</StyledTd><StyledTd>{result.n}</StyledTd></tr>
                    </StyledTbody>
                </StyledTable>
            </div>
        );
    };
    
    return (
        <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Use esta análise para medir a força e a direção da <strong>relação entre duas variáveis numéricas contínuas</strong> (ex: Idade vs. Escore Físico, ou Físico vs. Psicológico). O resultado é o Coeficiente de Correlação de Pearson (r), que varia de -1 a +1.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4">
                <div>
                    <label htmlFor="corr-var1" className="block text-sm font-medium">Variável 1</label>
                    <select id="corr-var1" value={var1} onChange={(e) => setVar1(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        {numericVarOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="corr-var2" className="block text-sm font-medium">Variável 2 (Domínio)</label>
                    <select id="corr-var2" value={var2} onChange={(e) => setVar2(e.target.value as keyof DomainScores)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                       {domainOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                    </select>
                </div>
            </div>
            
             <div className={`p-4 rounded-md mb-6 text-sm border ${analysisPreview.canRun ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                 <p>Pares de dados válidos identificados: <strong>{analysisPreview.validPairs}</strong></p>
                 {!analysisPreview.canRun && <p className="text-red-600 dark:text-red-400 mt-1">Dados insuficientes (mínimo 3 pares).</p>}
            </div>

            <div className="flex justify-center mb-6"><Button onClick={handleRunAnalysis} disabled={isLoading || !analysisPreview.canRun}>{isLoading ? 'Calculando...' : 'Executar Análise'}</Button></div>
            {result && <div className="border-t border-gray-200 dark:border-gray-700 pt-6"><h3 className="text-lg font-semibold text-center mb-4">Resultados</h3>{renderResult()}</div>}
        </div>
    );
};

const RegressionAnalysis: React.FC<{ participants: ParticipantWithScores[] }> = ({ participants }) => {
    const [predictorVar, setPredictorVar] = useState<string>('age');
    const [outcomeVar, setOutcomeVar] = useState<keyof DomainScores>('qualidadeDeVidaMedia');
    const [result, setResult] = useState<AdvancedTestResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => { setResult(null); }, [predictorVar, outcomeVar]);

    const analysisPreview = useMemo(() => {
        let validPairs = 0;
        const predictorOption = numericVarOptions.find(o => o.key === predictorVar);
        participants.forEach(p => {
            let predictor: number | undefined;
            if (predictorOption?.type === 'socio') {
                 const rawVal = p.socioeconomic?.[predictorVar];
                 if (typeof rawVal === 'number') predictor = rawVal;
            } else if (predictorOption?.type === 'domain') {
                 predictor = p.scores?.[predictorVar as keyof DomainScores];
            }
            const outcome = p.scores?.[outcomeVar];
            if (typeof predictor === 'number' && typeof outcome === 'number' && !isNaN(predictor) && !isNaN(outcome)) {
                validPairs++;
            }
        });
        return { validPairs, canRun: validPairs >= 3 };
    }, [participants, predictorVar, outcomeVar]);

    const handleRunAnalysis = () => {
        setIsLoading(true);
        const x: number[] = [];
        const y: number[] = [];
        const predictorOption = numericVarOptions.find(o => o.key === predictorVar);

        participants.forEach(p => {
            let predictor: number | undefined;
            if (predictorOption?.type === 'socio') {
                const rawVal = p.socioeconomic?.[predictorVar];
                if (typeof rawVal === 'number') predictor = rawVal;
            } else if (predictorOption?.type === 'domain') {
                predictor = p.scores?.[predictorVar as keyof DomainScores];
            }
            const outcome = p.scores?.[outcomeVar];
            if (typeof predictor === 'number' && typeof outcome === 'number' && !isNaN(predictor) && !isNaN(outcome)) {
                x.push(predictor);
                y.push(outcome);
            }
        });

        setResult(performSimpleLinearRegression(x, y));
        setIsLoading(false);
    };

    const renderResult = () => {
        if (isLoading) return <p className="text-center p-4">Calculando...</p>;
        if (!result) return null;
        if (result.testType === 'Error' || result.testType === 'NotEnoughData') return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">{result.message}</div>;
        if (result.testType !== 'Regression') return null;

        const regResult = result as RegressionResult;
        const predictorLabel = numericVarOptions.find(f => f.key === predictorVar)?.label || predictorVar;
        const outcomeLabel = DOMAIN_LABELS[outcomeVar] || outcomeVar;

        const interpretation = `A análise ${regResult.isSignificant ? 'encontrou' : 'não encontrou'} uma relação de predição estatisticamente significativa entre "${predictorLabel}" e "${outcomeLabel}" (p ${regResult.isSignificant ? '<' : '≥'} 0.05). O modelo de regressão explica ${(regResult.rSquared * 100).toFixed(1)}% da variância em "${outcomeLabel}". ${regResult.isSignificant ? `Para cada aumento de uma unidade em ${predictorLabel}, espera-se que ${outcomeLabel} ${regResult.slope >= 0 ? 'aumente' : 'diminua'} em ${Math.abs(regResult.slope).toFixed(3)} pontos.` : ''}`;
        
        const pValueColor = regResult.isSignificant ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        
        return (
            <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">Interpretação</h4>
                    <p>{interpretation}</p>
                </div>
                <StyledTable>
                    <StyledThead><StyledTh>Métrica</StyledTh><StyledTh>Valor</StyledTh></StyledThead>
                    <StyledTbody>
                        <tr><StyledTd>Intercepto (b₀)</StyledTd><StyledTd>{regResult.intercept.toFixed(3)}</StyledTd></tr>
                        <tr><StyledTd>Coeficiente de {predictorLabel} (b₁)</StyledTd><StyledTd>{regResult.slope.toFixed(3)}</StyledTd></tr>
                        <tr><StyledTd>R-quadrado (R²)</StyledTd><StyledTd>{regResult.rSquared.toFixed(3)}</StyledTd></tr>
                        <tr><StyledTd><strong>Valor-p do Modelo</strong></StyledTd><StyledTd className={`font-bold ${pValueColor}`}>{regResult.pValue < 0.001 ? '< 0.001' : regResult.pValue.toFixed(3)}</StyledTd></tr>
                        <tr><StyledTd>Número de Pares (n)</StyledTd><StyledTd>{regResult.n}</StyledTd></tr>
                    </StyledTbody>
                </StyledTable>
                 <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
                    <p>Equação da Regressão: <strong>{outcomeLabel} = {regResult.intercept.toFixed(2)} + ({regResult.slope.toFixed(2)} * {predictorLabel})</strong></p>
                </div>
            </div>
        );
    };

    return (
        <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Use a <strong>Regressão Linear Simples</strong> para modelar a relação entre uma variável <strong>preditora</strong> (independente, ex: Idade ou Escore Físico) e uma variável de <strong>desfecho</strong> (dependente, ex: Escore Psicológico). A análise determina se a variável preditora pode prever significativamente o desfecho.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4">
                <div>
                    <label htmlFor="reg-predictor" className="block text-sm font-medium">1. Variável Preditora (Independente)</label>
                    <select id="reg-predictor" value={predictorVar} onChange={(e) => setPredictorVar(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        {numericVarOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="reg-outcome" className="block text-sm font-medium">2. Variável de Desfecho (Dependente)</label>
                    <select id="reg-outcome" value={outcomeVar} onChange={(e) => setOutcomeVar(e.target.value as keyof DomainScores)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        {domainOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                    </select>
                </div>
            </div>

            <div className={`p-4 rounded-md mb-6 text-sm border ${analysisPreview.canRun ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                 <p>Pares de dados válidos identificados: <strong>{analysisPreview.validPairs}</strong></p>
                 {!analysisPreview.canRun && <p className="text-red-600 dark:text-red-400 mt-1">Dados insuficientes (mínimo 3 pares).</p>}
            </div>

            <div className="flex justify-center mb-6"><Button onClick={handleRunAnalysis} disabled={isLoading || !analysisPreview.canRun}>{isLoading ? 'Calculando...' : 'Executar Análise'}</Button></div>
            {result && <div className="border-t border-gray-200 dark:border-gray-700 pt-6"><h3 className="text-lg font-semibold text-center mb-4">Resultados</h3>{renderResult()}</div>}
        </div>
    );
};


const ReliabilityAnalysis: React.FC<{ participants: ParticipantWithScores[] }> = ({ participants }) => {
    const [domain, setDomain] = useState<keyof DomainScores>('physical');
    const [result, setResult] = useState<ReliabilityResult | { message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => { setResult(null); }, [domain]);
    
    const analysisPreview = useMemo(() => {
         const questionIds = DOMAIN_QUESTIONS_MAP[domain as keyof typeof DOMAIN_QUESTIONS_MAP];
         let validParticipants = 0;
         if (questionIds) {
             validParticipants = participants.filter(p => {
                 return p.whoqol && questionIds.every(qId => p.whoqol?.[qId] !== undefined);
             }).length;
         }
         return { validParticipants, canRun: validParticipants >= 2 && (questionIds?.length || 0) >= 2 };
    }, [participants, domain]);


    const handleRunAnalysis = () => {
        setIsLoading(true);
        
        const questionIds = DOMAIN_QUESTIONS_MAP[domain as keyof typeof DOMAIN_QUESTIONS_MAP];
        if (!questionIds || questionIds.length < 2) {
             setResult({ message: 'Este domínio não possui itens suficientes para análise de confiabilidade.' });
             setIsLoading(false);
             return;
        }

        // Reconstruindo o array de participantes originais a partir do wrapper, pois o cálculo do alpha precisa dos dados brutos whoqol
        const originalParticipants = participants.map(p => ({ whoqol: p.whoqol } as Participant));

        setResult(performCronbachsAlpha(originalParticipants, questionIds));
        setIsLoading(false);
    };

    const renderResult = () => {
        if (isLoading) return <p className="text-center p-4">Calculando...</p>;
        if (!result) return null;
        if ('message' in result) return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">{result.message}</div>;

        let interpretation: React.ReactNode;
        let interpretationCardClass = "p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg";

        if (result.alpha < 0) {
            interpretationCardClass = "p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-lg";
            interpretation = (
                <>
                    <p className="font-bold text-red-800 dark:text-red-200">Resultado Inválido: Alfa de Cronbach Negativo</p>
                    <p className="mt-2">
                        Um valor de alfa negativo indica problemas sérios com os dados ou a estrutura da escala. As causas comuns incluem:
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm">
                        <li><strong>Inversão incorreta de itens:</strong> Questões com sentido negativo (ex: Q3, Q4, Q26) podem não ter sido codificadas corretamente. A ferramenta faz isso automaticamente, mas a importação de dados externos pode ser uma fonte de erro.</li>
                        <li><strong>Inconsistência nos dados:</strong> Os itens do domínio não medem o mesmo construto, tendo correlações negativas entre si.</li>
                        <li><strong>Amostra pequena ou com pouca variabilidade.</strong></li>
                    </ul>
                    <p className="mt-2">
                        Recomenda-se revisar os dados brutos dos participantes para este domínio.
                    </p>
                </>
            );
        } else if (result.alpha < 0.6) {
            interpretation = `A consistência interna para o domínio "${DOMAIN_LABELS[domain]}" é Ruim. Valores abaixo de 0.60 indicam que os itens não medem o mesmo construto de forma consistente. Considere revisar os itens ou a adequação da escala para sua amostra.`;
        } else if (result.alpha < 0.7) {
            interpretation = `A consistência interna para o domínio "${DOMAIN_LABELS[domain]}" é Questionável. Embora às vezes seja aceito em pesquisas exploratórias, este valor é considerado baixo.`;
        } else if (result.alpha < 0.8) {
            interpretation = `A consistência interna para o domínio "${DOMAIN_LABELS[domain]}" é Aceitável.`;
        } else if (result.alpha < 0.9) {
            interpretation = `A consistência interna para o domínio "${DOMAIN_LABELS[domain]}" é Boa.`;
        } else {
            interpretation = `A consistência interna para o domínio "${DOMAIN_LABELS[domain]}" é Excelente.`;
        }

        const alphaColor = result.alpha >= 0.7 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

        return (
            <div className="space-y-4">
                <div className={interpretationCardClass}>
                    <h4 className="font-semibold text-lg mb-2">Interpretação</h4>
                    <div>{interpretation}</div>
                </div>
                <StyledTable>
                    <StyledThead><StyledTh>Métrica</StyledTh><StyledTh>Valor</StyledTh></StyledThead>
                    <StyledTbody>
                        <tr><StyledTd><strong>Alfa de Cronbach (α)</strong></StyledTd><StyledTd className={`font-bold ${alphaColor}`}>{result.alpha.toFixed(3)}</StyledTd></tr>
                        <tr><StyledTd>Número de Itens (Questões)</StyledTd><StyledTd>{result.nItems}</StyledTd></tr>
                        <tr><StyledTd>Número de Participantes (Dados Completos)</StyledTd><StyledTd>{result.nParticipants}</StyledTd></tr>
                    </StyledTbody>
                </StyledTable>
            </div>
        );
    };

    return (
        <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Use esta análise para calcular o <strong>Alfa de Cronbach</strong>, uma métrica que avalia a confiabilidade (consistência interna) dos itens que compõem um domínio do questionário. Um valor de α ≥ 0.70 é geralmente considerado aceitável.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4">
                <div>
                    <label htmlFor="reliability-domain" className="block text-sm font-medium">Selecione o Domínio</label>
                    <select id="reliability-domain" value={domain} onChange={(e) => setDomain(e.target.value as keyof DomainScores)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        {reliabilityDomainOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                    </select>
                </div>
            </div>

            <div className={`p-4 rounded-md mb-6 text-sm border ${analysisPreview.canRun ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                 <p>Participantes com dados completos para este domínio: <strong>{analysisPreview.validParticipants}</strong></p>
                 {!analysisPreview.canRun && <p className="text-red-600 dark:text-red-400 mt-1">Dados insuficientes (mínimo 2 participantes com respostas completas).</p>}
            </div>

            <div className="flex justify-center mb-6"><Button onClick={handleRunAnalysis} disabled={isLoading || !analysisPreview.canRun}>{isLoading ? 'Calculando...' : 'Executar Análise'}</Button></div>
            {result && <div className="border-t border-gray-200 dark:border-gray-700 pt-6"><h3 className="text-lg font-semibold text-center mb-4">Resultados</h3>{renderResult()}</div>}
        </div>
    );
};

const ChiSquaredAnalysis: React.FC<{ participants: ParticipantWithScores[] }> = ({ participants }) => {
    const [var1, setVar1] = useState<keyof SocioeconomicData>('gender');
    const [var2, setVar2] = useState<keyof SocioeconomicData>('education');
    const [result, setResult] = useState<AdvancedTestResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => { setResult(null); }, [var1, var2]);

    const handleRunAnalysis = () => {
        setIsLoading(true);

        if (var1 === var2) {
            setResult({ testType: 'Error', message: 'As variáveis selecionadas devem ser diferentes.' });
            setIsLoading(false);
            return;
        }

        const originalParticipants = participants.map(p => ({ socioeconomic: p.socioeconomic } as Participant));
        const testResult = performChiSquaredTest(originalParticipants, var1, var2);
        setResult(testResult);
        setIsLoading(false);
    };

    const renderContingencyTable = (table: ContingencyTable) => (
        <div className="mt-6">
            <h4 className="font-semibold text-lg mb-2 text-center">Tabela de Contingência (Frequências Observadas)</h4>
            <StyledTable>
                <StyledThead>
                    <StyledTh>&nbsp;</StyledTh>
                    {table.headers.cols.map(col => <StyledTh key={col}>{col}</StyledTh>)}
                    <StyledTh>Total</StyledTh>
                </StyledThead>
                <StyledTbody>
                    {table.headers.rows.map((row, rIdx) => (
                        <tr key={row}>
                            <StyledTd className="font-semibold">{row}</StyledTd>
                            {table.data[rIdx].map((cell, cIdx) => <StyledTd key={cIdx}>{cell}</StyledTd>)}
                            <StyledTd className="font-bold">{table.rowTotals[rIdx]}</StyledTd>
                        </tr>
                    ))}
                    <tr className="bg-gray-50 dark:bg-gray-700 font-bold">
                        <StyledTd>Total</StyledTd>
                        {table.colTotals.map((total, cIdx) => <StyledTd key={cIdx}>{total}</StyledTd>)}
                        <StyledTd>{table.grandTotal}</StyledTd>
                    </tr>
                </StyledTbody>
            </StyledTable>
        </div>
    );
    
    const renderResult = () => {
        if (isLoading) return <p className="text-center p-4">Calculando...</p>;
        if (!result) return null;
        if (result.testType === 'Error' || result.testType === 'NotEnoughData') return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">{result.message}</div>;

        if (result.testType !== 'ChiSquared') return null;
        
        const chi2Result = result as ChiSquaredResult;
        const var1Label = SOCIOECONOMIC_FIELDS.find(f => f.id === var1)?.label;
        const var2Label = SOCIOECONOMIC_FIELDS.find(f => f.id === var2)?.label;

        const interpretation = chi2Result.isSignificant
            ? `A análise encontrou uma associação estatisticamente significativa entre "${var1Label}" e "${var2Label}" (p < 0.05). Isso sugere que as variáveis não são independentes.`
            : `A análise não encontrou uma associação estatisticamente significativa entre "${var1Label}" e "${var2Label}" (p ≥ 0.05). Isso sugere que as variáveis são independentes.`;

        const pValueColor = chi2Result.isSignificant ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

        return (
            <div className="space-y-4">
                {chi2Result.warning && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700"><strong>Atenção:</strong> {chi2Result.warning}</p>
                            </div>
                        </div>
                    </div>
                )}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><h4 className="font-semibold text-lg mb-2">Interpretação</h4><p>{interpretation}</p></div>
                <StyledTable>
                    <StyledThead><StyledTh>Métrica</StyledTh><StyledTh>Valor</StyledTh></StyledThead>
                    <StyledTbody>
                        <tr><StyledTd>Estatística Qui-Quadrado (χ²)</StyledTd><StyledTd>{chi2Result.chi2Value.toFixed(3)}</StyledTd></tr>
                        <tr><StyledTd>Graus de Liberdade (gl)</StyledTd><StyledTd>{chi2Result.df}</StyledTd></tr>
                        <tr><StyledTd><strong>Valor-p</strong></StyledTd><StyledTd className={`font-bold ${pValueColor}`}>{chi2Result.pValue < 0.001 ? '< 0.001' : chi2Result.pValue.toFixed(3)}</StyledTd></tr>
                    </StyledTbody>
                </StyledTable>
                {renderContingencyTable(chi2Result.contingencyTable)}
            </div>
        );
    };

    return (
        <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Use o <strong>Teste Qui-Quadrado (χ²) de Independência</strong> para determinar se há uma <strong>associação significativa entre duas variáveis categóricas</strong> (ex: Escolaridade e Renda). Ele compara as frequências observadas com as frequências que seriam esperadas se as variáveis fossem independentes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-6">
                <div>
                    <label htmlFor="chi2-var1" className="block text-sm font-medium">Variável 1 (Linhas)</label>
                    <select id="chi2-var1" value={var1} onChange={(e) => setVar1(e.target.value as keyof SocioeconomicData)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        {categoricalFields.map(field => <option key={field.id} value={field.id}>{field.label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="chi2-var2" className="block text-sm font-medium">Variável 2 (Colunas)</label>
                    <select id="chi2-var2" value={var2} onChange={(e) => setVar2(e.target.value as keyof SocioeconomicData)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        {categoricalFields.map(field => <option key={field.id} value={field.id}>{field.label}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-center mb-6"><Button onClick={handleRunAnalysis} disabled={isLoading}>{isLoading ? 'Calculando...' : 'Executar Análise'}</Button></div>
            {result && <div className="border-t border-gray-200 dark:border-gray-700 pt-6"><h3 className="text-lg font-semibold text-center mb-4">Resultados</h3>{renderResult()}</div>}
        </div>
    );
};


const AdvancedAnalysis: React.FC<AdvancedAnalysisProps> = ({ participants }) => {
    const [activeTab, setActiveTab] = useState<'comparison' | 'correlation' | 'regression' | 'association' | 'reliability'>('comparison');

    // Memoiza os escores dos participantes para evitar recálculos frequentes nas abas
    const participantsWithScores: ParticipantWithScores[] = useMemo(() => {
        return participants.map(p => ({
            id: p.id,
            socioeconomic: p.socioeconomic,
            scores: p.whoqol ? calculateDomainScores(p.whoqol) : null,
            whoqol: p.whoqol
        }));
    }, [participants]);

    const TABS = [
        { id: 'comparison' as const, label: 'Análise de Grupos', icon: Group },
        { id: 'correlation' as const, label: 'Análise de Correlação', icon: Link2 },
        { id: 'regression' as const, label: 'Análise de Regressão', icon: TrendingUp },
        { id: 'association' as const, label: 'Análise de Associação (χ²)', icon: Database },
        { id: 'reliability' as const, label: 'Análise de Confiabilidade', icon: TestTube2 },
    ];
    
    const renderActiveTab = () => {
        switch (activeTab) {
            case 'comparison': return <MeanComparison participants={participantsWithScores} />;
            case 'correlation': return <CorrelationAnalysis participants={participantsWithScores} />;
            case 'regression': return <RegressionAnalysis participants={participantsWithScores} />;
            case 'association': return <ChiSquaredAnalysis participants={participantsWithScores} />;
            case 'reliability': return <ReliabilityAnalysis participants={participantsWithScores} />;
            default: return null;
        }
    }

    return (
        <Card>
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'} flex items-center whitespace-nowrap py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors`}>
                        <tab.icon className="h-5 w-5 sm:mr-2" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                    ))}
                </nav>
            </div>
            <div>
                {renderActiveTab()}
            </div>
        </Card>
    );
};

export default AdvancedAnalysis;
