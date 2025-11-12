/**
 * @file Contém todas as constantes e dados iniciais da aplicação.
 * Isso centraliza valores fixos, como textos de perguntas, opções de formulário e
 * o estado inicial da aplicação, facilitando a manutenção e a consistência.
 */

import { AppData, SocioeconomicData, WHOQOLResponse } from './types';

/**
 * O estado inicial padrão para toda a aplicação.
 * Usado na primeira vez que o banco de dados é criado ou como fallback.
 */
export const INITIAL_APP_DATA: AppData = {
  admin: {
    username: 'admin',
    password: 'admin',
    config: {
      projectName: 'Pesquisa com OpenWHOQOL',
      researcherInstitution: 'Nome da Instituição de Pesquisa',
      tcle: `**Termo de Consentimento Livre e Esclarecido (TCLE)**

Você está sendo convidado(a) a participar da pesquisa "Qualidade de Vida com base no instrumento WHOQOL-BREF". Sua participação é voluntária.

**Objetivo:** O objetivo desta pesquisa é [descrever o objetivo].

**Procedimentos:** Se você concordar em participar, será solicitado que você responda a um questionário socioeconômico e ao questionário de qualidade de vida WHOQOL-BREF. O tempo estimado para preenchimento é de 15 minutos.

**Riscos e Benefícios:** Não há riscos diretos associados à sua participação. Os benefícios são a contribuição para o conhecimento científico sobre qualidade de vida.

**Confidencialidade e Privacidade:** Todas as suas respostas serão anônimas e confidenciais, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Os dados coletados serão utilizados apenas para fins de pesquisa.

Ao clicar em "Concordo e desejo participar", você declara que leu e compreendeu as informações e concorda em participar desta pesquisa.`,
      contactName: 'Nome do Pesquisador Responsável',
      contactEmail: 'pesquisador@email.com',
      cepProtocol: 'CAAE: 0000.0.000.000-00',
      enforceAgeRestriction: true,
      requireParticipantEmail: false,
      emailNotificationEnabled: false,
      notificationEmailAddress: '',
      notificationApiEndpoint: '',
      geminiApiKey: '',
      aiTuningInstructions: '',
      aiSystemIdentity: 'Você é um pesquisador PhD experiente, especialista em psicometria, estatística e análise de qualidade de vida (WHOQOL-BREF). Seu tom é formal, acadêmico e objetivo.',
      aiGlobalContext: '',
      aiTemperature: 0.7,
      aiTopK: 40,
      aiTopP: 0.95,
    },
  },
  participants: [],
  logs: [],
};

/**
 * Lista de todas as 26 questões do questionário WHOQOL-BREF.
 * Cada objeto contém o ID da questão, o texto, o domínio a que pertence e
 * uma flag `negative` se a questão tiver um sentido negativo (ex: dor, sentimentos ruins),
 * o que requer a inversão da pontuação na análise.
 */
export const WHOQOL_QUESTIONS = [
  // Bloco 1: Qualidade de Vida Geral e Saúde
  { id: 'Q1', text: 'Como você avaliaria sua qualidade de vida?', domain: 'overall' },
  { id: 'Q2', text: 'Quão satisfeito(a) você está com a sua saúde?', domain: 'overall' },
  
  // Bloco 2: Intensidade (quanto)
  { id: 'Q3', text: 'Em que medida você acha que sua dor (física) impede você de fazer o que você precisa?', domain: 'physical', negative: true },
  { id: 'Q4', text: 'O quanto você precisa de algum tratamento médico para levar sua vida diária?', domain: 'physical', negative: true },
  { id: 'Q5', text: 'O quanto você aproveita a vida?', domain: 'psychological' },
  { id: 'Q6', text: 'Em que medida você acha que a sua vida tem sentido?', domain: 'psychological' },
  { id: 'Q7', text: 'O quanto você consegue se concentrar?', domain: 'psychological' },
  { id: 'Q8', text: 'O quanto você se sente em segurança em sua vida diária?', domain: 'environment' },
  { id: 'Q9', text: 'Quão saudável é o seu ambiente físico (clima, barulho, poluição, atrativos)?', domain: 'environment' },
  
  // Bloco 3: Capacidade (quão completamente)
  { id: 'Q10', text: 'Você tem energia suficiente para seu dia-a-dia?', domain: 'physical' },
  { id: 'Q11', text: 'Você é capaz de aceitar sua aparência física?', domain: 'psychological' },
  { id: 'Q12', text: 'Você tem dinheiro suficiente para satisfazer suas necessidades?', domain: 'environment' },
  { id: 'Q13', text: 'Quão disponíveis para você estão as informações que precisa no seu dia-a-dia?', domain: 'environment' },
  { id: 'Q14', text: 'Em que medida você tem oportunidades de atividade de lazer?', domain: 'environment' },
  
  // Bloco 4: Satisfação/Avaliação (quão bem ou satisfeito)
  { id: 'Q15', text: 'Quão bem você é capaz de se locomover?', domain: 'physical' },
  { id: 'Q16', text: 'Quão satisfeito(a) você está com o seu sono?', domain: 'physical' },
  { id: 'Q17', text: 'Quão satisfeito(a) você está com sua capacidade de desempenhar as atividades do seu dia-a-dia?', domain: 'physical' },
  { id: 'Q18', text: 'Quão satisfeito(a) você está com sua capacidade para o trabalho?', domain: 'physical' },
  { id: 'Q19', text: 'Quão satisfeito(a) você está consigo mesmo?', domain: 'psychological' },
  { id: 'Q20', text: 'Quão satisfeito(a) você está com as condições do local onde mora?', domain: 'social' },
  { id: 'Q21', text: 'Quão satisfeito(a) você está com sua vida sexual?', domain: 'social' },
  { id: 'Q22', text: 'Quão satisfeito(a) você está com o apoio que você recebe de seus amigos?', domain: 'social' },
  { id: 'Q23', text: 'Quão satisfeito(a) você está com as condições do local onde mora?', domain: 'environment' },
  { id: 'Q24', text: 'Quão satisfeito(a) você está com o seu acesso aos serviços de saúde?', domain: 'environment' },
  { id: 'Q25', text: 'Quão satisfeito(a) você está com o seu meio de transporte?', domain: 'environment' },
  
  // Bloco 5: Frequência (com que frequência)
  { id: 'Q26', text: 'Com que frequência você tem sentimentos negativos tais como mau humor, desespero, ansiedade, depressão?', domain: 'psychological', negative: true },
];

