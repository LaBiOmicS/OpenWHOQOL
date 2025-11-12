import React from 'react';
import { Card } from '../ui/Card';
import { 
    FileCode, Layers, Database, Cpu, ListChecks, Target, 
    ShieldCheck, Lock, Server, Code, GitBranch, Box, FolderTree, FileJson,
    Accessibility, Zap, Clock, Users, Mail
} from 'lucide-react';

// --- Componentes Auxiliares de UI ---

const Section: React.FC<{ title: string, icon: React.ElementType, children: React.ReactNode, className?: string }> = ({ title, icon: Icon, children, className }) => (
    <Card className={`border-l-4 border-l-blue-500 ${className}`}>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-800 dark:text-white border-b pb-2 dark:border-gray-700">
        <Icon className="text-blue-600 w-6 h-6"/> {title}
      </h2>
      <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </Card>
);

const ReqTable: React.FC<{ headers: string[], rows: (string | React.ReactNode)[][] }> = ({ headers, rows }) => (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 mt-4">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                    {headers.map((h, i) => (
                        <th key={i} className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs">
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        {row.map((cell, j) => (
                            <td key={j} className="px-4 py-3 whitespace-normal text-gray-700 dark:text-gray-300">
                                {j === 0 ? <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{cell}</span> : cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const Badge: React.FC<{ children: React.ReactNode, color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'gray' }> = ({ children, color = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${colors[color]}`}>{children}</span>;
};

const TechnicalDocsTab: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
        
        {/* --- Header --- */}
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documentação Técnica do Sistema</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">OpenWHOQOL v1.0.0 • Especificação de Arquitetura e Requisitos</p>
        </div>

        {/* --- 1. Visão Geral --- */}
        <Section title="1. Visão Geral e Escopo" icon={Target}>
            <p>O <strong>OpenWHOQOL</strong> é uma Single Page Application (SPA) para administração do instrumento WHOQOL-BREF. O sistema opera sob o paradigma <strong>Local-First</strong>, priorizando a privacidade dos dados e a disponibilidade offline, com sincronização externa opcional.</p>
        </Section>

        {/* --- 2. Requisitos Funcionais --- */}
        <Section title="2. Requisitos Funcionais (RFs)" icon={ListChecks}>
            <p>Os Requisitos Funcionais descrevem as funcionalidades que o sistema deve executar.</p>
            <ReqTable 
                headers={['ID', 'Requisito', 'Descrição']}
                rows={[
                    ['RF-001', 'Autenticação de Administrador', 'O sistema deve prover uma tela de login para acesso ao painel administrativo.'],
                    ['RF-002', 'Configuração da Pesquisa', 'O admin deve poder configurar o nome do projeto, TCLE, e outros metadados do estudo.'],
                    ['RF-003', 'Fluxo de Coleta do Participante', 'O sistema deve guiar o participante através das etapas de consentimento, formulário socioeconômico e questionário WHOQOL-BREF.'],
                    ['RF-004', 'Validação de Dados de Entrada', 'Todos os campos dos formulários devem ser validados para garantir o preenchimento completo e correto.'],
                    ['RF-005', 'Armazenamento Local-First', 'Os dados coletados devem ser persistidos primariamente no IndexedDB do navegador.'],
                    ['RF-006', 'Visualização de Dados', 'O admin deve poder visualizar todos os participantes e seus dados individuais em uma tabela paginada e filtrável.'],
                    ['RF-007', 'Gerenciamento de Participantes', 'O admin deve poder arquivar (excluir da análise) e excluir permanentemente os participantes.'],
                    ['RF-008', 'Análise Estatística Descritiva', 'O sistema deve calcular e exibir automaticamente estatísticas descritivas (média, DP, frequência) e gráficos.'],
                    ['RF-009', 'Análise Estatística Inferencial', 'O sistema deve ser capaz de executar testes avançados (Teste T, ANOVA, Correlação, Qui-Quadrado, Confiabilidade).'],
                    ['RF-010', 'Análise com IA', 'O sistema deve integrar-se com a API do Google Gemini para gerar seções de Resultados, Discussão e permitir análise via chat.'],
                    ['RF-011', 'Exportação de Dados', 'O admin deve poder exportar dados em múltiplos formatos (CSV, TSV, XLS, JSON).'],
                    ['RF-012', 'Importação de Dados', 'O sistema deve permitir a importação de participantes via arquivos JSON, CSV ou XLS.'],
                    ['RF-013', 'Geração de Dados de Teste', 'O admin deve poder gerar dados fictícios para fins de teste e demonstração.'],
                    ['RF-014', 'Auditoria (Logs)', 'O sistema deve registrar todas as ações administrativas críticas em um log de auditoria.'],
                    ['RF-015', 'Notificação por E-mail', 'O sistema deve ser capaz de enviar uma notificação por e-mail para o administrador a cada nova submissão, contendo os dados do participante em anexo (XLSX). O envio deve ser realizado via uma chamada de API para um endpoint externo configurável.'],
                ]}
            />
        </Section>

        {/* --- 3. Requisitos Não Funcionais --- */}
        <Section title="3. Requisitos Não Funcionais (RNFs)" icon={Cpu}>
            <p>Os Requisitos Não Funcionais definem os critérios de qualidade e operação do sistema.</p>
             <ReqTable 
                headers={['ID', 'Categoria', 'Requisito', 'Descrição']}
                rows={[
                    ['RNF-01', <><Accessibility className="inline w-4 h-4 mr-1"/> Usabilidade</>, 'Interface Responsiva', 'A aplicação deve ser totalmente funcional em desktops, tablets e smartphones.'],
                    ['RNF-02', <><Accessibility className="inline w-4 h-4 mr-1"/> Usabilidade</>, 'Intuitividade', 'O fluxo de navegação deve ser claro e requerer o mínimo de treinamento para o administrador.'],
                    ['RNF-03', <><Zap className="inline w-4 h-4 mr-1"/> Desempenho</>, 'Carregamento Rápido', 'O carregamento inicial da aplicação deve ser inferior a 3 segundos em uma conexão 3G.'],
                    ['RNF-04', <><Zap className="inline w-4 h-4 mr-1"/> Desempenho</>, 'Responsividade da UI', 'Cálculos estatísticos e interações com a UI não devem travar o navegador, mesmo com milhares de participantes.'],
                    ['RNF-05', <><Clock className="inline w-4 h-4 mr-1"/> Confiabilidade</>, 'Operação Offline', 'Todas as funcionalidades core (coleta, análise, gerenciamento) devem funcionar sem conexão à internet.'],
                    ['RNF-06', <><Layers className="inline w-4 h-4 mr-1"/> Portabilidade</>, 'Compatibilidade', 'O sistema deve ser compatível com as duas últimas versões dos navegadores: Chrome, Firefox, Safari e Edge.'],
                    ['RNF-07', <><Code className="inline w-4 h-4 mr-1"/> Manutenibilidade</>, 'Código Modular', 'A lógica de negócio (cálculos, DB) deve ser separada da camada de apresentação (UI).'],
                ]}
            />
        </Section>

        {/* --- 4. Requisitos de Dados e Conformidade (LGPD) --- */}
        <Section title="4. Requisitos de Dados e Conformidade (LGPD)" icon={Database}>
            <p className="mb-4">A aplicação foi desenhada sob os princípios de <em>Privacy by Design</em>. A tabela abaixo detalha o mapeamento de dados conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
            <ReqTable 
                headers={['Dado', 'Classificação', 'Obrigatório', 'Finalidade', 'Base Legal (Sugerida)']}
                rows={[
                    ['E-mail', <Badge color="yellow">Dado Pessoal</Badge>, 'Condicional (configurável)', 'Contato futuro ou correlação de dados entre estudos.', 'Consentimento'],
                    ['Respostas WHOQOL', <Badge color="red">Sensível (Saúde)</Badge>, 'Sim', 'Cálculo de escores de qualidade de vida.', 'Pesquisa (Org. Pública) ou Legítimo Interesse'],
                    ['Idade', <Badge color="blue">Demográfico</Badge>, 'Sim', 'Estatística descritiva e correlação.', 'Pesquisa'],
                    ['Gênero', <Badge color="red">Sensível</Badge>, 'Sim', 'Análise comparativa de grupos.', 'Pesquisa'],
                    ['Escolaridade/Renda', <Badge color="blue">Demográfico</Badge>, 'Sim', 'Perfil socioeconômico.', 'Pesquisa'],
                    ['Logs de Sistema', <Badge color="purple">Segurança</Badge>, 'Automático', 'Auditoria e segurança da informação.', 'Cumprimento de Obrigação Legal'],
                ]}
            />
        </Section>
        
        {/* --- 5. Requisitos de Segurança --- */}
        <Section title="5. Requisitos de Segurança (RSs)" icon={ShieldCheck}>
             <p className="mb-4">Esta seção detalha os requisitos e medidas implementadas para garantir a segurança da aplicação e dos dados coletados.</p>
             <ReqTable 
                headers={['ID', 'Requisito', 'Implementação e Detalhes']}
                rows={[
                    ['RS-01', 'Autenticação Robusta', 'Acesso ao painel administrativo protegido por credenciais locais. A UI reforça uma política de senha forte (mínimo de 8 caracteres, incluindo maiúscula, minúscula, número e símbolo especial).'],
                    ['RS-02', 'Controle de Acesso', 'Separação lógica estrita entre a view do participante e a view do administrador. A URL com `?admin=true` apenas direciona para a tela de login, não garante acesso.'],
                    ['RS-03', 'Dados em Repouso', 'Os dados são armazenados no IndexedDB, que opera dentro do sandbox do navegador, protegido pela Same-Origin Policy, impedindo acesso por scripts de outros domínios.'],
                    ['RS-04', 'Dados em Trânsito', 'Para a sincronização externa opcional, é mandatório o uso de HTTPS. A autenticação com a API de backend é realizada via header `x-api-key`.'],
                    ['RS-05', 'Prevenção de Ataques', 'Validação de entrada e uso de bibliotecas modernas (React) ajudam a mitigar riscos básicos de Cross-Site Scripting (XSS).'],
                    ['RS-06', 'Trilha de Auditoria', 'O módulo de Logs registra todas as ações críticas do administrador, permitindo rastreabilidade e detecção de atividades anormais.'],
                    ['RS-07', 'Gerenciamento de Segredos de Servidor', 'Credenciais de serviços de terceiros (e.g., SMTP para e-mails) NUNCA devem ser armazenadas no frontend; a funcionalidade de e-mail depende de um backend seguro que gerencia essas credenciais.'],
                ]}
            />
        </Section>
        
        {/* --- 6. Stack Tecnológica --- */}
        <Section title="6. Arquitetura e Stack Tecnológica" icon={Layers}>
            <div className="mb-4"><p>A aplicação é construída sobre o ecossistema React, utilizando Vite como bundler. Abaixo estão as versões exatas das dependências principais (conforme <code>importmap</code>).</p></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border dark:border-gray-700">
                    <h4 className="font-bold text-blue-600 mb-2 flex items-center gap-2"><Code size={16}/> Core</h4>
                    <ul className="text-sm space-y-2">
                        <li className="flex justify-between"><span>React</span> <Badge color="blue">^19.2.0</Badge></li>
                        <li className="flex justify-between"><span>TypeScript</span> <Badge color="blue">5.x</Badge></li>
                    </ul>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border dark:border-gray-700">
                    <h4 className="font-bold text-green-600 mb-2 flex items-center gap-2"><Box size={16}/> Funcionalidades</h4>
                    <ul className="text-sm space-y-2">
                        <li className="flex justify-between"><span>@google/genai</span> <Badge color="purple">^1.29.0</Badge></li>
                        <li className="flex justify-between"><span>Recharts</span> <Badge color="green">^3.3.0</Badge></li>
                        <li className="flex justify-between"><span>XLSX (SheetJS)</span> <Badge color="yellow">^0.18.5</Badge></li>
                    </ul>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border dark:border-gray-700">
                    <h4 className="font-bold text-purple-600 mb-2 flex items-center gap-2"><FolderTree size={16}/> Utilitários</h4>
                    <ul className="text-sm space-y-2">
                        <li className="flex justify-between"><span>Lucide React</span> <Badge color="gray">^0.552.0</Badge></li>
                        <li className="flex justify-between"><span>TailwindCSS</span> <Badge color="blue">3.4 (CDN)</Badge></li>
                    </ul>
                </div>
            </div>
        </Section>

        {/* --- 7. Padrões de Desenvolvimento --- */}
        <Section title="7. Padrões de Projeto e Desenvolvimento" icon={GitBranch}>
            <div className="space-y-4">
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white mb-2">Estrutura de Diretórios</h3>
                    <p>A estrutura de pastas promove a separação de responsabilidades (SoC), isolando UI, lógica de negócio e hooks.</p>
                </div>
                <div className="border-t dark:border-gray-700 pt-4">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-2">Convenções de Código</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-gray-700 dark:text-gray-300">
                        <li><strong>Nomenclatura:</strong> <code>PascalCase</code> para componentes/interfaces, <code>camelCase</code> para variáveis/funções.</li>
                        <li><strong>Tipagem:</strong> Uso estrito de TypeScript. Interfaces globais definidas em <code>types.ts</code>.</li>
                        <li><strong>Comentários:</strong> JSDoc para todas as funções exportadas e componentes complexos.</li>
                    </ul>
                </div>
            </div>
        </Section>

        {/* --- 8. Regras de Negócio --- */}
        <Section title="8. Regras de Negócio (RNs)" icon={ListChecks}>
            <ReqTable 
                headers={['ID', 'Regra', 'Descrição Técnica']}
                rows={[
                    ['RN01', 'Cálculo WHOQOL', 'Inversão de itens negativos (Q3,Q4,Q26). Transformação 0-100: ((média - 1) * 25).'],
                    ['RN02', 'Dados Ausentes', 'Se >20% dos itens de um domínio são nulos, o escore do domínio é NaN.'],
                    ['RN03', 'Menores de Idade', 'Se enforceAgeRestriction=true e idade < 18, participante é marcado com isExcluded=true.'],
                    ['RN04', 'Fluxo Obrigatório', 'TCLE deve ser aceito. Todas as 26 questões WHOQOL e socioeconômicas são obrigatórias.'],
                ]}
            />
        </Section>

        {/* --- 9. Módulos de Lógica de Negócio --- */}
        <Section title="9. Módulos de Lógica de Negócio" icon={FileCode}>
            <div className="space-y-3 text-sm">
                <details className="group border dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800/50 p-2">
                    <summary className="font-mono font-bold cursor-pointer text-blue-600">lib/whoqol.ts</summary>
                    <p className="mt-2 px-2">Contém o algoritmo core de cálculo dos domínios, inversão de escalas e tratamento de nulos, conforme sintaxe da OMS.</p>
                </details>
                <details className="group border dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800/50 p-2">
                    <summary className="font-mono font-bold cursor-pointer text-green-600">lib/statistics.ts</summary>
                    <p className="mt-2 px-2">Implementa funções de estatística descritiva (Média, Mediana, DP, Quartis R-7) e frequência.</p>
                </details>
                <details className="group border dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800/50 p-2">
                    <summary className="font-mono font-bold cursor-pointer text-purple-600">lib/advanced-stats.ts</summary>
                    <p className="mt-2 px-2">Implementa os testes estatísticos inferenciais: Teste T, ANOVA, Qui-Quadrado, Alfa de Cronbach, etc.</p>
                </details>
                <details className="group border dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800/50 p-2">
                    <summary className="font-mono font-bold cursor-pointer text-orange-600">lib/db.ts</summary>
                    <p className="mt-2 px-2">Camada de abstração de dados (Data Abstraction Layer). Gerencia o IndexedDB e a lógica de fallback/sync com API externa.</p>
                </details>
            </div>
        </Section>
    </div>
  );
};

export default TechnicalDocsTab;
