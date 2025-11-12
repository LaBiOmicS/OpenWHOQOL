import React, { useState, useMemo } from 'react';
import { Participant, SocioeconomicData, DomainScores } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '../ui/Card';
import { DOMAIN_LABELS, SOCIOECONOMIC_FIELDS } from '../../constants';
import StatisticsTables from './StatisticsTables';
import { ChartCard } from './shared/TableComponents';
import AdvancedAnalysis from './AdvancedAnalysis';
import DescriptiveFilter from './shared/DescriptiveFilter';
import { calculateDomainScores } from '../../lib/whoqol';
import { calculateDescriptiveStats, calculateCategoricalFrequency, transformedToRawScore, classifyRawScore, calculateProfessionWordFrequency } from '../../lib/statistics';
import { WordCloudChart } from './shared/WordCloudChart';

/**
 * Props para o componente StatisticsTab.
 */
interface StatisticsTabProps {
  participants: Participant[];
}

// Cores para os gráficos de pizza
const PIE_CHART_COLORS = ['#3b82f6', '#16a34a', '#ef4444', '#eab308', '#8b5cf6', '#ec4899', '#14b8a6'];

// Cores para a classificação de escores
const SCORE_COLORS = {
    low: '#ef4444',     // red-500
    medium: '#eab308',  // yellow-500
    high: '#22c55e',    // green-500
    veryHigh: '#3b82f6',// blue-500
};

/**
 * Retorna a cor correspondente à classificação de um escore.
 * @param score O escore (0-100) a ser classificado.
 * @returns A cor em formato hexadecimal.
 */
const getScoreColor = (score: number) => {
    const rawScore = transformedToRawScore(score);
    if (rawScore < 3) return SCORE_COLORS.low;
    if (rawScore < 4) return SCORE_COLORS.medium;
    if (rawScore < 5) return SCORE_COLORS.high;
    return SCORE_COLORS.veryHigh;
};

/**
 * Componente de legenda customizado para o gráfico de domínios.
 */
const CustomDomainChartLegend = () => (
    <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-1 mt-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: SCORE_COLORS.low }}></span> Ruim (&lt;3)</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: SCORE_COLORS.medium }}></span> Regular (3-3.9)</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: SCORE_COLORS.high }}></span> Bom (4-4.9)</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: SCORE_COLORS.veryHigh }}></span> Muito Bom (5)</div>
    </div>
);

/**
 * Componente de tooltip customizado para o gráfico de barras de domínios.
 */
const DomainChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg text-sm">
        <p className="font-bold text-gray-900 dark:text-white">{label}</p>
        <p className="text-gray-700 dark:text-gray-300">Média: <span className="font-semibold">{data['Média'].toFixed(1)}</span></p>
        <p className="text-gray-700 dark:text-gray-300">D.P.: <span className="font-semibold">{data['Desvio Padrão'].toFixed(1)}</span></p>
        <p className="text-gray-700 dark:text-gray-300">N: <span className="font-semibold">{data.N}</span></p>
      </div>
    );
  }
  return null;
};

/**
 * Componente de tooltip customizado para os gráficos de pizza.
 */
const PieChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg text-sm">
        <p className="font-bold text-gray-900 dark:text-white">{data.name}</p>
        <p className="text-gray-700 dark:text-gray-300">Frequência: <span className="font-semibold">{data.value}</span></p>
        <p className="text-gray-700 dark:text-gray-300">Porcentagem: <span className="font-semibold">{data.percentage}</span></p>
      </div>
    );
  }
  return null;
};

/**
 * Componente que renderiza a aba "Estatísticas".
 * Exibe estatísticas descritivas, gráficos e análises avançadas.
 */
