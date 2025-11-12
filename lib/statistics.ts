/**
 * @file Contém funções utilitárias para cálculos estatísticos descritivos.
 * Estas funções são a base para a geração de tabelas e gráficos na aba de Estatísticas.
 */

import { Participant, SocioeconomicData, DomainScores } from '../types';
import { calculateDomainScores, calculateOverallDomainScores } from './whoqol';
import { WHOQOL_QUESTIONS } from '../constants';

/**
 * Formata um número como uma string de porcentagem localizada para pt-BR (ex: "25,0%").
 * @param value O número a ser formatado (ex: 0.25).
 * @returns A string de porcentagem formatada.
 */
const formatPercentage = (value: number): string => {
    if (isNaN(value)) return '0,0%';
    return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value);
};

/**
 * Formata um número com uma casa decimal e localização pt-BR (ex: "80,5").
 * @param value O número a ser formatado.
 * @returns A string do número formatado ou "N/A" se for inválido.
 */
export const formatNumber = (value: number): string => {
    if (isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value);
};

// --- Funções de Estatística Descritiva ---

/**
 * Calcula a média de um array de números.
 * @param data O array de números.
 * @returns A média, ou 0 se o array estiver vazio.
 */
export const calculateMean = (data: number[]): number => {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, val) => acc + val, 0);
  return sum / data.length;
};

/**
 * Calcula a variância amostral (usa n-1 no denominador).
 * @param data O array de números.
 * @returns A variância, ou 0 se houver menos de 2 elementos.
 */
export const calculateVariance = (data: number[]): number => {
    if (data.length < 2) return 0;
    const mean = calculateMean(data);
    const sumOfSquares = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
    return sumOfSquares / (data.length -1);
};

/**
 * Calcula o desvio padrão amostral.
 * @param data O array de números.
 * @returns O desvio padrão, ou 0 se houver menos de 2 elementos.
 */
export const calculateStdDev = (data: number[]): number => {
  if (data.length < 2) return 0;
  return Math.sqrt(calculateVariance(data));
};

/**
 * Encontra o valor mínimo em um array de números.
 * @param data O array de números.
 * @returns O valor mínimo, ou NaN se o array estiver vazio.
 */
export const calculateMin = (data: number[]): number => {
  if (data.length === 0) return NaN;
  return Math.min(...data);
};

/**
 * Encontra o valor máximo em um array de números.
 * @param data O array de números.
 * @returns O valor máximo, ou NaN se o array estiver vazio.
 */
export const calculateMax = (data: number[]): number => {
  if (data.length === 0) return NaN;
  return Math.max(...data);
};

/**
 * Calcula um percentil específico de um array de números usando interpolação linear (método R-7).
 * @param data O array de números (será ordenado internamente).
 * @param percentile O percentil a ser calculado (0-100).
 * @returns O valor do percentil, ou NaN se o array estiver vazio.
 */
