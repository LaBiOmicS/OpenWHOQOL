import React, { useState } from 'react';
import { Participant, DomainScores, SocioeconomicData } from '../../types';
import { getLikertScaleForQuestion } from '../../lib/whoqol';
import { calculateScoresByGroup, calculateWhoqolQuestionFrequencies, formatNumber } from '../../lib/statistics';
import { DOMAIN_LABELS, SOCIOECONOMIC_FIELDS, WHOQOL_QUESTIONS } from '../../constants';
import { 
    TableCard, 
    StyledTable, 
    StyledThead, 
    StyledTh, 
    StyledTbody, 
    StyledTd,
    exportToCsv,
    exportToTsv,
    exportToXls,
    ScoreBadge,
    MeanScoreBadge
} from './shared/TableComponents';

/**
 * Props para o componente StatisticsTables.
 */
interface StatisticsTablesProps {
  participants: Participant[];
  domainStats: (ReturnType<typeof import('../../lib/statistics').calculateDescriptiveStats> & { domain: string, classification: string })[];
  numericalStats: ReturnType<typeof import('../../lib/statistics').calculateDescriptiveStats> & { variable: string };
  categoricalStats: { variable: string; category: string; frequency: number; percentage: string; }[];
}

/**
 * Retorna uma célula de tabela (StyledTd) contendo um ScoreBadge para um escore.
 * @param score O escore (0-100) a ser exibido.
 * @param classification A classificação qualitativa do escore.
 * @returns Um elemento JSX <StyledTd>.
 */
const getScoreColorBadge = (score: number | undefined, classification: string | undefined) => {
    if (score === undefined || isNaN(score)) return <StyledTd>N/A</StyledTd>;
    
    return (
        <StyledTd>
            <ScoreBadge score={score} size="xs" classification={classification} />
        </StyledTd>
    );
  };

const negativeQuestionIds = new Set(WHOQOL_QUESTIONS.filter(q => q.negative).map(q => q.id));

/**
 * Componente que renderiza um conjunto de tabelas de estatísticas descritivas.
 * Recebe dados pré-calculados como props para otimizar o desempenho.
 */
