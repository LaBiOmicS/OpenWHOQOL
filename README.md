# OpenWHOQOL v1.0.0  
**Documentação Técnica Completa do Sistema**  
**Especificação de Arquitetura, Operação e Requisitos**  

---

## 1. Visão Geral e Escopo
O **OpenWHOQOL** é uma *Single Page Application* (SPA) para administração do instrumento **WHOQOL-BREF**, desenvolvido em **React + TypeScript + Vite**.  
O sistema adota o paradigma **Local-First**, priorizando a privacidade dos dados e a disponibilidade offline, com sincronização externa opcional.  
A ferramenta foi projetada para pesquisadores, estudantes e instituições que realizam estudos sobre qualidade de vida com base em instrumentos psicométricos validados, garantindo conformidade com a **LGPD (Lei nº 13.709/2018)** e suporte completo a análises estatísticas e inferenciais.

---

## 2. Requisitos Funcionais (RFs)
Os Requisitos Funcionais descrevem as funcionalidades que o sistema deve executar.

<table>
  <thead>
    <tr>
      <th align="left">ID</th>
      <th align="left">Requisito</th>
      <th align="left">Descrição</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="white-space:nowrap;">RF-001</td><td>Autenticação de Administrador</td><td>O sistema deve prover uma tela de login para acesso ao painel administrativo.</td></tr>
    <tr><td style="white-space:nowrap;">RF-002</td><td>Configuração da Pesquisa</td><td>O admin deve poder configurar o nome do projeto, TCLE, e outros metadados do estudo.</td></tr>
    <tr><td style="white-space:nowrap;">RF-003</td><td>Fluxo de Coleta do Participante</td><td>O sistema deve guiar o participante através das etapas de consentimento, formulário socioeconômico e questionário WHOQOL-BREF.</td></tr>
    <tr><td style="white-space:nowrap;">RF-004</td><td>Validação de Dados de Entrada</td><td>Todos os campos dos formulários devem ser validados para garantir o preenchimento completo e correto.</td></tr>
    <tr><td style="white-space:nowrap;">RF-005</td><td>Armazenamento Local-First</td><td>Os dados coletados devem ser persistidos primariamente no IndexedDB do navegador.</td></tr>
    <tr><td style="white-space:nowrap;">RF-006</td><td>Visualização de Dados</td><td>O admin deve poder visualizar todos os participantes e seus dados individuais em uma tabela paginada e filtrável.</td></tr>
    <tr><td style="white-space:nowrap;">RF-007</td><td>Gerenciamento de Participantes</td><td>O admin deve poder arquivar (excluir da análise) e excluir permanentemente os participantes.</td></tr>
    <tr><td style="white-space:nowrap;">RF-008</td><td>Análise Estatística Descritiva</td><td>O sistema deve calcular e exibir automaticamente estatísticas descritivas (média, DP, frequência) e gráficos.</td></tr>
    <tr><td style="white-space:nowrap;">RF-009</td><td>Análise Estatística Inferencial</td><td>O sistema deve ser capaz de executar testes avançados (Teste T, ANOVA, Correlação, Qui-Quadrado, Confiabilidade).</td></tr>
    <tr><td style="white-space:nowrap;">RF-010</td><td>Análise com IA</td><td>O sistema deve integrar-se com a API do Google Gemini para gerar seções de Resultados, Discussão e permitir análise via chat.</td></tr>
    <tr><td style="white-space:nowrap;">RF-011</td><td>Exportação de Dados</td><td>O admin deve poder exportar dados em múltiplos formatos (CSV, TSV, XLS, JSON).</td></tr>
    <tr><td style="white-space:nowrap;">RF-012</td><td>Importação de Dados</td><td>O sistema deve permitir a importação de participantes via arquivos JSON, CSV ou XLS.</td></tr>
    <tr><td style="white-space:nowrap;">RF-013</td><td>Geração de Dados de Teste</td><td>O admin deve poder gerar dados fictícios para fins de teste e demonstração.</td></tr>
    <tr><td style="white-space:nowrap;">RF-014</td><td>Auditoria (Logs)</td><td>O sistema deve registrar todas as ações administrativas críticas em um log de auditoria.</td></tr>
    <tr><td style="white-space:nowrap;">RF-015</td><td>Notificação por E-mail</td><td>O sistema deve ser capaz de enviar uma notificação por e-mail para o administrador a cada nova submissão, contendo os dados do participante em anexo (XLSX). O envio deve ser realizado via uma chamada de API para um endpoint externo configurável.</td></tr>
  </tbody>
</table>

---

## 3. Requisitos Não Funcionais (RNFs)
Os Requisitos Não Funcionais definem os critérios de qualidade e operação do sistema.

