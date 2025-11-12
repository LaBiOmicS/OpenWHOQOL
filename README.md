# OpenWHOQOL

**OpenWHOQOL** é uma aplicação *Single Page Application* (SPA) desenvolvida em **React + TypeScript + Vite** para administração do instrumento **WHOQOL-BREF**, seguindo os princípios de **Local-First**, garantindo privacidade, operação offline e sincronização externa opcional. Desenvolvido pelo **Laboratório de Bioinformática e Ciências Ômicas (LaBiOmicS)** da **Universidade de Mogi das Cruzes (UMC)**.

---

## 1. Visão Geral e Escopo
O OpenWHOQOL permite a coleta, análise e interpretação de dados do WHOQOL-BREF de forma totalmente local, segura e amigável. A aplicação é destinada a pesquisadores que buscam administrar estudos de qualidade de vida, oferecendo módulos para coleta, estatística descritiva e inferencial, exportação/importação de dados, e integração com Inteligência Artificial (Google Gemini API) para apoio à escrita científica.

---

## 2. Requisitos Funcionais (RFs)

| **ID**   | **Requisito**                   | **Descrição** |
|----------|----------------------------------|----------------|
| **RF-001** | Autenticação de Administrador | Tela de login para acesso ao painel administrativo. |
| **RF-002** | Configuração da Pesquisa | Configuração de nome do projeto, TCLE e metadados. |
| **RF-003** | Fluxo de Coleta | Guiar o participante nas etapas de consentimento, formulário socioeconômico e WHOQOL-BREF. |
| **RF-004** | Validação de Dados | Garantir preenchimento completo e correto dos formulários. |
| **RF-005** | Armazenamento Local-First | Persistência de dados no IndexedDB do navegador. |
| **RF-006** | Visualização de Dados | Visualização de participantes e dados individuais em tabela paginada e filtrável. |
| **RF-007** | Gerenciamento de Participantes | Arquivamento e exclusão permanente de participantes. |
| **RF-008** | Análise Estatística Descritiva | Cálculo automático de médias, desvios, frequências e geração de gráficos. |
| **RF-009** | Análise Estatística Inferencial | Execução de Teste T, ANOVA, Correlação, Qui-Quadrado e Confiabilidade. |
| **RF-010** | Análise com IA | Integração com Google Gemini para geração de Resultados, Discussão e análise via chat. |
| **RF-011** | Exportação de Dados | Exportar dados em CSV, TSV, XLS e JSON. |
| **RF-012** | Importação de Dados | Importar dados via JSON, CSV ou XLS. |
| **RF-013** | Geração de Dados de Teste | Gerar dados fictícios para teste e demonstração. |
| **RF-014** | Auditoria (Logs) | Registro de todas as ações administrativas críticas. |
| **RF-015** | Notificação por E-mail | Envio de e-mail ao administrador via API externa configurável. |

---

## 3. Requisitos Não Funcionais (RNFs)

| **ID** | **Categoria** | **Requisito** | **Descrição** |
|--------|----------------|----------------|----------------|
| **RNF-01** | Usabilidade | Interface Responsiva | Funcional em desktops, tablets e smartphones. |
| **RNF-02** | Usabilidade | Intuitividade | Fluxo de navegação claro e autoexplicativo. |
| **RNF-03** | Desempenho | Carregamento Rápido | Tempo de carregamento < 3s em conexão 3G. |
| **RNF-04** | Desempenho | Responsividade | Interações suaves mesmo com milhares de registros. |
| **RNF-05** | Confiabilidade | Operação Offline | Funcionalidades principais operam sem internet. |
| **RNF-06** | Portabilidade | Compatibilidade | Suporte aos principais navegadores (Chrome, Firefox, Safari, Edge). |
| **RNF-07** | Manutenibilidade | Código Modular | Separação entre lógica de negócio e UI. |

---

## 9. Hospedagem e Publicação

### **1. Desenvolvimento Local (Stack React + Vite)**
O OpenWHOQOL é uma SPA construída com **React + TypeScript + Vite**. O ambiente de desenvolvimento utiliza o servidor embutido do Vite para simular o comportamento de produção.

#### ▶️ Desenvolvimento ativo (Hot Reload)
```bash
npm run dev
```
Abre a aplicação com recarregamento automático (HMR) em `http://localhost:5173`.

#### ▶️ Teste de build local (modo produção)
```bash
npm run build
npm run preview
```
O comando `vite preview` serve a pasta `dist/` com um servidor local idêntico ao ambiente de produção.

#### ▶️ Alternativa universal (sem Node.js)
Caso o Node.js não esteja disponível (ex: teste rápido em laboratório ou apresentação), é possível usar o servidor HTTP do Python:
```bash
python -m http.server
```
Este comando apenas serve os arquivos HTML/CSS/JS, permitindo visualizar o site localmente, mas **não é recomendado para testes avançados** (como rotas SPA ou service workers).

#### 💡 Observação sobre SPAs e rotas
SPAs usam roteamento client-side (ex: `/admin`, `/stats`). Para evitar erros de 404 ao recarregar páginas, use `vite preview` ou o pacote:
```bash
npm install -g serve
serve -s dist
```
O parâmetro `-s` garante redirecionamento automático para `index.html`.

---

### **2. Publicação em Produção**
O OpenWHOQOL é uma aplicação **estática**, podendo ser hospedada em qualquer serviço que sirva HTML/CSS/JS (Vercel, Netlify, Render, GitHub Pages, etc.).

#### Exemplo (Vercel)
1. Faça fork do repositório `LaBiOmicS/OpenWHOQOL`.
2. Conecte sua conta GitHub à Vercel.
3. Importe o projeto e clique em **Deploy**.
4. A Vercel detecta automaticamente o framework Vite.
5. Seu link público será gerado instantaneamente.

#### Outras opções
- **Netlify** → build automático com `npm run build`.
- **Render** → deploy contínuo gratuito.
- **GitHub Pages** → hospedagem estática a partir da pasta `/dist`.

---

### **Notas Técnicas Adicionais**
| Cenário | Comando | Finalidade |
|----------|----------|-------------|
| Desenvolvimento dinâmico | `npm run dev` | Hot Reload (modo dev) |
| Teste local de produção | `npm run build && npm run preview` | Simula deploy |
| Deploy estático | — | Hospedagem automática via Vercel/Netlify |
| Teste rápido (sem Node) | `python -m http.server` | Fallback simples |

> **Recomendação oficial:** para o stack React + Vite, utilize preferencialmente `vite preview` ou `serve -s dist` para testes e deploys locais confiáveis.

---

## 13. Créditos e Licença
Desenvolvido por **LaBiOmicS - Laboratório de Bioinformática e Ciências Ômicas**  
**Universidade de Mogi das Cruzes (UMC)**  
Licença: **MIT License**
