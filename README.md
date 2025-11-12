# OpenWHOQOL

**OpenWHOQOL** é uma aplicação *Single Page Application* (SPA) desenvolvida para administração do instrumento **WHOQOL-BREF**, seguindo os princípios de **Local-First**, garantindo privacidade, operação offline e sincronização externa opcional. Desenvolvido pelo **Laboratório de Bioinformática e Ciências Ômicas (LaBiOmicS)** da **Universidade de Mogi das Cruzes (UMC)**.

---

## 1. Visão Geral e Escopo
O OpenWHOQOL permite a coleta, análise e interpretação de dados do WHOQOL-BREF de forma totalmente local, segura e amigável. A aplicação é destinada a pesquisadores que buscam administrar estudos de qualidade de vida, oferecendo módulos para coleta, estatística descritiva e inferencial, exportação/importação de dados, e integração com Inteligência Artificial (Google Gemini API) para apoio à escrita científica.

---

## 2. Requisitos Funcionais (RFs)

| ID | Requisito | Descrição |
|--------|------------|------------|
| RF-001 | Autenticação de Administrador | Tela de login para acesso ao painel administrativo. |
| RF-002 | Configuração da Pesquisa | Configuração de nome do projeto, TCLE e metadados. |
| RF-003 | Fluxo de Coleta | Guiar o participante nas etapas de consentimento, formulário socioeconômico e WHOQOL-BREF. |
| RF-004 | Validação de Dados | Garantir preenchimento completo e correto dos formulários. |
| RF-005 | Armazenamento Local-First | Persistência de dados no IndexedDB do navegador. |
| RF-006 | Visualização de Dados | Visualização de participantes e dados individuais em tabela paginada e filtrável. |
| RF-007 | Gerenciamento de Participantes | Arquivamento e exclusão permanente de participantes. |
| RF-008 | Análise Estatística Descritiva | Cálculo automático de médias, desvios, frequências e geração de gráficos. |
| RF-009 | Análise Estatística Inferencial | Execução de Teste T, ANOVA, Correlação, Qui-Quadrado e Confiabilidade. |
| RF-010 | Análise com IA | Integração com Google Gemini para geração de Resultados, Discussão e análise via chat. |
| RF-011 | Exportação de Dados | Exportar dados em CSV, TSV, XLS e JSON. |
| RF-012 | Importação de Dados | Importar dados via JSON, CSV ou XLS. |
| RF-013 | Geração de Dados de Teste | Gerar dados fictícios para teste e demonstração. |
| RF-014 | Auditoria (Logs) | Registro de todas as ações administrativas críticas. |
| RF-015 | Notificação por E-mail | Envio de e-mail ao administrador via API externa configurável. |

---

## 3. Requisitos Não Funcionais (RNFs)

| ID | Categoria | Requisito | Descrição |
|----|------------|------------|------------|
| RNF-01 | Usabilidade | Interface Responsiva | Funcional em desktops, tablets e smartphones. |
| RNF-02 | Usabilidade | Intuitividade | Fluxo de navegação claro e autoexplicativo. |
| RNF-03 | Desempenho | Carregamento Rápido | Tempo de carregamento < 3s em conexão 3G. |
| RNF-04 | Desempenho | Responsividade | Interações suaves mesmo com milhares de registros. |
| RNF-05 | Confiabilidade | Operação Offline | Funcionalidades principais operam sem internet. |
| RNF-06 | Portabilidade | Compatibilidade | Suporte aos principais navegadores (Chrome, Firefox, Safari, Edge). |
| RNF-07 | Manutenibilidade | Código Modular | Separação entre lógica de negócio e UI. |

---

## 4. Requisitos de Dados e LGPD
A aplicação adota o paradigma **Privacy by Design** e cumpre a **Lei nº 13.709/2018 (LGPD)**.

| Dado | Classificação | Obrigatório | Finalidade | Base Legal |
|-------|----------------|--------------|-------------|-------------|
| E-mail | Pessoal | Condicional | Contato e correlação de estudos | Consentimento |
| Respostas WHOQOL | Sensível (Saúde) | Sim | Cálculo de escores | Pesquisa/Interesse legítimo |
| Idade | Demográfico | Sim | Estatísticas e correlações | Pesquisa |
| Gênero | Sensível | Sim | Análise comparativa | Pesquisa |
| Escolaridade/Renda | Demográfico | Sim | Perfil socioeconômico | Pesquisa |
| Logs de Sistema | Segurança | Automático | Auditoria e rastreabilidade | Obrigação legal |