/**
 * Mapeia cada domínio do WHOQOL-BREF para a lista de IDs de questões que o compõem.
 * Essencial para o cálculo dos escores de domínio.
 */
export const DOMAIN_QUESTIONS_MAP: { [key: string]: string[] } = {
  physical: ['Q3', 'Q4', 'Q10', 'Q15', 'Q16', 'Q17', 'Q18'],
  psychological: ['Q5', 'Q6', 'Q7', 'Q11', 'Q19', 'Q26'],
  social: ['Q20', 'Q21', 'Q22'],
  environment: ['Q8', 'Q9', 'Q12', 'Q13', 'Q14', 'Q23', 'Q24', 'Q25'],
  overall: ['Q1', 'Q2'],
};

/**
 * Mapeia os IDs de domínio para seus rótulos em português.
 * Usado para exibição na interface do usuário (gráficos, tabelas).
 */
export const DOMAIN_LABELS: { [key: string]: string } = {
  physical: 'Físico',
  psychological: 'Psicológico',
  social: 'Relações Sociais',
  environment: 'Meio Ambiente',
  overall: 'Qualidade de Vida e Saúde',
  qualidadeDeVidaMedia: 'Qualidade de Vida Média',
};

/**
 * Define as diferentes escalas Likert de 5 pontos usadas no questionário.
 * Cada chave corresponde a um tipo de avaliação (qualidade, satisfação, etc.).
 */
export const LIKERT_OPTIONS = {
  scale_quality: ['Muito ruim', 'Ruim', 'Nem ruim nem boa', 'Boa', 'Muito boa'],
  scale_satisfaction: ['Muito insatisfeito', 'Insatisfeito', 'Nem satisfeito nem insatisfeito', 'Satisfeito', 'Muito satisfeito'],
  scale_intensity: ['Nada', 'Muito pouco', 'Mais ou menos', 'Bastante', 'Extremamente'],
  scale_capacity: ['Nada', 'Muito pouco', 'Médio', 'Muito', 'Completamente'],
  scale_evaluation: ['Muito ruim', 'Ruim', 'Nem ruim nem bom', 'Bom', 'Muito bom'],
  scale_frequency: ['Nunca', 'Algumas vezes', 'Frequentemente', 'Muito frequentemente', 'Sempre'],
};

/**
 * Define a estrutura e as opções para os campos do formulário socioeconômico.
 */
export const SOCIOECONOMIC_FIELDS = [
    { id: 'age', label: 'Idade', type: 'number' },
    { id: 'gender', label: 'Gênero / Identidade de Gênero', type: 'select', options: [
      'Homem Cisgênero', 
      'Mulher Cisgênero', 
      'Homem Transgênero', 
      'Mulher Transgênero', 
      'Não-binário', 
      'Gênero Fluido',
      'Agênero',
      'Outro', 
      'Prefiro não informar'
    ] },
    { id: 'education', label: 'Escolaridade', type: 'select', options: ['Ensino Fundamental Incompleto', 'Ensino Fundamental Completo', 'Ensino Médio Incompleto', 'Ensino Médio Completo', 'Ensino Superior Incompleto', 'Ensino Superior Completo', 'Pós-graduação'] },
    { id: 'maritalStatus', label: 'Estado Civil', type: 'select', options: ['Solteiro(a)', 'Casado(a)/União Estável', 'Divorciado(a)/Separado(a)', 'Viúvo(a)'] },
    { id: 'profession', label: 'Profissão/Ocupação', type: 'text' },
    { id: 'income', label: 'Renda Familiar Mensal (em salários mínimos)', type: 'select', options: ['Até 1', 'Entre 1 e 2', 'Entre 2 e 4', 'Entre 4 e 10', 'Acima de 10'] },
];

/**
 * Lista de campos socioeconômicos que são puramente numéricos.
 * Usado em análises estatísticas como correlação e regressão.
 */
export const NUMERICAL_SOCIOECONOMIC_FIELDS = [
    { id: 'age', label: 'Idade' },
];

/**
 * O estado inicial para o formulário de dados socioeconômicos.
 * Valores categóricos iniciam vazios para obrigar a seleção ativa.
 */
export const INITIAL_SOCIOECONOMIC_DATA: SocioeconomicData = {
    age: '',
    gender: '',
    education: '',
    maritalStatus: '',
    profession: '',
    income: '',
};

/**
 * O estado inicial para as respostas do questionário WHOQOL-BREF.
 */
export const INITIAL_WHOQOL_RESPONSE: WHOQOLResponse = {};