const StatisticsTables: React.FC<StatisticsTablesProps> = ({ participants, domainStats, numericalStats, categoricalStats }) => {
    const [crossTabVariable, setCrossTabVariable] = useState<keyof SocioeconomicData>('gender');
    
    /**
     * Manipula a exportação dos dados da tabela de domínios para um formato especificado.
     * @param format O formato de arquivo desejado ('csv', 'tsv', ou 'xls').
     */
    const handleExportDomainStats = (format: 'csv' | 'tsv' | 'xls') => {
        const headers = ['Domínio', 'Classificação', 'N', 'Média (0-100)', 'Desvio Padrão', 'Mínimo', 'Q1', 'Mediana', 'Q3', 'Máximo'];
        const rows = domainStats.map(s => [
            s.domain, 
            s.classification,
            s.n, 
            s.mean.toFixed(1), 
            s.stdDev.toFixed(1), 
            s.min.toFixed(1), 
            s.q1.toFixed(1), 
            s.median.toFixed(1), 
            s.q3.toFixed(1), 
            s.max.toFixed(1)
        ]);
        const filename = `estatisticas_dominios_whoqol.${format === 'xls' ? 'xls' : format}`;
        if (format === 'csv') exportToCsv(headers, rows, filename);
        if (format === 'tsv') exportToTsv(headers, rows, filename);
        if (format === 'xls') exportToXls(headers, rows, filename);
    };

    const handleExportNumericalStats = (format: 'csv' | 'tsv' | 'xls') => {
        const headers = ['Variável', 'N', 'Média', 'Desvio Padrão', 'Mínimo', 'Q1', 'Mediana', 'Q3', 'Máximo'];
        const rows = [[numericalStats.variable, numericalStats.n, numericalStats.mean.toFixed(2), numericalStats.stdDev.toFixed(2), numericalStats.min, numericalStats.q1, numericalStats.median, numericalStats.q3, numericalStats.max]];
        const filename = `estatisticas_numericas_socioeconomicas.${format === 'xls' ? 'xls' : format}`;
        if (format === 'csv') exportToCsv(headers, rows, filename);
        if (format === 'tsv') exportToTsv(headers, rows, filename);
        if (format === 'xls') exportToXls(headers, rows, filename);
    };

    const handleExportCategoricalStats = (format: 'csv' | 'tsv' | 'xls') => {
        const headers = ['Variável', 'Categoria', 'Frequência (n)', 'Porcentagem (%)'];
        const rows = categoricalStats.map(s => [s.variable, s.category, s.frequency, s.percentage]);
        const filename = `estatisticas_categoricas_socioeconomicas.${format === 'xls' ? 'xls' : format}`;
        if (format === 'csv') exportToCsv(headers, rows, filename);
        if (format === 'tsv') exportToTsv(headers, rows, filename);
        if (format === 'xls') exportToXls(headers, rows, filename);
    };

    // Calcula as estatísticas de tabulação cruzada com base na variável selecionada localmente.
    const crossTabStats = calculateScoresByGroup(participants, crossTabVariable);
    
    const handleExportCrossTabStats = (format: 'csv' | 'tsv' | 'xls') => {
        const domainKeys = Object.keys(DOMAIN_LABELS) as (keyof DomainScores)[];
        const headers = [
            SOCIOECONOMIC_FIELDS.find(f => f.id === crossTabVariable)?.label || 'Grupo', 
            'N',
            ...domainKeys.map(k => `${DOMAIN_LABELS[k]} (Média)`)
        ];
        const rows = crossTabStats.map(stat => [
            stat.group,
            stat.n,
            ...domainKeys.map(k => stat.scores[k]?.toFixed(1) || 'N/A')
        ]);
        const filename = `analise_cruzada_${crossTabVariable}.${format === 'xls' ? 'xls' : format}`;
        if (format === 'csv') exportToCsv(headers, rows, filename);
        if (format === 'tsv') exportToTsv(headers, rows, filename);
        if (format === 'xls') exportToXls(headers, rows, filename);
    };

    // Calcula as frequências das respostas para cada questão do WHOQOL.
    const questionFrequencies = calculateWhoqolQuestionFrequencies(participants);
    
    const getLikertLabelForValue = (questionId: string, value: number) => {
        const scale = getLikertScaleForQuestion(questionId);
        return scale[value - 1] || '';
    };

    const handleExportQuestionFreq = (format: 'csv' | 'tsv' | 'xls') => {
        const headers = ['Questão', 'Texto', 'Média (1-5)', 'R1 (n)', 'R1 (%)', 'R2 (n)', 'R2 (%)', 'R3 (n)', 'R3 (%)', 'R4 (n)', 'R4 (%)', 'R5 (n)', 'R5 (%)'];
        const rows = questionFrequencies.map(q => [
            q.questionId,
            q.questionText,
            q.mean.toFixed(2),
            q.counts[1] || 0, q.percentages[1] || '0.00%',
            q.counts[2] || 0, q.percentages[2] || '0.00%',
            q.counts[3] || 0, q.percentages[3] || '0.00%',
            q.counts[4] || 0, q.percentages[4] || '0.00%',
            q.counts[5] || 0, q.percentages[5] || '0.00%',
        ]);
        const filename = `frequencia_respostas_whoqol.${format === 'xls' ? 'xls' : format}`;
        if (format === 'csv') exportToCsv(headers, rows, filename);
        if (format === 'tsv') exportToTsv(headers, rows, filename);
        if (format === 'xls') exportToXls(headers, rows, filename);
    };

    const categoricalFields = SOCIOECONOMIC_FIELDS.filter(f => f.type === 'select');

    return (
        <div className="space-y-6">
             <TableCard 
                title="Domínios WHOQOL-BREF" 
                onExport={handleExportDomainStats}
                infoContent={<p>Esta tabela apresenta as estatísticas descritivas para os escores de cada domínio do WHOQOL-BREF, juntamente com uma classificação qualitativa baseada na pontuação de 1 a 5. Inclui o número de participantes válidos (N), a Média dos escores (0-100), Desvio Padrão (DP) e os valores Mínimo e Máximo, além dos quartis. A média é colorida para uma rápida avaliação do nível de qualidade de vida.</p>}
             >
                <StyledTable>
                    <StyledThead>
                        <StyledTh>Domínio</StyledTh>
                        <StyledTh>Classificação</StyledTh>
                        <StyledTh>N</StyledTh>
                        <StyledTh>Média (0-100)</StyledTh>
                        <StyledTh>D.P.</StyledTh>
                        <StyledTh>Mín</StyledTh>
                        <StyledTh>Q1</StyledTh>
                        <StyledTh>Mediana</StyledTh>
                        <StyledTh>Q3</StyledTh>
                        <StyledTh>Máx</StyledTh>
                    </StyledThead>
                    <StyledTbody>
                        {domainStats.map(s => (
                            <tr key={s.domain}>
                                <StyledTd>{s.domain}</StyledTd>
                                <StyledTd>{s.n > 0 ? s.classification : 'N/A'}</StyledTd>
                                <StyledTd>{s.n}</StyledTd>
                                {getScoreColorBadge(s.n > 0 ? s.mean : undefined, s.n > 0 ? s.classification : undefined)}
                                <StyledTd>{s.n > 0 ? formatNumber(s.stdDev) : 'N/A'}</StyledTd>
                                <StyledTd>{s.n > 0 ? formatNumber(s.min) : 'N/A'}</StyledTd>
                                <StyledTd>{s.n > 0 ? formatNumber(s.q1) : 'N/A'}</StyledTd>
                                <StyledTd>{s.n > 0 ? formatNumber(s.median) : 'N/A'}</StyledTd>
                                <StyledTd>{s.n > 0 ? formatNumber(s.q3) : 'N/A'}</StyledTd>
                                <StyledTd>{s.n > 0 ? formatNumber(s.max) : 'N/A'}</StyledTd>
                            </tr>
                        ))}
                    </StyledTbody>
                </StyledTable>
             </TableCard>

             <TableCard 
                title="Análise Cruzada: Escores WHOQOL por Grupo Socioeconômico"
                onExport={handleExportCrossTabStats}
                infoContent={<p>Esta tabela permite comparar os escores médios de qualidade de vida entre diferentes grupos de participantes. Selecione uma variável socioeconômica (ex: Gênero, Escolaridade) para ver como os escores dos domínios variam entre as categorias. As células coloridas representam a média do escore para aquele grupo específico.</p>}
             >
                <div className="mb-4">
                    <label htmlFor="crosstab-var" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Agrupar por:
                    </label>
                    <select
                        id="crosstab-var"
                        value={crossTabVariable}
                        onChange={(e) => setCrossTabVariable(e.target.value as keyof SocioeconomicData)}
                        className="mt-1 block w-full md:w-1/3 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        {categoricalFields.map(field => (
                            <option key={field.id} value={field.id}>{field.label}</option>
                        ))}
                    </select>
                </div>
                 <StyledTable>
                    <StyledThead>
                        <StyledTh>{SOCIOECONOMIC_FIELDS.find(f => f.id === crossTabVariable)?.label}</StyledTh>
                        <StyledTh>N</StyledTh>
                        {Object.values(DOMAIN_LABELS).map(label => <StyledTh key={label}>{label}</StyledTh>)}
                    </StyledThead>
                    <StyledTbody>
                        {crossTabStats.map(stat => (
                            <tr key={stat.group}>
                                <StyledTd>{stat.group}</StyledTd>
                                <StyledTd>{stat.n}</StyledTd>
                                {getScoreColorBadge(stat.scores.physical, stat.classifications?.physical)}
                                {getScoreColorBadge(stat.scores.psychological, stat.classifications?.psychological)}
                                {getScoreColorBadge(stat.scores.social, stat.classifications?.social)}
                                {getScoreColorBadge(stat.scores.environment, stat.classifications?.environment)}
                                {getScoreColorBadge(stat.scores.overall, stat.classifications?.overall)}
                                {getScoreColorBadge(stat.scores.qualidadeDeVidaMedia, stat.classifications?.qualidadeDeVidaMedia)}
                            </tr>
                        ))}
                    </StyledTbody>
                 </StyledTable>
             </TableCard>

             <TableCard
                title="Frequência das Respostas Individuais do WHOQOL-BREF"
                onExport={handleExportQuestionFreq}
                infoContent={<p>Esta tabela mostra a distribuição das respostas (de 1 a 5) para cada uma das 26 questões do WHOQOL-BREF. Para cada questão, você pode ver a pontuação média e a porcentagem (%) de participantes que selecionaram cada opção da escala Likert. A média é colorida para uma avaliação rápida baseada na classificação: <span className="text-red-500">Ruim</span>, <span className="text-yellow-500">Regular</span>, <span className="text-green-500">Boa</span> e <span className="text-blue-500">Muito Boa</span>. A lógica das cores é invertida para questões com sentido negativo (onde uma pontuação menor é melhor).</p>}
             >
                 <StyledTable>
                    <StyledThead>
                        <StyledTh>Questão</StyledTh>
                        <StyledTh>Média (1-5)</StyledTh>
                        <StyledTh>R1 (%)</StyledTh>
                        <StyledTh>R2 (%)</StyledTh>
                        <StyledTh>R3 (%)</StyledTh>
                        <StyledTh>R4 (%)</StyledTh>
                        <StyledTh>R5 (%)</StyledTh>
                    </StyledThead>
                    <StyledTbody>
                       {questionFrequencies.map(q => (
                           <tr key={q.questionId}>
                                <StyledTd>
                                    <span className="font-semibold">{q.questionId}:</span> {q.questionText}
                                </StyledTd>
                                <StyledTd>
                                    <MeanScoreBadge score={q.mean} isNegative={negativeQuestionIds.has(q.questionId)} />
                                </StyledTd>
                                {[1, 2, 3, 4, 5].map(val => (
                                    <StyledTd key={val} title={`${getLikertLabelForValue(q.questionId, val)}: ${q.counts[val] || 0} participante(s)`}>
                                        {q.percentages[val] || '0.00%'}
                                    </StyledTd>
                                ))}
                           </tr>
                       ))}
                    </StyledTbody>
                 </StyledTable>
             </TableCard>

             <TableCard 
                title="Dados Socioeconômicos (Numéricos)" 
                onExport={handleExportNumericalStats}
                infoContent={<p>Esta tabela resume as estatísticas para variáveis numéricas, como a idade. Apresenta o número de participantes (N), a Média, o Desvio Padrão (DP), e os valores Mínimo e Máximo, além da Mediana e dos Quartis (Q1, Q3) para uma visão mais completa da distribuição.</p>}
             >
                 <StyledTable>
                     <StyledThead>
                        <StyledTh>Variável</StyledTh>
                        <StyledTh>N</StyledTh>
                        <StyledTh>Média</StyledTh>
                        <StyledTh>D.P.</StyledTh>
                        <StyledTh>Mín</StyledTh>
                        <StyledTh>Q1</StyledTh>
                        <StyledTh>Mediana</StyledTh>
                        <StyledTh>Q3</StyledTh>
                        <StyledTh>Máx</StyledTh>
                     </StyledThead>
                     <StyledTbody>
                        {numericalStats.n > 0 ? (
                            <tr>
                                <StyledTd>{numericalStats.variable}</StyledTd>
                                <StyledTd>{numericalStats.n}</StyledTd>
                                <StyledTd>{formatNumber(numericalStats.mean)}</StyledTd>
                                <StyledTd>{formatNumber(numericalStats.stdDev)}</StyledTd>
                                <StyledTd>{formatNumber(numericalStats.min)}</StyledTd>
                                <StyledTd>{formatNumber(numericalStats.q1)}</StyledTd>
                                <StyledTd>{formatNumber(numericalStats.median)}</StyledTd>
                                <StyledTd>{formatNumber(numericalStats.q3)}</StyledTd>
                                <StyledTd>{formatNumber(numericalStats.max)}</StyledTd>
                            </tr>
                        ) : (
                            <tr>
                                <StyledTd colSpan={9} className="text-center">Sem dados numéricos para exibir.</StyledTd>
                            </tr>
                        )}
                     </StyledTbody>
                 </StyledTable>
             </TableCard>

             <TableCard 
                title="Dados Socioeconômicos (Categóricos)" 
                onExport={handleExportCategoricalStats}
                infoContent={<p>Esta tabela mostra a frequência de cada categoria para as variáveis socioeconômicas (ex: gênero, escolaridade). Apresenta a contagem absoluta (Frequência - n) e a proporção relativa (Porcentagem - %) para cada opção.</p>}
             >
                 <StyledTable>
                    <StyledThead>
                        <StyledTh>Variável</StyledTh>
                        <StyledTh>Categoria</StyledTh>
                        <StyledTh>Frequência (n)</StyledTh>
                        <StyledTh>Porcentagem (%)</StyledTh>
                    </StyledThead>
                    <StyledTbody>
                        {categoricalStats.length > 0 ? categoricalStats.map((s, index) => (
                            <tr key={`${s.variable}-${s.category}-${index}`}>
                                <StyledTd>{s.variable}</StyledTd>
                                <StyledTd>{s.category}</StyledTd>
                                <StyledTd>{s.frequency}</StyledTd>
                                <StyledTd>{s.percentage}</StyledTd>
                            </tr>
                        )) : (
                           <tr>
                                <StyledTd colSpan={4} className="text-center">Sem dados categóricos para exibir.</StyledTd>
                           </tr>
                        )}
                    </StyledTbody>
                 </StyledTable>
             </TableCard>
        </div>
    );
};

export default StatisticsTables;
