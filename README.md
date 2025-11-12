# OpenWHOQOL

**OpenWHOQOL** é uma aplicação *Single Page Application* (SPA) desenvolvida em **React + TypeScript + Vite** para administração do instrumento **WHOQOL-BREF**, seguindo os princípios de **Local-First**, garantindo privacidade, operação offline e sincronização externa opcional. Desenvolvido pelo **Laboratório de Bioinformática e Ciências Ômicas (LaBiOmicS)** da **Universidade de Mogi das Cruzes (UMC)**.

---

## 1. Visão Geral e Escopo
O OpenWHOQOL permite a coleta, análise e interpretação de dados do WHOQOL-BREF de forma totalmente local, segura e amigável. A aplicação é destinada a pesquisadores que buscam administrar estudos de qualidade de vida, oferecendo módulos para coleta, estatística descritiva e inferencial, exportação/importação de dados, e integração com Inteligência Artificial (Google Gemini API) para apoio à escrita científica.

---

## 2. Requisitos Funcionais (RFs)

<table>
  <thead>
    <tr>
      <th align="left">ID</th>
      <th align="left">Requisito</th>
      <th align="left">Descrição</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><span style="white-space:nowrap">RF‑001</span></td>
      <td>Autenticação de Administrador</td>
      <td>Tela de login para acesso ao painel administrativo.</td>
    </tr>
    <tr>
      <td><span style="white-space:nowrap">RF‑002</span></td>
      <td>Configuração da Pesquisa</td>
      <td>Configuração de nome do projeto, TCLE e metadados.</td>
    </tr>
    <tr>
      <td><span style="white-space:nowrap">RF‑003</span></td>
      <td>Fluxo de Coleta</td>
      <td>Guiar o participante nas etapas de consentimento, formulário socioeconômico e WHOQOL-BREF.</td>
    </tr>
    <tr>
      <td><span style="white-space:nowrap">RF‑004</span></td>
      <td>Validação de Dados</td>
      <td>Garantir preenchimento completo e correto dos formulários.</td>
    </tr>
    <tr>
      <td><span style="white-space:nowrap">RF‑005</span></td>
      <td>Armazenamento Local-First</td>
      <td>Persistência de dados no IndexedDB do navegador.</td>
    </tr>
    <tr>
      <td><span style="white-space:nowrap">RF‑006</span></td>
      <td>Visualização de Dados</td>
      <td>Visualização de participantes e dados individuais em tabela paginada e filtrável.</td>
    </tr>
    <tr>
      <td><span style="white-space:nowrap">RF‑007</span></td>
      <td>Gerenciamento de Participantes</td>
      <td>Arquivamento e exclusão permanente de participantes.</td>
    </tr>
    <tr>
      <td><span style="white-space:nowrap">RF‑008</span></td>
      <td>Análise Estatística Descritiva</td>
      <td>Cálculo automático de médias, desvios, frequências e geração de gráficos.</td>
    </tr>
    <tr>
      <td><span style="white-space:nowrap">RF‑009</span></td>
      <td>Análise Estatística Inferencial</td>
      <td>Execução de Teste T, ANOVA, Correlação, Qui-Quadrado e Confiabilidade.</td>
    </tr>
    <tr>
      <td><span style="white-space:nowrap">RF‑010</span></td>
      <td>Análise com IA</td>
      <td>Integração com Google Gemini para geração de Resultados, Discussão e análise via chat.</td>
    </tr>
    <tr>
      <td><span style="white-space:nowrap">RF‑011</span></td>
      <td>Exportação de Dados</td>
      <td>Exportar dados em CSV, TSV, XLS e JSON.</td>
    </tr>
    <tr>
      <td><span style="white-space:nowrap">RF‑012</span></td>
      <td>Importação de Dados</td>
      <td>Importar dados via JSON, CSV ou XLS.</td>
    </tr>
    <tr>
      <td><span style="white-space:nowrap">RF‑013</span></td>
      <td>Geração de Dados de Teste</td>
      <td>Gerar dados fictícios para teste e demonstração.</td>
    </tr>
    <tr>
      <td><span style="white-space:nowrap">RF‑014</span></td>
      <td>Auditoria (Logs)</td>
      <td>Registro de todas as ações administrativas críticas.</td>
    </tr>
    <tr>
      <td><span style="white-space:nowrap">RF‑015</span></td>
      <td>Notificação por E-mail</td>
      <td>Envio de e-mail ao administrador via API externa configurável.</td>
    </tr>
  </tbody>
</table>

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
