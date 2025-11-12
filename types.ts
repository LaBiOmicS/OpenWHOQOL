/**
 * @file Define todos os tipos e interfaces de dados essenciais para a aplicação.
 * Este arquivo serve como uma fonte única da verdade para a estrutura de dados,
 * garantindo consistência em todo o projeto.
 */

/**
 * Configuração para armazenamento em banco de dados externo (via API).
 * Armazenada em LocalStorage para persistir entre sessões antes mesmo do DB carregar.
 */
export interface ExternalStorageConfig {
  enabled: boolean;
  endpointUrl: string;
  apiKey: string;
}

/**
 * Configurações da pesquisa gerenciadas pelo administrador.
 */
export interface AdminConfig {
  /** O nome ou título principal do projeto de pesquisa. */
  projectName: string;
  /** A instituição à qual o pesquisador principal está afiliado. */
  researcherInstitution: string;
  /** O texto completo do Termo de Consentimento Livre e Esclarecido (TCLE) a ser apresentado aos participantes. Suporta formatação Markdown básica. */
  tcle: string;
  /** Nome do pesquisador principal ou de contato. */
  contactName: string;
  /** E-mail de contato para os participantes. */
  contactEmail: string;
  /** O número de protocolo de aprovação do Comitê de Ética em Pesquisa (CEP). */
  cepProtocol: string;
  /** Se ativado, participantes com menos de 18 anos são automaticamente marcados como "excluídos". */
  enforceAgeRestriction: boolean;
  /** Se ativado, o campo de e-mail do participante se torna obrigatório. */
  requireParticipantEmail: boolean;
  /** Habilita o envio de e-mails ao admin a cada nova resposta. */
  emailNotificationEnabled: boolean;
  /** O endereço de e-mail do administrador que receberá as notificações. */
  notificationEmailAddress: string;
  /** A URL do endpoint de API customizado que processará o envio do e-mail. */
  notificationApiEndpoint: string;
  /** A chave de API do Google Gemini, armazenada opcionalmente para a funcionalidade de análise com IA. */
  geminiApiKey?: string;
  /** Instruções personalizadas acumuladas via feedback para refinar o comportamento da IA (Memória). */
  aiTuningInstructions?: string;
  /** A identidade/persona que a IA deve adotar (ex: Pesquisador Sênior). */
  aiSystemIdentity?: string;
  /** Contexto global injetado em todos os prompts (ex: Localização do estudo, detalhes metodológicos). */
  aiGlobalContext?: string;
  /** Temperatura da IA (0.0 a 2.0). Controla a criatividade/aleatoriedade. */
  aiTemperature?: number;
  /** Top K. */
  aiTopK?: number;
  /** Top P. */
  aiTopP?: number;
}

/**
 * Contém as credenciais do administrador e todas as configurações da pesquisa.
 */
export interface AdminData {
  /** Nome de usuário para acesso ao painel administrativo. */
  username: string;
  /** Senha para acesso ao painel administrativo. */
  password: string;
  /** O objeto de configuração da pesquisa. */
  config: AdminConfig;
}

/**
 * Dados socioeconômicos coletados de um participante.
 * Permite chaves dinâmicas para extensibilidade.
 */
export interface SocioeconomicData {
  [key: string]: string | number;
  /** A idade do participante. Permite uma string vazia para o estado inicial do formulário. */
  age: number | '';
  /** O gênero autoidentificado do participante. */
  gender: string;
  /** O nível de escolaridade mais alto alcançado pelo participante. */
  education: string;
  /** O estado civil atual do participante. */
  maritalStatus: string;
  /** A profissão ou ocupação principal do participante. */
  profession: string;
  /** A faixa de renda familiar mensal do participante. */
  income: string;
}

/**
 * Respostas de um participante ao questionário WHOQOL-BREF.
 * A chave é o ID da questão (ex: 'Q1') e o valor é a pontuação Likert (1-5).
 */
export interface WHOQOLResponse {
  [key: string]: number;
}

/**
 * Representa um único participante no estudo, contendo todos os seus dados.
 */