| ID | Categoria | Requisito | Descrição |
|----|-----------|-----------|-----------|
| <span style="white-space:nowrap;">RNF-01</span> | Usabilidade | Interface Responsiva | A aplicação deve ser totalmente funcional em desktops, tablets e smartphones. |
| <span style="white-space:nowrap;">RNF-02</span> | Usabilidade | Intuitividade | O fluxo de navegação deve ser claro e requerer o mínimo de treinamento para o administrador. |
| <span style="white-space:nowrap;">RNF-03</span> | Desempenho | Carregamento Rápido | O carregamento inicial da aplicação deve ser inferior a 3 segundos em uma conexão 3G. |
| <span style="white-space:nowrap;">RNF-04</span> | Desempenho | Responsividade da UI | Cálculos estatísticos e interações com a UI não devem travar o navegador, mesmo com milhares de participantes. |
| <span style="white-space:nowrap;">RNF-05</span> | Confiabilidade | Operação Offline | Todas as funcionalidades core (coleta, análise, gerenciamento) devem funcionar sem conexão à internet. |
| <span style="white-space:nowrap;">RNF-06</span> | Portabilidade | Compatibilidade | O sistema deve ser compatível com as duas últimas versões dos navegadores: Chrome, Firefox, Safari e Edge. |
| <span style="white-space:nowrap;">RNF-07</span> | Manutenibilidade | Código Modular | A lógica de negócio (cálculos, DB) deve ser separada da camada de apresentação (UI). |

---

## 4. Requisitos de Dados e Conformidade (LGPD)
A aplicação foi desenhada sob os princípios de **Privacy by Design**. A tabela abaixo detalha o mapeamento de dados conforme a **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)**.

| Dado | Classificação | Obrigatório | Finalidade | Base Legal (Sugerida) |
|------|---------------|------------|-----------|------------------------|
| E-mail | Dado Pessoal | Condicional (configurável) | Contato futuro ou correlação de dados entre estudos. | Consentimento |
| Respostas WHOQOL | Sensível (Saúde) | Sim | Cálculo de escores de qualidade de vida. | Pesquisa (Org. Pública) ou Legítimo Interesse |
| Idade | Demográfico | Sim | Estatística descritiva e correlação. | Pesquisa |
| Gênero | Sensível | Sim | Análise comparativa de grupos. | Pesquisa |
| Escolaridade/Renda | Demográfico | Sim | Perfil socioeconômico. | Pesquisa |
| Logs de Sistema | Segurança | Automático | Auditoria e segurança da informação. | Cumprimento de Obrigação Legal |

---

## 5. Requisitos de Segurança (RSs)
Esta seção detalha os requisitos e medidas implementadas para garantir a segurança da aplicação e dos dados coletados.

| ID | Requisito | Implementação e Detalhes |
|----|-----------|--------------------------|
| RS-01 | Autenticação Robusta | Acesso ao painel administrativo protegido por credenciais locais. Política de senha forte (mínimo de 8 caracteres, incluindo maiúscula, minúscula, número e símbolo especial). |
| RS-02 | Controle de Acesso | Separação lógica estrita entre a view do participante e a view do administrador. A URL com `?admin=true` apenas direciona para a tela de login, não garante acesso. |
| RS-03 | Dados em Repouso | Dados armazenados no IndexedDB, sob *Same-Origin Policy*, impedindo acesso por scripts de outros domínios. |
| RS-04 | Dados em Trânsito | Para a sincronização externa opcional, uso obrigatório de **HTTPS**. Autenticação com a API de backend via header `x-api-key`. |
| RS-05 | Prevenção de Ataques | Validação de entrada e uso de bibliotecas modernas (React) mitigam XSS. |
| RS-06 | Trilha de Auditoria | Módulo de Logs registra todas as ações críticas do administrador, permitindo rastreabilidade e detecção de atividades anormais. |
| RS-07 | Gerenciamento de Segredos de Servidor | Credenciais de terceiros (SMTP, etc.) **nunca** no frontend; a funcionalidade de e-mail depende de backend seguro que gerencia segredos. |

---

## 6. Arquitetura e Stack Tecnológica
A aplicação é construída sobre o ecossistema **React**, utilizando **Vite** como bundler. Dependências principais:

- **Core**: React ^19.2.0 · TypeScript 5.x  
- **Funcionalidades**: @google/genai ^1.29.0 · Recharts ^3.3.0 · XLSX (SheetJS) ^0.18.5  
- **Utilitários**: Lucide React ^0.552.0 · TailwindCSS 3.4 (CDN)

