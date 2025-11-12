
import { GoogleGenAI, Chat } from "@google/genai";
import { AppData, ChatMessage, DomainScores } from "../types";
import { calculateOverallDomainScores } from "./whoqol";
import { calculateDescriptiveStats, calculateCategoricalFrequency } from "./statistics";
import { DOMAIN_LABELS } from "../constants";

/**
 * Formats frequency data for the prompt context.
 */
const formatFrequencyData = (appData: AppData, fieldId: string, fieldLabel: string): string => {
    const includedParticipants = appData.participants.filter(p => !p.isExcluded);
    const data = calculateCategoricalFrequency(includedParticipants, fieldId);
    if (data.length === 0) return `${fieldLabel}: Nenhum dado disponível.\n`;
    const items = data.map(d => `- ${d.category}: ${d.frequency} (${d.percentage})`).join('\n');
    return `${fieldLabel}:\n${items}\n`;
};

/**
 * Generates a statistical context string from the AppData.
 */
const getAnalysisContext = (appData: AppData): string => {
    const includedParticipants = appData.participants.filter(p => !p.isExcluded);
    if (includedParticipants.length === 0) {
        return "Não há participantes válidos para análise.";
    }

    const overallScores = calculateOverallDomainScores(includedParticipants);
    const domainScoresText = Object.entries(overallScores)
        .map(([key, value]) => {
            const val = value as number;
            const label = DOMAIN_LABELS[key] || key;
            const domainKey = key as keyof DomainScores;
            
            const stdDev = calculateDescriptiveStats(
                includedParticipants
                    .map(p => p.whoqol && calculateOverallDomainScores([p])[domainKey])
                    .filter(s => typeof s === 'number' && !isNaN(s)) as number[]
            ).stdDev;
            return `- ${label}: Média = ${val.toFixed(2).replace('.', ',')}; Desvio Padrão = ${stdDev.toFixed(2).replace('.', ',')}`;
        }).join('\n');

    const ageData = includedParticipants.map(p => p.socioeconomic?.age).filter(age => typeof age === 'number' && age > 0) as number[];
    const ageStats = calculateDescriptiveStats(ageData);
    const ageStatsText = `Média = ${ageStats.mean.toFixed(2).replace('.', ',')}, DP = ${ageStats.stdDev.toFixed(2).replace('.', ',')}, Mín = ${ageStats.min}, Máx = ${ageStats.max}`;

    return `
- Título do Projeto: ${appData.admin.config.projectName}
- N Total: ${includedParticipants.length}
- **Perfil Demográfico:**
  - Idade (N=${ageStats.n}): ${ageStatsText}
  - ${formatFrequencyData(appData, 'gender', 'Gênero')}
  - ${formatFrequencyData(appData, 'education', 'Escolaridade')}
  - ${formatFrequencyData(appData, 'maritalStatus', 'Estado Civil')}
  - ${formatFrequencyData(appData, 'income', 'Renda Familiar')}
- **Escores de Qualidade de Vida (0-100):**
  ${domainScoresText}
`;
};

/**
 * Constructs the System Instruction combining Identity, Global Context, and Learned Memory.
 */
const getSystemInstruction = (appData: AppData): string => {
    const identity = appData.admin.config.aiSystemIdentity || 'Você é um pesquisador experiente.';
    const globalContext = appData.admin.config.aiGlobalContext ? `\n\nCONTEXTO GLOBAL DO ESTUDO (Aplicável a tudo):\n${appData.admin.config.aiGlobalContext}` : '';
    const memory = appData.admin.config.aiTuningInstructions ? `\n\nMEMÓRIA DE APRENDIZADO (Feedback anterior):\n${appData.admin.config.aiTuningInstructions}` : '';
    
    return `${identity}${globalContext}${memory}`;
};

/**
 * Gets the model configuration (Temperature, TopK, TopP, etc).
 */
const getModelConfig = (appData: AppData, modelId: string, extraConfig: any = {}): any => {
    const config: any = {
        temperature: appData.admin.config.aiTemperature ?? 0.7,
        topK: appData.admin.config.aiTopK ?? 40,
        topP: appData.admin.config.aiTopP ?? 0.95,
        ...extraConfig
    };

    // Enable Thinking Config only for Pro model if selected
    if (modelId === 'gemini-2.5-pro') {
        // Use a default budget if not provided in extraConfig
        if (!config.thinkingConfig) {
             config.thinkingConfig = { thinkingBudget: 4096 };
        }
    }

    // Inject System Instruction via config
    config.systemInstruction = getSystemInstruction(appData);

    return config;
};

export const createGeneralSummaryPrompt = (appData: AppData, customInstructions?: string): string => {
    const context = getAnalysisContext(appData);
    const userCustom = customInstructions ? `\n\n**INSTRUÇÕES ESPECÍFICAS DESTA GERAÇÃO (Prioritárias):**\n${customInstructions}` : '';

    if (context.startsWith("Não há participantes")) {
        return context;
    }
    return `
        Sua tarefa é redigir uma seção de "Resultados" detalhada, ampla e técnico-científica para um artigo, baseada nos dados fornecidos.
        
        **Dados da Pesquisa:**
        ${context}
        
        **Instruções:**
        - Estruture o texto em "Caracterização da Amostra" e "Análise da Qualidade de Vida".
        - Apresente os dados em parágrafos descritivos, usando (M = XX,XX; DP = YY,YY).
        - Utilize Markdown para títulos (##), negrito (**) e listas com hífens (-).
        
        ${userCustom}

        **Estrutura Sugerida:**
        ## Resultados
        ### Caracterização da Amostra
        (Descreva o N total, o perfil sociodemográfico, a média e DP da idade, e as frequências das variáveis categóricas.)
        ### Análise da Qualidade de Vida
        (Descreva os resultados dos escores de qualidade de vida, reportando M e DP para cada domínio.
        Interprete os resultados à luz do significado de cada domínio (Físico, Psicológico, Social, Meio Ambiente).
        Compare os domínios, destacando o de maior e menor pontuação e explique o que isso significa para a amostra.)
    `;
};