export interface Participant {
  /** Um identificador único universal (UUID) para o participante. */
  id: string;
  /** A data e hora em que a participação foi submetida, no formato ISO 8601. */
  submittedAt: string;
  /** Indica se o participante deu consentimento para participar. */
  consentGiven: boolean;
  /** Dados socioeconômicos do participante (opcional, pois podem não ter sido preenchidos). */
  socioeconomic?: SocioeconomicData;
  /** Respostas do participante ao WHOQOL-BREF (opcional). */
  whoqol?: WHOQOLResponse;
  /** E-mail de contato opcional fornecido pelo participante. */
  contactEmail?: string;
  /** Se verdadeiro, o participante é excluído das análises estatísticas, mas não é removido do banco de dados. */
  isExcluded: boolean;
  /** A razão pela qual o participante foi excluído (ex: idade, solicitação manual). */
  exclusionReason: string | null;
  /** Indica se o participante recebeu auxílio de terceiros para preencher o questionário. */
  assistedFillOut?: boolean;
  /** O tempo (em minutos) que o participante levou para completar o fluxo. */
  timeToCompleteMinutes?: number;
}

/**
 * Um registro de auditoria para ações realizadas no sistema.
 */
export interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  details?: any;
}

/**
 * O estado global da aplicação.
 */
export interface AppData {
  admin: AdminData;
  participants: Participant[];
  logs: LogEntry[];
}

/**
 * Enumeração para as views principais da aplicação.
 */
export enum View {
  PARTICIPANT = 'PARTICIPANT',
  ADMIN = 'ADMIN',
}

/**
 * Escores calculados para os domínios do WHOQOL-BREF.
 * Valores variam de 0 a 100.
 */
export interface DomainScores {
  physical: number;
  psychological: number;
  social: number;
  environment: number;
  overall: number;
  qualidadeDeVidaMedia: number;
}

/**
 * Representa uma mensagem no chat de análise com IA.
 */
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// --- Tipos para Estatísticas Avançadas ---

export interface PostHocPair {
    group1: string;
    group2: string;
    meanDiff: number;
    rawPValue?: number;
    pValue: number;
    isSignificant: boolean;
}

export interface PostHocResult {
    testType: 'PostHoc';
    method: string;
    pairs: PostHocPair[];
}

export interface BaseTestResult {
    isSignificant: boolean;
    pValue: number;
}

export interface TTestResult extends BaseTestResult {
    testType: 'T-Test';
    method: string;
    tValue: number;
    df: number;
    groupNames: [string, string];
    cohensD: number;
}

export interface AnovaResult extends BaseTestResult {
    testType: 'ANOVA';
    fValue: number;
    dfBetween: number;
    dfWithin: number;
    etaSquared: number;
    omegaSquared?: number;
    postHoc?: PostHocResult;
}

export interface MannWhitneyUTestResult extends BaseTestResult {
    testType: 'MannWhitneyU';
    uValue: number;
    groupNames: [string, string];
}

export interface KruskalWallisTestResult extends BaseTestResult {
    testType: 'KruskalWallis';
    hValue: number;
    df: number;
}

export interface CorrelationResult extends BaseTestResult {
    testType: 'Correlation';
    rValue: number;
    rSquared: number;
    n: number;
}

export interface RegressionResult extends BaseTestResult {
    testType: 'Regression';
    slope: number;
    intercept: number;
    rSquared: number;
    n: number;
}

export interface ContingencyTable {
    headers: { rows: string[]; cols: string[] };
    data: number[][];
    expected: number[][];
    rowTotals: number[];
    colTotals: number[];
    grandTotal: number;
}

export interface ChiSquaredResult extends BaseTestResult {
    testType: 'ChiSquared';
    chi2Value: number;
    df: number;
    contingencyTable: ContingencyTable;
    warning?: string;
}

export interface ReliabilityResult {
    testType: 'CronbachAlpha';
    alpha: number;
    nItems: number;
    nParticipants: number;
}

export interface ErrorResult {
    testType: 'Error' | 'NotEnoughData';
    message: string;
}

export type AdvancedTestResult = 
    | TTestResult 
    | AnovaResult 
    | MannWhitneyUTestResult 
    | KruskalWallisTestResult 
    | CorrelationResult 
    | RegressionResult 
    | ChiSquaredResult 
    | ReliabilityResult 
    | ErrorResult;