---

## 5. Requisitos de Segurança (RSs)

| ID | Requisito | Implementação |
|----|------------|----------------|
| RS-01 | Autenticação Robusta | Política de senha forte, credenciais locais seguras. |
| RS-02 | Controle de Acesso | Separação entre visões de participante e admin. |
| RS-03 | Dados em Repouso | IndexedDB protegido por *Same-Origin Policy*. |
| RS-04 | Dados em Trânsito | Sincronização via HTTPS com autenticação por `x-api-key`. |
| RS-05 | Prevenção de Ataques | Validação de entrada e uso de React mitigam XSS. |
| RS-06 | Trilha de Auditoria | Logs com data/hora de ações críticas. |
| RS-07 | Segredos de Servidor | Credenciais gerenciadas somente no backend seguro. |

---

## 6. Arquitetura e Stack Tecnológica
**Core:** React ^19.2.0 · TypeScript 5.x  
**Funcionalidades:** @google/genai ^1.29.0 · Recharts ^3.3.0 · XLSX (SheetJS) ^0.18.5  
**UI e Utilitários:** Lucide React ^0.552.0 · TailwindCSS 3.4 (CDN)

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

## 7. Regras de Negócio (RNs)

| ID | Regra | Descrição |
|----|--------|------------|
| RN01 | Cálculo WHOQOL | Inversão de Q3, Q4, Q26. Transformação: ((média - 1) * 25). |
| RN02 | Dados Ausentes | >20% nulos → domínio = NaN. |
| RN03 | Menores de Idade | enforceAgeRestriction=true → isExcluded=true se idade<18. |
| RN04 | Fluxo Obrigatório | TCLE e 26 questões obrigatórias. |

---

## 8. Principais Abas do Sistema

### **Configuração**
Definição de nome do projeto, TCLE, contatos, restrições de idade, e e-mail opcional. Alterar senha padrão imediatamente.

### **Participantes**
Gestão e filtragem dos participantes, exportação CSV/XLS, arquivamento e exclusão permanente.

### **Estatísticas**
Análises descritivas e inferenciais com gráficos (barras, pizza, nuvem de palavras). Exportação em PNG/SVG/PDF.

### **IA (Google Gemini)**
Geração automática das seções *Resultados* e *Discussão*, busca de artigos e referências ABNT.

### **Banco de Dados**
Backup, restauração, importação, e geração de dados fictícios.

### **Logs**
Auditoria completa de ações administrativas.

---

## 9. Hospedagem e Publicação

### **Local (Desenvolvimento)**
```bash
python -m http.server
# ou use o Live Server no VS Code
```
Acesse [http://localhost:8000](http://localhost:8000)

### **Publicação (Produção)**
Recomendada via **Vercel**, **Render**, **Netlify** ou **GitHub Pages**.  

#### Exemplo (Vercel):
1. Faça fork do repositório `LaBiOmicS/OpenWHOQOL`.
2. Conecte sua conta GitHub à Vercel.
3. Importe o projeto e clique em **Deploy**.
4. Seu link público será gerado automaticamente.

---

## 10. Suporte Técnico
Abra uma *issue* no GitHub via aba **Suporte** no painel administrativo.  
Isso gera um ticket automaticamente para a equipe de desenvolvimento.

---

## 11. Sobre o WHOQOL-BREF
Instrumento abreviado desenvolvido pela OMS, composto por 26 questões em quatro domínios: **Físico**, **Psicológico**, **Relações Sociais** e **Meio Ambiente**.

**Referência:**  
Fleck, M. P. A., Louzada, S., Xavier, M., Chachamovich, E., Vieira, G., Santos, L., & Pinzon, V. (2000). *Aplicação da versão em português do instrumento abreviado de avaliação da qualidade de vida WHOQOL-bref*. Revista de Saúde Pública, 34(2), 178–183.

---

## 12. Privacidade e LGPD
A aplicação segue integralmente os princípios da **LGPD**. Os dados são armazenados localmente e usados exclusivamente para fins científicos, sem qualquer compartilhamento externo não autorizado.

---

## 13. Créditos e Licença
Desenvolvido por **LaBiOmicS - Laboratório de Bioinformática e Ciências Ômicas**  
**Universidade de Mogi das Cruzes (UMC)**  
Licença: **MIT License**
