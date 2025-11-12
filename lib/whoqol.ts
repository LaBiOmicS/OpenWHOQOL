/**
 * @file Contém as funções lógicas para o cálculo dos escores do WHOQOL-BREF.
 * Implementa as regras oficiais da Organização Mundial da Saúde (OMS) para
 * pontuação, inversão de itens e tratamento de dados ausentes.
 */

import { WHOQOL_QUESTIONS, DOMAIN_QUESTIONS_MAP, LIKERT_OPTIONS } from '../constants';
import { WHOQOLResponse, DomainScores, Participant } from '../types';

/**
 * Conjunto de IDs de questões que são formuladas negativamente e precisam ter sua pontuação invertida.
 */
const NEGATIVE_QUESTIONS = new Set(WHOQOL_QUESTIONS.filter(q => q.negative).map(q => q.id));

/**
 * Inverte a pontuação para questões formuladas negativamente (ex: 1->5, 2->4, 3->3, etc.).
 * @param score A pontuação original de 1 a 5.
 * @returns A pontuação invertida.
 */
const invertScore = (score: number): number => 6 - score;

/**
 * Calcula os escores de domínio para um único participante.
 *
 * A lógica segue as diretrizes da OMS:
 * 1. Inverte os escores das questões negativas (Q3, Q4, Q26).
 * 2. Calcula a média dos itens para cada domínio.
 * 3. Trata dados ausentes: um domínio não é calculado se houver mais itens ausentes do que o permitido
 *    (geralmente, 20% do total de itens do domínio, com regras específicas para domínios menores).
 * 4. Transforma a pontuação média (escala de 1-5) para a escala final de 0-100.
 *
 * @param responses As respostas do participante ao questionário.
 * @returns Um objeto contendo os escores calculados para cada domínio.
 *          Retorna NaN para um domínio se ele não puder ser calculado devido a dados ausentes.
 */
export const calculateDomainScores = (responses: WHOQOLResponse): DomainScores => {
  const processedResponses = { ...responses };
  
  // Inverte os escores das questões negativas
  NEGATIVE_QUESTIONS.forEach(qid => {
    if (processedResponses[qid] !== undefined) {
      processedResponses[qid] = invertScore(processedResponses[qid]);
    }
  });

  /**
   * Calcula a pontuação média para um conjunto de questões, aplicando as regras de dados ausentes.
   * @param qids Um array com os IDs das questões do domínio.
   * @returns A pontuação média (1-5) ou NaN se não puder ser calculada.
   */
  const calculateMean = (qids: string[]): number => {
    const validResponses = qids.map(qid => processedResponses[qid]).filter((r): r is number => typeof r === 'number' && !isNaN(r));
    const totalItems = qids.length;
    
    // Regras da OMS para dados ausentes: mais de 20% de itens ausentes invalida o escore do domínio.
    // Para domínios de 3 ou 4 itens, a ausência de mais de 1 item invalida o escore.
    if ((totalItems > 4 && validResponses.length < totalItems * 0.8) || (totalItems <= 4 && validResponses.length < totalItems -1)) {
        return NaN;
    }
    
    if (validResponses.length === 0) return NaN;

    const sum = validResponses.reduce((acc, val) => acc + val, 0);
    return sum / validResponses.length;
  };

  /**
   * Transforma uma pontuação média bruta (escala 1-5) para a escala padrão do WHOQOL (0-100).
   * @param rawScore A pontuação média bruta de um domínio.
   * @returns A pontuação transformada ou NaN se a entrada for inválida.
   */
  const transformScore = (rawScore: number): number => {
    if (isNaN(rawScore)) return NaN;
    // A fórmula é: ((média - 1) * 100) / 4
    return ((rawScore - 1) * 25);
  };
  
  const physical = transformScore(calculateMean(DOMAIN_QUESTIONS_MAP.physical));
  const psychological = transformScore(calculateMean(DOMAIN_QUESTIONS_MAP.psychological));
  const social = transformScore(calculateMean(DOMAIN_QUESTIONS_MAP.social));
  const environment = transformScore(calculateMean(DOMAIN_QUESTIONS_MAP.environment));
  const overall = transformScore(calculateMean(['Q1', 'Q2']));

  // Calcula a média exploratória apenas com os domínios que foram calculados com sucesso.
  const validDomainScores = [physical, psychological, social, environment].filter(s => !isNaN(s));
  const qualidadeDeVidaMedia = validDomainScores.length > 0 
    ? validDomainScores.reduce((a, b) => a + b, 0) / validDomainScores.length 
    : NaN;

  return {
    physical,
    psychological,
    social,
    environment,
    overall,
    qualidadeDeVidaMedia,
  };
};

/**
 * Calcula as médias dos escores de domínio para uma lista de participantes.
 * Filtra participantes excluídos e agrega os escores individuais.
 * @param participants Um array de todos os participantes.
 * @returns Um objeto contendo as médias dos escores para cada domínio.
 */
export const calculateOverallDomainScores = (participants: Participant[]): DomainScores => {
    const validParticipants = participants.filter(p => !p.isExcluded && p.whoqol);
    if (validParticipants.length === 0) {
        return { physical: NaN, psychological: NaN, social: NaN, environment: NaN, overall: NaN, qualidadeDeVidaMedia: NaN };
    }

    const totalScores: { [key in keyof DomainScores]: number } = { physical: 0, psychological: 0, social: 0, environment: 0, overall: 0, qualidadeDeVidaMedia: 0 };
    const counts: { [key in keyof DomainScores]: number } = { physical: 0, psychological: 0, social: 0, environment: 0, overall: 0, qualidadeDeVidaMedia: 0 };

    validParticipants.forEach(p => {
        if (p.whoqol) {
            const scores = calculateDomainScores(p.whoqol);
            (Object.keys(scores) as Array<keyof DomainScores>).forEach(domain => {
                if (!isNaN(scores[domain])) {
                    totalScores[domain] += scores[domain];
                    counts[domain]++;
                }
            });
        }
    });

    const calculateAverage = (domain: keyof DomainScores) => counts[domain] > 0 ? totalScores[domain] / counts[domain] : NaN;

    return {
        physical: calculateAverage('physical'),
        psychological: calculateAverage('psychological'),
        social: calculateAverage('social'),
        environment: calculateAverage('environment'),
        overall: calculateAverage('overall'),
        qualidadeDeVidaMedia: calculateAverage('qualidadeDeVidaMedia'),
    };
};

/**
 * Retorna os rótulos da escala Likert apropriados para uma determinada questão do WHOQOL.
 * Centraliza a lógica de mapeamento entre questões e suas escalas de resposta específicas.
 * @param questionId O ID da questão (ex: 'Q1', 'Q3').
 * @returns Um array de cinco strings com os rótulos da escala.
 */
export const getLikertScaleForQuestion = (questionId: string): string[] => {
    if (questionId === 'Q1') return LIKERT_OPTIONS.scale_quality;
    if (questionId === 'Q15') return LIKERT_OPTIONS.scale_evaluation;
    if (['Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9'].includes(questionId)) return LIKERT_OPTIONS.scale_intensity;
    if (['Q10', 'Q11', 'Q12', 'Q13', 'Q14'].includes(questionId)) return LIKERT_OPTIONS.scale_capacity;
    if (questionId === 'Q26') return LIKERT_OPTIONS.scale_frequency;
    // O padrão para as questões restantes (Q2, Q16-Q25) é a escala de satisfação.
    return LIKERT_OPTIONS.scale_satisfaction;
};