const calculatePercentile = (data: number[], percentile: number): number => {
    if (data.length === 0) return NaN;
    const sorted = [...data].sort((a, b) => a - b);
    
    // Método R-7, o padrão em R e Excel
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = lower + 1;
    const weight = index - lower;

    if (upper >= sorted.length) return sorted[lower];
    if (lower < 0) return sorted[0];

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

/**
 * Calcula um conjunto completo de estatísticas descritivas para um array de números.
 * @param data O array de números.
 * @returns Um objeto com as estatísticas calculadas.
 */
export const calculateDescriptiveStats = (data: number[]) => {
  const n = data.length;
  if (n === 0) {
    return { n, mean: 0, stdDev: 0, min: NaN, max: NaN, median: NaN, q1: NaN, q3: NaN };
  }
  const mean = calculateMean(data);
  const stdDev = calculateStdDev(data);
  const min = calculateMin(data);
  const max = calculateMax(data);
  const median = calculatePercentile(data, 50);
  const q1 = calculatePercentile(data, 25);
  const q3 = calculatePercentile(data, 75);

  return { n, mean, stdDev, min, max, median, q1, q3 };
};

/**
 * Calcula a frequência e a porcentagem para um campo socioeconômico categórico.
 * @param participants A lista de participantes.
 * @param field O campo a ser analisado (ex: 'gender', 'education').
 * @returns Um array de objetos com os resultados para cada categoria, ordenado por frequência.
 */
export const calculateCategoricalFrequency = (participants: Participant[], field: keyof SocioeconomicData) => {
    const validData = participants.map(p => p.socioeconomic?.[field]).filter(Boolean) as string[];
    const totalWithData = validData.length;
    if (totalWithData === 0) return [];

    const counts: { [key: string]: number } = {};
    validData.forEach(value => {
        counts[value] = (counts[value] || 0) + 1;
    });
    
    return Object.entries(counts).map(([category, frequency]) => ({
      category,
      frequency,
      percentage: formatPercentage(frequency / totalWithData),
    })).sort((a, b) => b.frequency - a.frequency);
};

/**
 * Agrupa participantes por uma variável categórica e calcula os escores médios de domínio para cada grupo.
 * @param participants A lista de participantes.
 * @param groupField O campo a ser usado para agrupamento.
 * @returns Um array de objetos, cada um representando um grupo com seus escores médios e classificações.
 */
export const calculateScoresByGroup = (participants: Participant[], groupField: keyof SocioeconomicData) => {
    const groups: { [key: string]: Participant[] } = {};

    participants.forEach(p => {
        const groupValue = p.socioeconomic?.[groupField];
        if (typeof groupValue === 'string' && groupValue) {
            groups[groupValue] = groups[groupValue] || [];
            groups[groupValue].push(p);
        }
    });

    return Object.entries(groups).map(([group, groupParticipants]) => {
        const scores = calculateOverallDomainScores(groupParticipants);
        const classifications: { [key in keyof DomainScores]?: string } = {};
        (Object.keys(scores) as Array<keyof DomainScores>).forEach(domain => {
            classifications[domain] = classifyRawScore(transformedToRawScore(scores[domain]));
        });
        
        return {
            group,
            n: groupParticipants.length,
            scores,
            classifications,
        };
    }).sort((a,b) => a.group.localeCompare(b.group));
};

/**
 * Calcula a frequência de resposta (contagem e porcentagem) e a média para cada questão do WHOQOL-BREF.
 * @param participants A lista de participantes.
 * @returns Um array de objetos, cada um com as estatísticas de uma questão.
 */
export const calculateWhoqolQuestionFrequencies = (participants: Participant[]) => {
    const validParticipants = participants.filter(p => p.whoqol);
    if (validParticipants.length === 0) return [];

    return WHOQOL_QUESTIONS.map(question => {
        const counts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let sumOfScores = 0;
        const validResponses = validParticipants.map(p => p.whoqol?.[question.id]).filter((r): r is number => typeof r === 'number' && r >= 1 && r <= 5);

        validResponses.forEach(response => {
            counts[response]++;
            sumOfScores += response;
        });
        
        const mean = validResponses.length > 0 ? sumOfScores / validResponses.length : 0;
        const percentages: { [key: number]: string } = {};
        [1, 2, 3, 4, 5].forEach(keyNum => {
            percentages[keyNum] = formatPercentage(validResponses.length > 0 ? (counts[keyNum] / validResponses.length) : 0);
        });

        return {
            questionId: question.id,
            questionText: question.text,
            counts,
            percentages,
            mean,
        };
    });
};

/**
 * Converte um escore transformado do WHOQOL (escala 0-100) de volta para sua média bruta (escala 1-5).
 * @param transformedScore O escore na escala de 0-100.
 * @returns O escore bruto na escala de 1-5.
 */
export const transformedToRawScore = (transformedScore: number): number => {
    if (isNaN(transformedScore)) return NaN;
    // Fórmula inversa de: ((rawScore - 1) / 4) * 100
    return (transformedScore / 100) * 4 + 1;
};

/**
 * Classifica um escore bruto do WHOQOL (escala 1-5) em categorias qualitativas.
 * @param rawScore O escore bruto na escala de 1-5.
 * @returns A string de classificação.
 */
export const classifyRawScore = (rawScore: number): string => {
    if (isNaN(rawScore)) return 'N/A';
    if (rawScore < 3) return 'Ruim';
    if (rawScore < 4) return 'Regular';
    if (rawScore < 5) return 'Boa';
    return 'Muito Boa';
};

/**
 * Processa uma lista de participantes para calcular a frequência de palavras em suas profissões.
 * @param participants A lista de participantes.
 * @param limit O número máximo de palavras a serem retornadas.
 * @returns Um array de objetos com as palavras mais frequentes e suas contagens.
 */
export const calculateProfessionWordFrequency = (participants: Participant[], limit: number = 50): { text: string, value: number }[] => {
    // Stop words em português para serem ignoradas na contagem.
    const stopWords = new Set([
      'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma',
      'os', 'no', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das',
      'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está',
      'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'depois', 'sem',
      'mesmo', 'aos', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão', 'você', 'tinha',
      'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'numa', 'pelos', 'elas', 'do lar',
      'auxiliar', 'assistente', 'analista'
    ]);

    const wordCounts: { [key: string]: number } = {};

    participants.forEach(p => {
      const profession = p.socioeconomic?.profession;
      if (profession && typeof profession === 'string') {
        const words = profession
          .toLowerCase()
          .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Remove pontuação
          .split(/\s+/); // Divide por espaços

        words.forEach(word => {
          // A palavra é contada se for válida, tiver mais de 2 letras e não for um stop word ou número.
          if (word && word.length > 2 && !stopWords.has(word) && isNaN(Number(word))) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
          }
        });
      }
    });
    
    return Object.entries(wordCounts)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
};