### Estrutura de Diretórios
```
📦 openwhoqol
 ┣ 📂 src
 ┃ ┣ 📂 components
 ┃ ┣ 📂 hooks
 ┃ ┣ 📂 lib
 ┃ ┃ ┣ whoqol.ts
 ┃ ┃ ┣ statistics.ts
 ┃ ┃ ┣ advanced-stats.ts
 ┃ ┃ ┗ db.ts
 ┃ ┣ 📂 pages
 ┃ ┗ types.ts
```

---

## 7. Padrões de Projeto e Desenvolvimento
- **Separação de responsabilidades (SoC)**: UI, lógica de negócio e persistência modularizadas.  
- **Nomenclatura**: PascalCase para componentes/interfaces; camelCase para variáveis/funções.  
- **Tipagem**: TypeScript estrito. Interfaces globais definidas em `types.ts`.  
- **Comentários**: JSDoc para funções exportadas e componentes complexos.  

---

## 8. Regras de Negócio (RNs)
| ID | Regra | Descrição Técnica |
|----|-------|-------------------|
| RN01 | Cálculo WHOQOL | Inversão de itens negativos (Q3,Q4,Q26). Transformação 0–100: `((média - 1) * 25)`. |
| RN02 | Dados Ausentes | Se >20% dos itens de um domínio são nulos, o escore do domínio é `NaN`. |
| RN03 | Menores de Idade | Se `enforceAgeRestriction=true` e `idade < 18`, participante é marcado com `isExcluded=true`. |
| RN04 | Fluxo Obrigatório | TCLE deve ser aceito. Todas as 26 questões WHOQOL e socioeconômicas são obrigatórias. |

---

## 9. Módulos de Lógica de Negócio
- **lib/whoqol.ts** — Cálculo WHOQOL (domínios, inversões, transformação).  
- **lib/statistics.ts** — Estatística descritiva e frequências.  
- **lib/advanced-stats.ts** — Testes T/ANOVA, Pearson, Qui-Quadrado, Alfa de Cronbach.  
- **lib/db.ts** — Persistência local em IndexedDB e sincronização opcional.

---

## 10. Primeiros Passos e Coleta de Dados
Ao acessar o painel pela primeira vez, siga este fluxo para preparar sua pesquisa:

1. Vá para a aba **Configuração**.  
2. Personalize o **Nome do Projeto** e a **Instituição**.  
3. Edite o **TCLE (Termo de Consentimento)** para refletir as regras e objetivos do seu estudo.  
4. **IMPORTANTE:** Altere a senha padrão (`admin`) na seção de **Segurança**.  
5. Para coletar os dados, envie aos seus participantes o **link principal** da aplicação (o mesmo que você usou, **sem** `?admin=true`).

---

## 11. Aba de Estatísticas
**O que é?** É o centro de análise da sua pesquisa. Todos os dados dos participantes (exceto os arquivados) são transformados em gráficos e tabelas, prontos para seu relatório ou artigo.

### Filtro de Amostra
No topo da página, você pode filtrar os dados para visualizar as estatísticas de um grupo específico (ex.: “Mulher Cisgênero”, “Ensino Superior Completo”). Para voltar a ver todos, clique em **Mostrar Todos**.

### Gráficos Descritivos
- **Média dos Domínios**: pontuação média (0–100) por domínio, com faixas (Ruim/Regular/Boa/Muito Boa).  
- **Nuvem de Palavras**: profissões mais comuns (tamanho ∝ frequência).  
- **Gráficos de Pizza**: distribuições percentuais por variável socioeconômica (Gênero, Escolaridade, etc.).  
- **Exportação**: PNG, SVG ou PDF para todos os gráficos.

### Tabelas Estatísticas
- **Domínios WHOQOL**: Média, DP, Mediana, Mínimo, Máximo.  
- **Análise Cruzada**: comparação entre grupos (ex.: Físico em Solteiros vs. Casados).  
- **Frequência de Respostas**: porcentagem por opção (1–5) em cada item (26 questões).  
- **Dados Socioeconômicos**: resumo de idade e frequências das demais variáveis.

### Análises Avançadas
- **Análise de Grupos**: Teste T (2 grupos) ou ANOVA (≥3).  
- **Análise de Correlação**: Pearson entre variáveis numéricas.  
- **Análise de Regressão**: relação preditiva (ex.: Físico → Psicológico).  
- **Análise de Associação (χ²)**: relação entre variáveis categóricas (ex.: Estado civil × Faixa de renda).  
- **Análise de Confiabilidade**: Alfa de Cronbach por domínio.

---

## 12. Aba de Participantes
**O que é?** Visão detalhada de cada participante. Permite gerenciar, filtrar e exportar dados brutos.

### Filtros e Visualização
- Filtrar por **ID**, **status** (Incluído/Arquivado), **data** ou qualquer dado **socioeconômico**.  
- Botão **Colunas**: selecione quais campos exibir.  
- **Exportar**: CSV, TSV, XLS (aplica-se ao subconjunto filtrado/visível).