const StatisticsTab: React.FC<StatisticsTabProps> = ({ participants }) => {
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[] | null>(null);
  const [activeFilterLabel, setActiveFilterLabel] = useState<string | null>(null);

  // Memoiza a lista de participantes incluídos para evitar recálculos.
  const includedParticipants = useMemo(() => participants.filter(p => !p.isExcluded), [participants]);

  /**
   * Callback para o componente de filtro, atualizando os dados exibidos.
   */
  const onFilterChange = (field: keyof SocioeconomicData | null, value: string | null, fieldLabel: string | null) => {
    if (field && value) {
      const filtered = includedParticipants.filter(p => p.socioeconomic?.[field] === value);
      setFilteredParticipants(filtered);
      setActiveFilterLabel(`Filtro Ativo: ${fieldLabel} = ${value}`);
    } else {
      setFilteredParticipants(null);
      setActiveFilterLabel(null);
    }
  };

  // Determina qual lista de participantes usar: a filtrada ou a completa.
  const currentParticipants = filteredParticipants ?? includedParticipants;

  // Memoiza todos os cálculos de estatísticas descritivas para performance.
  // Eles só serão recalculados se `currentParticipants` mudar.
  const { domainStats, barChartData } = useMemo(() => {
    const domainKeys = Object.keys(DOMAIN_LABELS) as (keyof DomainScores)[];
    const stats = domainKeys.map(domain => {
        const scores = currentParticipants
            .map(p => p.whoqol ? calculateDomainScores(p.whoqol)[domain] : NaN)
            .filter(score => !isNaN(score));
        const descriptive = calculateDescriptiveStats(scores);
        const classification = descriptive.n > 0 ? classifyRawScore(transformedToRawScore(descriptive.mean)) : 'N/A';
        return { ...descriptive, domain: DOMAIN_LABELS[domain], classification };
    });
    const chartData = stats.map(s => ({
        Domínio: s.domain,
        'Média': s.mean,
        'Desvio Padrão': s.stdDev,
        N: s.n,
    }));
    return { domainStats: stats, barChartData: chartData };
  }, [currentParticipants]);

  const numericalStats = useMemo(() => {
    const ageData = currentParticipants.map(p => p.socioeconomic?.age).filter((age): age is number => typeof age === 'number' && age > 0);
    const stats = calculateDescriptiveStats(ageData);
    return { ...stats, variable: 'Idade' };
  }, [currentParticipants]);

  const categoricalStats = useMemo(() => {
    const categoricalFields = SOCIOECONOMIC_FIELDS.filter(field => field.type === 'select');
    return categoricalFields.flatMap(field => {
      const frequencies = calculateCategoricalFrequency(currentParticipants, field.id as keyof SocioeconomicData);
      return frequencies.map(freq => ({
        variable: field.label,
        ...freq,
      }));
    });
  }, [currentParticipants]);

  const categoricalChartsData = useMemo(() => {
    const categoricalFields = SOCIOECONOMIC_FIELDS.filter(field => field.type === 'select');
    return categoricalFields.map(field => {
        const frequencies = calculateCategoricalFrequency(currentParticipants, field.id as keyof SocioeconomicData);
        return {
            id: field.id,
            label: field.label,
            data: frequencies.map(f => ({ name: f.category, value: f.frequency, percentage: f.percentage })),
        };
    }).filter(chart => chart.data.length > 0);
  }, [currentParticipants]);

  const professionWordCloudData = useMemo(() => {
    return calculateProfessionWordFrequency(currentParticipants, 50);
  }, [currentParticipants]);

  if (includedParticipants.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Nenhum Participante Válido</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Não há dados de participantes incluídos para exibir estatísticas.</p>
        </div>
      </Card>
    );
  }

  // Função para renderizar os rótulos dentro do gráfico de pizza.
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Não renderiza rótulos para fatias muito pequenas
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold pointer-events-none">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Estatísticas Descritivas (N={currentParticipants.length})</h2>
        <DescriptiveFilter participants={includedParticipants} onFilterChange={onFilterChange} />
         {activeFilterLabel && (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3 mb-6 rounded-md shadow-sm text-sm" role="status">
                <p>{activeFilterLabel}</p>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard 
            title="Média dos Domínios WHOQOL-BREF"
            infoContent={<p>Este gráfico exibe a pontuação média (em uma escala de 0 a 100) para cada domínio do WHOQOL-BREF. Barras mais altas indicam uma maior qualidade de vida percebida naquele domínio. As cores representam a classificação qualitativa da média. Passe o mouse sobre as barras para ver a média, desvio padrão e o número de participantes (N).</p>}
        >
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 5, right: 20, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                <XAxis dataKey="Domínio" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={50} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip content={<DomainChartTooltip />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}/>
                <Legend content={<CustomDomainChartLegend />} verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Média" barSize={40}>
                    {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getScoreColor(entry['Média'])} />
                    ))}
                </Bar>
            </BarChart>
            </ResponsiveContainer>
        </ChartCard>
        
        <ChartCard
            title="Nuvem de Palavras das Profissões"
            infoContent={<p>Este gráfico exibe as palavras mais frequentes mencionadas nas profissões dos participantes. O tamanho de cada palavra é proporcional à sua frequência. Palavras comuns (artigos, preposições) são ignoradas.</p>}
        >
            <WordCloudChart data={professionWordCloudData} />
        </ChartCard>

        {categoricalChartsData.map((chart) => (
             <ChartCard 
                key={chart.id} 
                title={`Distribuição por ${chart.label}`}
                infoContent={<p>Este gráfico de pizza mostra a distribuição percentual dos participantes de acordo com a variável "{chart.label}". Passe o mouse sobre uma fatia para ver a frequência e a porcentagem exatas.</p>}
             >
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chart.data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={'80%'}
                            dataKey="value"
                            stroke="none"
                        >
                        {chart.data.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={PIE_CHART_COLORS[idx % PIE_CHART_COLORS.length]} />
                        ))}
                        </Pie>
                        <Tooltip content={<PieChartTooltip />} />
                        <Legend iconSize={10} wrapperStyle={{fontSize: "12px", paddingTop: "20px"}}/>
                    </PieChart>
                </ResponsiveContainer>
             </ChartCard>
        ))}
      </div>
      
      <StatisticsTables 
        participants={currentParticipants}
        domainStats={domainStats}
        numericalStats={numericalStats}
        categoricalStats={categoricalStats}
      />
      
      <div>
        <h2 className="text-2xl font-bold mb-4 pt-8 border-t dark:border-gray-700">Análises Avançadas (N={includedParticipants.length})</h2>
         <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Esta seção utiliza todos os participantes <strong>incluídos</strong> (sem filtros descritivos) para realizar testes estatísticos inferenciais.
         </p>
        <AdvancedAnalysis participants={includedParticipants} />
      </div>
    </div>
  );
};

export default StatisticsTab;
