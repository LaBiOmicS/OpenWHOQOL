import React from 'react';
import { Card } from '../ui/Card';
import { BookOpen, Database, SlidersHorizontal, Users, BarChart2, Sparkles, History, AlertTriangle, Info, CheckCircle, FileCode, Search, TestTube2, Group, Link2, TrendingUp, Cpu, Key, LifeBuoy, Server } from 'lucide-react';

/**
 * Componente que renderiza o Guia do Usuário (Manual do Administrador).
 * Focado em explicar o funcionamento da ferramenta para usuários não técnicos.
 */
const HelpTab: React.FC = () => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href')?.substring(1);
    if (targetId) {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
  };

  const GuideSection: React.FC<{ title: string, icon: React.ElementType, children: React.ReactNode, id: string }> = ({ title, icon: Icon, children, id }) => (
    <div id={id} className="mb-10 scroll-mt-20">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-blue-700 dark:text-blue-400 border-b border-gray-200 dark:border-gray-700 pb-2">
            <Icon className="w-6 h-6"/> {title}
        </h3>
        <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {children}
        </div>
    </div>
  );

  const SubSection: React.FC<{ title: string, icon?: React.ElementType, children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="mt-6 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
        <h4 className="text-md font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            {Icon && <Icon className="w-4 h-4" />} {title}
        </h4>
        <div className="text-sm space-y-2">{children}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2"><BookOpen/> Manual do Administrador</h1>
          <p className="opacity-90">Guia completo de utilização do OpenWHOQOL. Aprenda a gerenciar sua pesquisa, analisar dados e utilizar todos os recursos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Menu Lateral de Navegação */}
          <aside className="lg:col-span-1 lg:sticky top-8 self-start">
            <Card>
                <h3 className="font-bold mb-3 text-gray-800 dark:text-white">Navegação Rápida</h3>
                <ul className="space-y-2 text-sm">
                    <li><a href="#primeiros-passos" onClick={handleNavClick} className="text-blue-600 hover:underline">1. Primeiros Passos</a></li>
                    <li><a href="#estatisticas" onClick={handleNavClick} className="text-blue-600 hover:underline">2. Aba de Estatísticas</a></li>
                    <li><a href="#participantes" onClick={handleNavClick} className="text-blue-600 hover:underline">3. Aba de Participantes</a></li>
                    <li><a href="#analise-ia" onClick={handleNavClick} className="text-blue-600 hover:underline">4. Aba de Análise com IA</a></li>
                    <li><a href="#banco-de-dados" onClick={handleNavClick} className="text-blue-600 hover:underline">5. Aba de Banco de Dados</a></li>
                    <li><a href="#configuracao" onClick={handleNavClick} className="text-blue-600 hover:underline">6. Aba de Configuração</a></li>
                    <li><a href="#logs" onClick={handleNavClick} className="text-blue-600 hover:underline">7. Aba de Logs</a></li>
                    <li><a href="#doc-tecnica" onClick={handleNavClick} className="text-blue-600 hover:underline">8. Aba de Doc. Técnica</a></li>
                    <li><a href="#hospedagem" onClick={handleNavClick} className="text-blue-600 hover:underline">9. Hospedagem e Publicação</a></li>
                    <li><a href="#suporte" onClick={handleNavClick} className="text-blue-600 hover:underline">10. Suporte Técnico</a></li>
                </ul>
            </Card>
            <Card className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500">
                  <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                      <AlertTriangle size={20}/> Ponto Crítico: Backups!
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                      Por padrão, este sistema funciona <strong>Offline</strong>. Os dados ficam salvos <strong>apenas neste navegador/computador</strong>.
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      Se você limpar o cache ou formatar o PC, <strong>perderá tudo</strong>.
                  </p>
                  <div className="mt-4">
                      <p className="font-bold text-sm text-yellow-900 dark:text-yellow-100">Como se proteger?</p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                          Vá na aba <a href="#banco-de-dados" onClick={handleNavClick} className="font-bold underline">Banco de Dados</a> e use a função "Exportar Backup (JSON)" regularmente. Guarde este arquivo em local seguro (nuvem, pendrive).
                      </p>
                  </div>
              </Card>
          </aside>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">
              <Card>
                  {/* --- 1. PRIMEIROS PASSOS --- */}
                  <GuideSection title="1. Primeiros Passos e Coleta de Dados" icon={CheckCircle} id="primeiros-passos">
                      <p>Ao acessar o painel pela primeira vez, siga este fluxo para preparar sua pesquisa:</p>
                      <ol className="list-decimal list-inside space-y-2 ml-2 font-medium">
                          <li>Vá para a aba <a href="#configuracao" onClick={handleNavClick} className="text-blue-600 hover:underline font-bold">Configuração</a>.</li>
                          <li>Personalize o <strong>Nome do Projeto</strong> e a <strong>Instituição</strong>.</li>
                          <li>Edite o <strong>TCLE (Termo de Consentimento)</strong> para refletir as regras e objetivos do seu estudo.</li>
                          <li><strong>IMPORTANTE:</strong> Altere a senha padrão ("admin") na seção de Segurança para proteger seus dados.</li>
                          <li>Para coletar os dados, envie aos seus participantes o link principal da aplicação (o mesmo que você usou, mas <strong>sem</strong> a parte <code>?admin=true</code> no final).</li>
                      </ol>
                  </GuideSection>

                  {/* --- 2. ESTATÍSTICAS --- */}
                  <GuideSection title="2. Aba de Estatísticas" icon={BarChart2} id="estatisticas">
                      <p><strong>O que é?</strong> É o centro de análise da sua pesquisa. Aqui, todos os dados dos participantes (exceto os arquivados) são transformados em gráficos e tabelas, prontos para seu relatório ou artigo.</p>
                      
                      <SubSection title="Filtro de Amostra" icon={Search}>
                          <p>No topo da página, você pode filtrar os dados para visualizar as estatísticas de um grupo específico. Por exemplo, pode ver as médias apenas de participantes do gênero "Mulher Cisgênero" ou com "Ensino Superior Completo". Para voltar a ver todos, clique em "Mostrar Todos".</p>
                      </SubSection>

                      <SubSection title="Gráficos Descritivos">
                          <ul className="list-disc list-inside space-y-2">
                              <li><strong>Média dos Domínios:</strong> Mostra a pontuação média (0-100) para cada domínio. Barras coloridas indicam a qualidade: <span className="text-red-500">Ruim</span>, <span className="text-yellow-500">Regular</span>, <span className="text-green-500">Boa</span>, <span className="text-blue-500">Muito Boa</span>.</li>
                              <li><strong>Nuvem de Palavras:</strong> Exibe as profissões mais comuns. Quanto maior a palavra, mais frequente ela é.</li>
                              <li><strong>Gráficos de Pizza:</strong> Mostram a distribuição percentual para cada dado socioeconômico (Gênero, Escolaridade, etc.).</li>
                              <li><strong>Exportação:</strong> Todos os gráficos podem ser baixados como imagem (PNG, SVG) ou PDF.</li>
                          </ul>
                      </SubSection>

                      <SubSection title="Tabelas Estatísticas">
                          <p>As tabelas fornecem os números detalhados:</p>
                           <ul className="list-disc list-inside space-y-2">
                               <li><strong>Domínios WHOQOL:</strong> Tabela completa com Média, Desvio Padrão (D.P.), Mediana, Mínimo e Máximo para cada domínio.</li>
                               <li><strong>Análise Cruzada:</strong> Permite comparar a média dos domínios entre diferentes grupos (ex: comparar a média do domínio Físico entre Solteiros vs. Casados).</li>
                               <li><strong>Frequência de Respostas:</strong> Mostra a porcentagem de participantes que escolheu cada opção (1 a 5) em cada uma das 26 questões.</li>
                               <li><strong>Dados Socioeconômicos:</strong> Tabelas de resumo para idade e frequências para as demais variáveis.</li>
                           </ul>
                      </SubSection>

                       <SubSection title="Análises Avançadas" icon={TestTube2}>
                          <p>Esta seção realiza testes estatísticos mais complexos para validar hipóteses. O sistema automaticamente escolhe o teste mais adequado.</p>
                           <ul className="list-disc list-inside space-y-2">
                               <li><strong className="flex items-center gap-1"><Group size={14}/> Análise de Grupos:</strong> Use para comparar a média de um domínio entre 2 ou mais grupos (ex: A qualidade de vida psicológica difere entre os níveis de escolaridade?). Realiza Teste T ou ANOVA.</li>
                               <li><strong className="flex items-center gap-1"><Link2 size={14}/> Análise de Correlação:</strong> Use para ver se duas variáveis numéricas estão relacionadas (ex: A idade aumenta conforme o escore físico diminui?). Realiza Correlação de Pearson.</li>
                               <li><strong className="flex items-center gap-1"><TrendingUp size={14}/> Análise de Regressão:</strong> Use para verificar se uma variável pode prever outra (ex: O escore físico pode prever o escore psicológico?).</li>
                               <li><strong className="flex items-center gap-1"><Database size={14}/> Análise de Associação (χ²):</strong> Use para ver se duas variáveis categóricas estão associadas (ex: O estado civil está associado à faixa de renda?). Realiza Qui-Quadrado.</li>
                               <li><strong className="flex items-center gap-1"><TestTube2 size={14}/> Análise de Confiabilidade:</strong> Mede a consistência interna das questões de um domínio (Alfa de Cronbach).</li>
                           </ul>
                      </SubSection>
                  </GuideSection>

                  {/* --- 3. PARTICIPANTES --- */}
                  <GuideSection title="3. Aba de Participantes" icon={Users} id="participantes">
                      <p><strong>O que é?</strong> É a sua visão detalhada de cada participante. Permite gerenciar, filtrar e exportar os dados brutos.</p>
                      
                      <SubSection title="Filtros e Visualização">
                          <ul className="list-disc list-inside space-y-2">
                              <li><strong>Filtrar:</strong> Use os filtros no topo para encontrar participantes por ID, status (Incluído/Arquivado), data ou por qualquer dado socioeconômico.</li>
                              <li><strong>Colunas:</strong> Clique no botão "Colunas" para escolher exatamente quais dados você quer ver na tabela.</li>
                              <li><strong>Exportar:</strong> Os botões "Exportar" (CSV, TSV, XLS) baixam uma planilha contendo apenas os participantes que estão visíveis com o filtro aplicado.</li>
                          </ul>
                      </SubSection>

                      <SubSection title="Ações por Participante">
                          <ul className="list-disc list-inside space-y-2">
                              <li><strong className="text-blue-600">Ver Detalhes (ícone de olho):</strong> Abre uma janela com todas as respostas e escores daquele indivíduo.</li>
                              <li><strong className="text-yellow-600">Arquivar (ícone de arquivo):</strong> Esta é a forma segura de "excluir" alguém. O participante sai das análises estatísticas, mas seus dados continuam guardados. Você pode reativá-lo a qualquer momento. Ideal para respostas inválidas ou duplicadas.</li>
                          </ul>
                      </SubSection>

                      <SubSection title="Zona de Risco" icon={AlertTriangle}>
                          <p className="font-bold text-red-500">CUIDADO: O botão "Excluir Permanentemente" apaga para sempre todos os participantes que estão arquivados. Esta ação não pode ser desfeita. Use somente se tiver certeza e possuir um backup.</p>
                      </SubSection>
                  </GuideSection>

                  {/* --- 4. ANÁLISE COM IA --- */}
                  <GuideSection title="4. Aba de Análise com IA" icon={Sparkles} id="analise-ia">
                      <p><strong>O que é?</strong> Uma ferramenta poderosa que usa a Inteligência Artificial do Google (Gemini) para analisar seus dados e ajudar a escrever seu relatório ou artigo científico.</p>
                      
                      <SubSection title="Configuração Inicial" icon={Key}>
                          <p>Para usar a IA, você precisa de uma "Chave de API".</p>
                          <ol className="list-decimal list-inside space-y-2 ml-2">
                              <li>Obtenha uma chave gratuitamente no <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.</li>
                              <li>Cole a chave no campo "Chave de API" nesta aba e clique em "Salvar".</li>
                              <li>Recomendamos também selecionar o modelo <strong>Gemini 2.5 Pro</strong> para análises mais profundas e acadêmicas.</li>
                          </ol>
                      </SubSection>

                      <SubSection title="Como Usar">
                          <ol className="list-decimal list-inside space-y-2 ml-2">
                              <li><strong>Etapa 1: Gerar Resultados:</strong> Clique no botão "Gerar Resultados". A IA irá analisar todas as estatísticas e escrever um texto técnico descrevendo os achados.</li>
                              <li><strong>Etapa 2: Gerar Discussão:</strong> Após os resultados aparecerem, preencha algumas palavras-chave sobre o tema da sua pesquisa (ex: "idosos", "saúde mental", "qualidade de vida no trabalho"). A IA irá usar a Busca do Google para encontrar artigos científicos reais, comparar com seus resultados e escrever a seção "Discussão", já com as referências em formato ABNT.</li>
                              <li><strong>Análise Interativa (Chat):</strong> Converse com seus dados. Faça perguntas como "Qual a média de idade dos participantes?" ou "Qual domínio teve o pior escore?" e a IA responderá instantaneamente.</li>
                          </ol>
                      </SubSection>
                  </GuideSection>

                   {/* --- 5. BANCO DE DADOS --- */}
                  <GuideSection title="5. Aba de Banco de Dados" icon={Database} id="banco-de-dados">
                      <p><strong>O que é?</strong> É a área de gerenciamento "bruto" dos dados. Essencial para segurança (backups) e testes.</p>
                      
                      <SubSection title="Backup & Migração (O MAIS IMPORTANTE!)">
                          <ul className="list-disc list-inside space-y-2">
                              <li><strong>Exportar Backup (JSON):</strong> <span className="font-bold">Esta é a função mais importante.</span> Use-a para salvar uma cópia de segurança de TODOS os seus dados (participantes, configurações, etc.) em um único arquivo. Faça isso regularmente!</li>
                              <li><strong>Restaurar Backup (JSON):</strong> Use para carregar um arquivo de backup. Útil para recuperar dados ou migrar sua pesquisa para outro computador. ATENÇÃO: isso apaga os dados atuais e os substitui pelos do arquivo.</li>
                              <li><strong>Importar Planilha (CSV/XLS):</strong> Permite adicionar participantes a partir de uma planilha, caso você tenha dados de outra fonte.</li>
                          </ul>
                      </SubSection>

                      <SubSection title="Gerar Dados de Teste">
                          <p>Crie participantes fictícios para testar as funcionalidades do sistema sem usar dados reais. Você pode escolher perfis (ex: "Idosos", "Estudantes") para simular diferentes cenários.</p>
                      </SubSection>
                      
                       <SubSection title="Zona de Perigo" icon={AlertTriangle}>
                          <p className="font-bold text-red-500">CUIDADO: O botão "Apagar Todos os Dados" remove TODOS os participantes do banco de dados local. Use apenas se souber o que está fazendo e tiver um backup.</p>
                      </SubSection>
                  </GuideSection>

                  {/* --- 6. CONFIGURAÇÃO --- */}
                  <GuideSection title="6. Aba de Configuração" icon={SlidersHorizontal} id="configuracao">
                      <p><strong>O que é?</strong> Aqui você personaliza as informações da sua pesquisa e ajusta a segurança e o comportamento da IA.</p>
                       <ul className="list-disc list-inside space-y-2">
                           <li><strong>Configurações da Pesquisa:</strong> Altere o nome do projeto, TCLE, informações de contato, etc. Tudo que o participante vê na primeira tela é configurado aqui. Você também pode habilitar o arquivamento automático para menores de 18 anos e tornar o e-mail do participante obrigatório (útil para correlacionar dados).</li>
                           <li><strong>Notificações por E-mail:</strong> Configure o sistema para enviar um e-mail automático para o administrador a cada nova resposta. Isso requer um pequeno servidor customizado (um exemplo de código é fornecido na própria tela de configuração).</li>
                           <li><strong>Segurança:</strong> Altere sua senha de administrador. É fundamental fazer isso no primeiro uso!</li>
                           <li><strong className="flex items-center gap-1"><Cpu size={14}/> Gestão do Cérebro da IA:</strong> Configurações avançadas para a IA.
                                <ul className="list-['-_'] list-inside ml-4">
                                    <li><strong>Identidade (Persona):</strong> Diga à IA quem ela deve ser (ex: "um pesquisador sênior", "um estatístico").</li>
                                    <li><strong>Contexto Global:</strong> Informações que a IA deve sempre lembrar sobre seu estudo (ex: "Este estudo foi feito em um hospital público").</li>
                                    <li><strong>Parâmetros:</strong> Ajustes finos como a "Temperatura", que controla a criatividade vs. a precisão da IA.</li>
                                </ul>
                           </li>
                       </ul>
                  </GuideSection>

                   {/* --- 7. LOGS --- */}
                  <GuideSection title="7. Aba de Logs" icon={History} id="logs">
                      <p><strong>O que é?</strong> Um registro de auditoria. Todas as ações importantes que você realiza no painel (login, alteração de senha, exclusão de dados) são registradas aqui com data e hora. Útil para segurança e controle.</p>
                  </GuideSection>
                  
                  {/* --- 8. DOC TÉCNICA --- */}
                  <GuideSection title="8. Aba de Doc. Técnica" icon={FileCode} id="doc-tecnica">
                      <p><strong>O que é?</strong> Documentação voltada para desenvolvedores ou usuários com conhecimento técnico. Detalha a arquitetura do sistema, tecnologias usadas, requisitos de segurança e padrões de desenvolvimento. Você não precisa consultá-la para o uso normal da ferramenta.</p>
                  </GuideSection>

                  {/* --- 9. HOSPEDAGEM E PUBLICAÇÃO --- */}
                  <GuideSection title="9. Hospedagem e Publicação" icon={Server} id="hospedagem">
                      <p><strong>O que é?</strong> O OpenWHOQOL é uma aplicação estática, o que significa que ela pode ser hospedada em qualquer serviço que sirva arquivos HTML, CSS e JavaScript. Aqui estão algumas opções:</p>
                  
                      <SubSection title="Opção 1: Hospedagem Local (Para Testes e Desenvolvimento)">
                          <p>Ideal para testar modificações ou usar a ferramenta em um único computador sem publicá-la na internet.</p>
                          <ol className="list-decimal list-inside space-y-2 ml-2">
                              <li>Faça o download ou clone o repositório do <a href="https://github.com/LaBiOmicS/OpenWHOQOL" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">GitHub</a> para o seu computador.</li>
                              <li>Navegue até a pasta do projeto pelo seu terminal de comando.</li>
                              <li>Inicie um servidor web simples. Se você tem Python instalado, pode usar: <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-xs">python -m http.server</code>.</li>
                              <li>Abra seu navegador e acesse <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-xs">http://localhost:8000</code>.</li>
                              <li>Alternativamente, se você usa o VS Code, pode instalar a extensão "Live Server" e clicar em "Go Live".</li>
                          </ol>
                      </SubSection>
                  
                      <SubSection title="Opção 2: Publicação Gratuita (Vercel, Render, Netlify, etc.)">
                          <p>Esta é a maneira recomendada para disponibilizar sua pesquisa online para os participantes. O processo é similar em todas as plataformas modernas.</p>
                          <p className="font-bold">Usando a Vercel como exemplo:</p>
                          <ol className="list-decimal list-inside space-y-2 ml-2">
                              <li>Crie uma conta no GitHub e faça um "Fork" do repositório <a href="https://github.com/LaBiOmicS/OpenWHOQOL" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">LaBiOmicS/OpenWHOQOL</a> para sua própria conta. Isso cria uma cópia sua.</li>
                              <li>Crie uma conta na <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Vercel</a> e conecte-a com sua conta do GitHub.</li>
                              <li>No painel da Vercel, clique em "Add New..." e depois em "Project".</li>
                              <li>Importe o repositório que você "forkou" no passo 1.</li>
                              <li>A Vercel deve detectar automaticamente que é um site estático. <strong>Você não precisa configurar um "Build Command" ou "Framework Preset"</strong>. Deixe os campos de build vazios.</li>
                              <li>Clique em "Deploy". Em segundos, sua aplicação estará online com um link público que você pode compartilhar.</li>
                          </ol>
                          <p className="mt-2 text-xs italic">O processo para Render, Netlify ou GitHub Pages é muito semelhante: conecte seu repositório e configure-o como um site estático sem etapa de build.</p>
                      </SubSection>
                  </GuideSection>
                  
                  {/* --- 10. SUPORTE TÉCNICO --- */}
                  <GuideSection title="10. Suporte Técnico" icon={LifeBuoy} id="suporte">
                      <p>Se você encontrar um bug, tiver uma sugestão de melhoria ou precisar de ajuda com um problema técnico, a melhor forma de nos contatar é através do nosso repositório no GitHub.</p>
                      <p>Utilize a nova aba <strong>Suporte</strong> no painel administrativo para preencher um formulário que abrirá uma "issue" (um ticket de suporte) diretamente para os desenvolvedores. Isso nos ajuda a organizar as solicitações e a resolver os problemas de forma mais eficiente.</p>
                  </GuideSection>

              </Card>
          </div>
      </div>
    </div>
  );
};

export default HelpTab;