### Ações por Participante
- **Ver Detalhes (👁)**: abre todas as respostas e escores do indivíduo.  
- **Arquivar (🗂)**: exclui da análise sem apagar dados (reversível).  
- **Zona de Risco – Excluir Permanentemente**: apaga **definitivamente** participantes **arquivados** (irreversível).

---

## 13. Aba de Análise com IA
**O que é?** Integra a Inteligência Artificial do Google (Gemini) para analisar dados e apoiar a redação científica.

### Configuração Inicial
- Obtenha uma **Chave de API** no **Google AI Studio**.  
- Cole a chave no campo “Chave de API” e clique em **Salvar**.  
- Recomendado: **Gemini 2.5 Pro** para análises acadêmicas.

### Como Usar
- **Etapa 1 – Gerar Resultados**: a IA analisa estatísticas e redige um texto técnico.  
- **Etapa 2 – Gerar Discussão**: informe palavras‑chave (ex.: “idosos”, “saúde mental”, “qualidade de vida no trabalho”); a IA consulta a web por artigos científicos e gera a **Discussão** com **referências ABNT**.  
- **Chat Interativo**: faça perguntas do tipo “Qual a média de idade?”, “Qual domínio pior pontuou?” e obtenha respostas instantâneas.

---

## 14. Aba de Banco de Dados
**O que é?** Área de gerenciamento “bruto” dos dados. Essencial para **backup** e **testes**.

### Backup & Migração (O MAIS IMPORTANTE!)
- **Exportar Backup (JSON)**: salva **todos** os dados e configurações em um arquivo.  
- **Restaurar Backup (JSON)**: substitui os dados atuais pelos do arquivo (atenção!).  
- **Importar Planilha (CSV/XLS)**: adiciona participantes oriundos de outras fontes.

### Gerar Dados de Teste
- Crie participantes fictícios (ex.: “Idosos”, “Estudantes”) para simular cenários e testar a aplicação.

### Zona de Perigo
- **Apagar Todos os Dados**: remove **todo** o banco local. Só use com backup disponível.

---

## 15. Aba de Configuração
**O que é?** Personaliza a pesquisa e ajusta a segurança e o comportamento da IA.

- **Configurações da Pesquisa**: Nome do projeto, TCLE, contatos; pode ativar **exclusão automática** de menores de 18 e tornar **e‑mail obrigatório**.  
- **Notificações por E-mail**: envia e‑mail automático por **endpoint externo** configurável (exemplo de código exibido na UI).  
- **Segurança**: alterar senha do administrador.  
- **Gestão do Cérebro da IA**: define **Persona**, **Contexto Global** e **Parâmetros** (ex.: temperatura).

---

## 16. Aba de Logs
**O que é?** Registro de auditoria: login, mudança de senha, exclusões e demais ações críticas, com data/hora.

---

## 17. Aba de Documentação Técnica
**O que é?** Referência para desenvolvedores: arquitetura, tecnologias, requisitos de segurança e padrões de desenvolvimento. **Não é necessária** para o uso cotidiano.

---

## 18. Hospedagem e Publicação
**O que é?** O OpenWHOQOL é uma aplicação estática; pode ser hospedada em qualquer serviço que sirva HTML/CSS/JS.

### Opção 1: Desenvolvimento Local (stack React + Vite)
- **Modo desenvolvimento (HMR):**
```bash
npm run dev
```
- **Teste de build (produção):**
```bash
npm run build
npm run preview
```
- **Alternativa universal (sem Node):**
```bash
python -m http.server
```
> Observação: para SPAs com rotas client‑side, prefira `vite preview` ou:
```bash
npm install -g serve
serve -s dist
```

### Opção 2: Publicação Gratuita (Vercel, Render, Netlify, GitHub Pages)
**Exemplo – Vercel**  
1. Faça **Fork** do repositório `LaBiOmicS/OpenWHOQOL`.  
2. Conecte sua conta **GitHub** à **Vercel**.  
3. Em **Add New → Project**, importe o repositório.  
4. A Vercel detecta o **Vite** automaticamente (sem build command custom).  
5. Clique em **Deploy** e compartilhe o link público.

> Render, Netlify e GitHub Pages têm fluxo equivalente para sites estáticos.

---

## 19. Suporte Técnico
Use a aba **Suporte** no painel administrativo para abrir uma **issue** diretamente no GitHub, descrevendo bugs, melhorias ou dúvidas. Isso agiliza o atendimento e o rastreio.

---

## 20. Créditos e Licença
Desenvolvido por **LaBiOmicS - Laboratório de Bioinformática e Ciências Ômicas** — **Universidade de Mogi das Cruzes (UMC)**.  
Licença: **MIT License**.