export async function generateGeneralSummary(appData: AppData, apiKey: string, modelId: string, customInstructions?: string): Promise<string> {
    if (!apiKey) {
        throw new Error("A chave de API do Gemini não foi fornecida.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const includedParticipants = appData.participants.filter(p => !p.isExcluded);
    if (includedParticipants.length === 0) {
        return "## Análise Indisponível\n\nNão há participantes válidos para gerar um resumo.";
    }

    const prompt = createGeneralSummaryPrompt(appData, customInstructions);
    const config = getModelConfig(appData, modelId);

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: config
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error(`Erro na API do Gemini (${modelId}): ${error instanceof Error ? error.message : String(error)}`);
    }
}

export const createDiscussionPrompt = (resultsText: string, keywords: string, customInstructions?: string): string => {
  const userCustom = customInstructions ? `\n\n**INSTRUÇÕES ESPECÍFICAS DESTA GERAÇÃO (Prioritárias):**\n${customInstructions}` : '';
  return `
        Sua tarefa é redigir as seções "Discussão" e "Referências" usando a busca na web (Google Search).

        **Contexto:**
        1. **Resultados da Pesquisa:** \`\`\`${resultsText}\`\`\`
        2. **Palavras-chave para busca:** ${keywords}

        ${userCustom}

        **REGRA DE OURO (CRÍTICA):**
        Você **DEVE** inserir citações no corpo do texto no formato ABNT (AUTOR, Ano) para toda afirmação baseada na literatura encontrada.
        
        **Instruções para a Discussão:**
        1. Título: "## Discussão".
        2. Sintetize os principais achados dos resultados fornecidos.
        3. **Confronte** seus resultados com a literatura encontrada na busca.
        4. Discuta limitações e implicações.

        **Instruções para as Referências:**
        1. Título: "## Referências".
        2. Liste **apenas** os artigos que foram efetivamente citados no texto acima.
        3. Use o formato ABNT completo.
        4. Ordene alfabeticamente.

        **Formato de Saída OBRIGATÓRIO:**
        - Todo o texto da Discussão com as citações (AUTOR, Ano).
        - Separador em uma nova linha: '---REFERENCES---'.
        - Todo o texto das Referências.
    `;
};


export async function generateDiscussionWithSearch(appData: AppData, apiKey: string, modelId: string, resultsText: string, keywords: string, customInstructions?: string): Promise<string> {
    if (!apiKey) {
        throw new Error("A chave de API do Gemini não foi fornecida.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = createDiscussionPrompt(resultsText, keywords, customInstructions);

    try {
        const config = getModelConfig(appData, modelId, {
            tools: [{googleSearch: {}}]
        });

        // Adjust thinking budget for search/discussion if Pro model
        if (modelId === 'gemini-2.5-pro') {
             config.thinkingConfig = { thinkingBudget: 2048 }; 
        }

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: config,
        });

        let finalText = response.text;

        // Extract Grounding Metadata to display sources
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks && groundingChunks.length > 0) {
            const sourcesList = groundingChunks
                .map((chunk: any) => {
                    if (chunk.web?.uri && chunk.web?.title) {
                        return `- [${chunk.web.title}](${chunk.web.uri})`;
                    }
                    return null;
                })
                .filter(Boolean)
                .join('\n');
            
            if (sourcesList) {
                finalText += `\n\n### Fontes Consultadas (Google Search)\n${sourcesList}`;
            }
        }

        return finalText;
    } catch (error) {
        console.error("Error calling Gemini API with search:", error);
        throw new Error(`Erro na API do Gemini (${modelId}): ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function generateChatResponse(appData: AppData, apiKey: string, history: ChatMessage[], newMessage: string): Promise<string> {
    if (!apiKey) {
        throw new Error("A chave de API do Gemini não foi fornecida.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const context = getAnalysisContext(appData);
    
    // System instruction for Chat is a combination of general config + chat specific context
    const baseSystemInstruction = getSystemInstruction(appData);
    const chatSystemInstruction = `${baseSystemInstruction}
    
    **Contexto Específico dos Dados do Estudo:**
    ${context}
    
    Instrução Adicional: Seja conciso, direto e use markdown.`;
    
    // Chat uses Flash for responsiveness.
    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: chatSystemInstruction,
            temperature: appData.admin.config.aiTemperature ?? 0.7,
        },
        history: history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }],
        })),
    });

    try {
        const response = await chat.sendMessage({ message: newMessage });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for chat:", error);
        throw new Error("A comunicação com a API do Gemini falhou.");
    }
}

/**
 * Validates the API Key by making a minimal request.
 */
export async function testGeminiConnection(apiKey: string): Promise<boolean> {
    if (!apiKey) return false;
    const ai = new GoogleGenAI({ apiKey });
    try {
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Test',
        });
        return true;
    } catch (e) {
        console.error("Gemini Connection Test Failed", e);
        throw e;
    }
}
