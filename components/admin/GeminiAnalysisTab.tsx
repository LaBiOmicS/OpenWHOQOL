
import React, { useState, useRef, useEffect } from 'react';
import { AppData, ChatMessage, AdminConfig } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Sparkles, Clipboard, AlertTriangle, CheckCircle, Search, FileQuestion, Send, FileDown, FileType, MessageSquare, ThumbsUp, ThumbsDown, Save, BrainCircuit, Globe, Settings, Key, Zap } from 'lucide-react';
import { 
  generateGeneralSummary, 
  generateDiscussionWithSearch, 
  createGeneralSummaryPrompt,
  createDiscussionPrompt,
  generateChatResponse,
  testGeminiConnection
} from '../../lib/gemini';
import { Input } from '../ui/Input';
import { createLogEntry } from '../../lib/logger';
import { Modal } from '../ui/Modal';
import jsPDF from 'jspdf';

interface GeminiAnalysisTabProps {
  appData: AppData;
  setAppData: (data: AppData) => Promise<void>;
}

// --- Componente de Feedback Interno ---
interface FeedbackSectionProps {
  context: 'results' | 'discussion';
  onSave: (rating: 'good' | 'bad', refStatus: string, comment: string) => void;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ context, onSave }) => {
  const [rating, setRating] = useState<'good' | 'bad' | null>(null);
  const [refStatus, setRefStatus] = useState<string>('valid');
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (rating) {
      onSave(rating, refStatus, comment);
      setSaved(true);
    }
  };

  if (saved) {
    return (
      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md text-sm text-center">
        Obrigado! Seu feedback foi registrado e ajudará a melhorar as próximas gerações.
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold mb-3">Avalie esta geração para melhorar a IA:</h4>
      
      <div className="flex gap-4 mb-4">
        <button 
          onClick={() => setRating('good')}
          className={`flex flex-row items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${rating === 'good' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'}`}
        >
          <ThumbsUp size={16} /> Útil / Bom
        </button>
        <button 
          onClick={() => setRating('bad')}
          className={`flex flex-row items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${rating === 'bad' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'}`}
        >
          <ThumbsDown size={16} /> Ruim / Precisa Melhorar
        </button>
      </div>

      {context === 'discussion' && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Validação de Referências:</label>
          <select 
            value={refStatus} 
            onChange={(e) => setRefStatus(e.target.value)}
            className="w-full text-sm px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="valid">As referências parecem corretas/reais</option>
            <option value="hallucinated">Contém referências fictícias (alucinação)</option>
            <option value="format_error">Formatação incorreta (não ABNT)</option>
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Como a IA pode melhorar? (Opcional)</label>
        <textarea 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full text-sm px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 h-16"
          placeholder="Ex: Seja menos repetitivo, use linguagem mais acadêmica..."
        />
      </div>

      <Button onClick={handleSave} size="sm" disabled={!rating}>
        <Save size={14}/> Salvar Feedback
      </Button>
    </div>
  );
};

// --- Main Component ---

const renderMarkdown = (text: string) => {
  const blocks = text.split(/\n\s*\n/);
  
  return blocks.map((block, index) => {
    block = block.trim();
    if (!block) return null;

    if (block.startsWith('## ')) {
      return <h2 key={index} className="text-xl font-semibold mt-6 mb-2">{block.substring(3)}</h2>;
    }
    if (block.startsWith('### ')) {
      return <h3 key={index} className="text-lg font-semibold mt-4 mb-1">{block.substring(4)}</h3>;
    }
    if (block.match(/^- /)) {
      const items = block.split('\n').map((item, i) => {
        // Parse links [Title](url)
        let content = item.replace(/^- /, '')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Replace markdown links with anchor tags
        content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>');
        
        return <li key={i} dangerouslySetInnerHTML={{ __html: content }} />;
      });
      return <ul key={index} className="list-disc list-inside space-y-1 my-2">{items}</ul>;
    }
    
    let formattedBlock = block
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
      
    // Replace markdown links in paragraphs
    formattedBlock = formattedBlock.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>');
    
    return <p key={index} dangerouslySetInnerHTML={{ __html: formattedBlock }} />;
  }).filter(Boolean);
};


const GeminiAnalysisTab: React.FC<GeminiAnalysisTabProps> = ({ appData, setAppData }) => {
  // Gestão de Chave de API
  const envKey = process.env.API_KEY;
  const storedKey = appData.admin.config.geminiApiKey || '';
  const activeKey = envKey || storedKey;
  const [manualKeyInput, setManualKeyInput] = useState(storedKey);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);

  // Gestão de Modelo
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');

  // Estados de Geração e Interface
  const [isGeneratingResults, setIsGeneratingResults] = useState(false);
  const [resultsText, setResultsText] = useState('');
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [customResultsInst, setCustomResultsInst] = useState('');

  const [keywords, setKeywords] = useState<string[]>(Array(5).fill(''));
  const [isGeneratingDiscussion, setIsGeneratingDiscussion] = useState(false);
  const [discussionText, setDiscussionText] = useState('');
  const [referencesText, setReferencesText] = useState('');
  const [discussionError, setDiscussionError] = useState<string | null>(null);
  const [customDiscussionInst, setCustomDiscussionInst] = useState('');

  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptModalContent, setPromptModalContent] = useState({ title: '', content: '' });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isChatting]);

  // --- Handlers ---

  const handleSaveKey = async () => {
      const updatedConfig = { ...appData.admin.config, geminiApiKey: manualKeyInput };
      const action = manualKeyInput ? 'GEMINI_KEY_UPDATED' : 'GEMINI_KEY_REMOVED';
      const currentData = createLogEntry(appData, action, 'Chave de API atualizada manualmente.');
      await setAppData({
          ...currentData,
          admin: { ...currentData.admin, config: updatedConfig }
      });
      alert(manualKeyInput ? 'Chave de API salva com sucesso!' : 'Chave de API removida.');
  };

  const handleTestKey = async () => {
      const keyToTest = manualKeyInput || envKey;
      if (!keyToTest) {
          alert("Por favor, insira uma chave de API para testar.");
          return;
      }
      setIsTestingKey(true);
      try {
          await testGeminiConnection(keyToTest);
          alert("Conexão bem-sucedida! A chave é válida e a API está respondendo.");
      } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          alert(`Falha na conexão com o Gemini: ${errorMsg}`);
      } finally {
          setIsTestingKey(false);
      }
  };

  const handleRunResults = async () => {
    if (!activeKey) return;

    setIsGeneratingResults(true);
    setResultsError(null);
    setResultsText('');
    setDiscussionText('');
    setReferencesText('');
    setDiscussionError(null);

    try {
      const resultText = await generateGeneralSummary(appData, activeKey, selectedModel, customResultsInst);
      setResultsText(resultText);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setResultsError(`Ocorreu um erro ao gerar os resultados: ${errorMessage}.`);
    } finally {
      setIsGeneratingResults(false);
    }
  };

  const handleRunDiscussion = async () => {
    const trimmedKeywords = keywords.filter(k => k.trim());
    if (!resultsText || trimmedKeywords.length === 0) return;

    setIsGeneratingDiscussion(true);
    setDiscussionError(null);
    setDiscussionText('');
    setReferencesText('');

    try {
      const keywordsString = trimmedKeywords.join(', ');
      const fullResponse = await generateDiscussionWithSearch(appData, activeKey, selectedModel, resultsText, keywordsString, customDiscussionInst);
      const separator = '---REFERENCES---';
      const separatorIndex = fullResponse.indexOf(separator);

      if (separatorIndex !== -1) {
        setDiscussionText(fullResponse.substring(0, separatorIndex).trim());
        setReferencesText(fullResponse.substring(separatorIndex + separator.length).trim());
      } else {
        setDiscussionText(fullResponse);
        setReferencesText("");
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setDiscussionError(`Ocorreu um erro ao gerar a discussão: ${errorMessage}.`);
    } finally {
      setIsGeneratingDiscussion(false);
    }
  };

  const handleFeedback = async (context: 'results' | 'discussion', rating: 'good' | 'bad', refStatus: string, comment: string) => {
      const feedbackDetails = { context, rating, refStatus, comment };
      let currentData = createLogEntry(appData, 'AI_FEEDBACK_RECEIVED', feedbackDetails);
      
      let newInstructions = currentData.admin.config.aiTuningInstructions || '';
      let instructionAdded = false;

      if (refStatus === 'hallucinated') {
          newInstructions += "\n- ATENÇÃO CRÍTICA: O usuário reportou referências fictícias anteriormente. VERIFIQUE RIGOROSAMENTE a existência de cada citação. Se não encontrar a fonte, NÃO a invente.";
          instructionAdded = true;
      } else if (refStatus === 'format_error') {
          newInstructions += "\n- O usuário reportou erros de formatação nas referências. Siga ESTRITAMENTE as normas da ABNT.";
          instructionAdded = true;
      }

      if (rating === 'bad' && comment.trim()) {
           newInstructions += `\n- Feedback do usuário para melhorar: "${comment.trim()}".`;
           instructionAdded = true;
      }

      if (instructionAdded) {
          const updatedConfig = { ...currentData.admin.config, aiTuningInstructions: newInstructions };
          currentData = {
              ...currentData,
              admin: { ...currentData.admin, config: updatedConfig }
          };
      }

      await setAppData(currentData);
  };


  const handleCopyToClipboard = (textToCopy: string, section: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };
  
  const handleShowPrompt = (type: 'results' | 'discussion') => {
    if (type === 'results') {
        setPromptModalContent({
            title: 'Prompt para "Resultados"',
            content: createGeneralSummaryPrompt(appData, customResultsInst),
        });
    } else {
        const trimmedKeywords = keywords.filter(k => k.trim()).join(', ');
        setPromptModalContent({
            title: 'Prompt para "Discussão"',
            content: createDiscussionPrompt(resultsText, trimmedKeywords || "[Suas palavras-chave aqui]", customDiscussionInst),
        });
    }
    setIsPromptModalOpen(true);
  };

  const handleSendMessage = async () => {
    const message = userMessage.trim();
    if (!message || isChatting || !activeKey) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: message }];
    setChatHistory(newHistory);
    setUserMessage('');
    setIsChatting(true);

    try {
        const responseText = await generateChatResponse(appData, activeKey, newHistory, message);
        setChatHistory([...newHistory, { role: 'model', text: responseText }]);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setChatHistory([...newHistory, { role: 'model', text: `**Erro:** ${errorMessage}` }]);
    } finally {
        setIsChatting(false);
    }
  };

  const handleClearChat = () => {
    setChatHistory([]);
  };

  const handleExportDoc = (content: string, filename: string) => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
        "xmlns:w='urn:schemas-microsoft-com:office:word' " +
        "xmlns='http://www.w3.org/TR/REC-html40'>" +
        "<head><meta charset='utf-8'><title>Export</title></head><body>";
    const footer = "</body></html>";
    let htmlContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
        .replace(/<\/ul>\s*<ul>/g, '')
        .replace(/\n\s*\n/g, '<p>')
        .replace(/\n/g, '<br/>');

    const sourceHTML = header + `<div>${htmlContent}</div>` + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${filename}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const handleExportPdf = (content: string, filename: string) => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const textWidth = pageWidth - margin * 2;
    let y = margin;

    const lines = content.split('\n');

    lines.forEach(line => {
        if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
        
        let processedLine = line.trim();
        let fontSize = 12;
        let fontStyle = 'normal';

        if (processedLine.startsWith('## ')) {
            fontStyle = 'bold';
            fontSize = 16;
            processedLine = processedLine.substring(3);
        } else if (processedLine.startsWith('### ')) {
            fontStyle = 'bold';
            fontSize = 14;
            processedLine = processedLine.substring(4);
        } else if (processedLine.startsWith('- ')) {
            processedLine = `• ${processedLine.substring(2)}`;
        }
        
        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(fontSize);

        const splitText = doc.splitTextToSize(processedLine, textWidth);
        doc.text(splitText, margin, y);
        y += (splitText.length * 7) + 3;
    });

    doc.save(`${filename}.pdf`);
  };


  const renderSettings = () => {
    return (
        <Card className="mb-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Configuração de Conexão e Modelo</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gerenciamento da Chave */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Chave de API (Google Gemini)
                    </label>
                    {envKey && (
                        <div className="flex items-center gap-2 p-2 mb-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded text-green-800 dark:text-green-200 text-sm">
                            <CheckCircle size={16} />
                            <span>Variável de Ambiente Detectada</span>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                type={isKeyVisible ? "text" : "password"}
                                value={manualKeyInput}
                                onChange={(e) => setManualKeyInput(e.target.value)}
                                placeholder={envKey ? "Chave pessoal (sobrescreve a variável de ambiente)" : "Cole sua API Key aqui..."}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setIsKeyVisible(!isKeyVisible)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <Key size={16} />
                            </button>
                        </div>
                        <Button onClick={handleSaveKey} size="sm" variant="secondary">Salvar</Button>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                            Obtenha em <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.
                        </p>
                        <Button 
                            onClick={handleTestKey} 
                            size="sm" 
                            variant="secondary" 
                            disabled={isTestingKey || (!manualKeyInput && !envKey)}
                            className="text-xs h-8"
                        >
                            {isTestingKey ? 'Testando...' : 'Testar Chave'}
                        </Button>
                    </div>
                </div>

                {/* Seleção de Modelo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Modelo de Inteligência Artificial
                    </label>
                    <div className="space-y-2">
                        <label className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${selectedModel === 'gemini-2.5-flash' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-500' : 'bg-white dark:bg-gray-700 hover:border-gray-400'}`}>
                            <input
                                type="radio"
                                name="model"
                                value="gemini-2.5-flash"
                                checked={selectedModel === 'gemini-2.5-flash'}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="mt-1 h-4 w-4 text-blue-600"
                            />
                            <div>
                                <span className="block text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                    Gemini 2.5 Flash (Padrão) <Zap size={12} className="text-yellow-500" fill="currentColor" />
                                </span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">Modelo rápido e eficiente (low-latency). Ideal para resumos gerais e tarefas ágeis.</span>
                            </div>
                        </label>

                        <label className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${selectedModel === 'gemini-2.5-pro' ? 'bg-purple-50 border-purple-500 dark:bg-purple-900/20 dark:border-purple-500' : 'bg-white dark:bg-gray-700 hover:border-gray-400'}`}>
                            <input
                                type="radio"
                                name="model"
                                value="gemini-2.5-pro"
                                checked={selectedModel === 'gemini-2.5-pro'}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="mt-1 h-4 w-4 text-purple-600"
                            />
                            <div>
                                <span className="block text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                    Gemini 2.5 Pro (Reasoning Model) <BrainCircuit size={12} className="text-purple-500"/>
                                </span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">Modelo avançado com capacidade de raciocínio profundo (Thinking). Melhor para análises complexas e discussão acadêmica. Pode ser mais lento.</span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </Card>
    );
  };

  const renderAnalysisInterface = () => (
    <div className="space-y-6">
      <Card>
        <div className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold">Etapa 1: Gerar Resultados</h2>
                 <button onClick={() => handleShowPrompt('results')} className="text-gray-400 hover:text-blue-600" title="Ver prompt"><FileQuestion size={18} /></button>
            </div>
            <div className="flex items-center justify-center gap-2 mb-6 text-gray-600 dark:text-gray-400 text-sm font-medium">
                {selectedModel === 'gemini-2.5-pro' ? (
                     <><BrainCircuit size={16} className="text-purple-600"/> <span>Modo Raciocínio Profundo Ativo</span></>
                ) : (
                     <><Sparkles size={16} className="text-blue-600"/> <span>Modo Padrão (Flash)</span></>
                )}
            </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
            A IA analisará estatisticamente seus dados e gerará uma seção de "Resultados" detalhada no formato de artigo científico.
            <br/><span className="text-xs mt-1 italic">As regras de comportamento (Identidade, Contexto, etc.) configuradas na aba <strong>Configuração</strong> serão aplicadas.</span>
          </p>
          
          <div className="max-w-xl mx-auto mb-6 text-left">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instruções Adicionais (Opcional)
            </label>
            <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white text-sm"
                rows={2}
                placeholder="Ex: Foque a análise nas diferenças entre gêneros; Seja mais conciso na descrição da amostra..."
                value={customResultsInst}
                onChange={(e) => setCustomResultsInst(e.target.value)}
            />
          </div>

          <Button
            onClick={handleRunResults}
            disabled={isGeneratingResults || isGeneratingDiscussion}
            className="px-8 py-3 text-base flex items-center justify-center gap-2"
          >
            {isGeneratingResults ? 'Pensando e Gerando...' : <><Sparkles size={18} /> Gerar Resultados</>}
          </Button>
        </div>
      </Card>

      {isGeneratingResults && (
        <Card className="text-center py-8">
            <div className="flex flex-col items-center">
                <Sparkles className="animate-pulse h-8 w-8 text-blue-500 mb-2" />
                <p>A IA está analisando os dados...</p>
                {selectedModel === 'gemini-2.5-pro' && <p className="text-xs text-purple-600 mt-1">Usando Thinking Budget...</p>}
            </div>
        </Card>
      )}
      {resultsError && (
        <Card className="border-red-500 border"><p className="text-red-600">{resultsError}</p></Card>
      )}

      {resultsText && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Resultados Gerados</h2>
            <div className="flex items-center gap-1">
              <Button onClick={() => handleExportDoc(resultsText, 'resultados')} variant="secondary" size="sm" title="Exportar para .doc"><FileDown size={14} className="mr-1"/>DOC</Button>
              <Button onClick={() => handleExportPdf(resultsText, 'resultados')} variant="secondary" size="sm" title="Exportar para .pdf"><FileType size={14} className="mr-1"/>PDF</Button>
              <Button onClick={() => handleCopyToClipboard(resultsText, 'results')} variant="secondary" size="sm">
                <Clipboard size={14} className="mr-2" />
                {copiedSection === 'results' ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md max-h-96 overflow-y-auto">
            {renderMarkdown(resultsText)}
          </div>
          <FeedbackSection 
             context="results" 
             onSave={(rating, refStatus, comment) => handleFeedback('results', rating, refStatus, comment)}
          />
        </Card>
      )}

      {resultsText && (
        <Card>
            <div className="text-center">
              <div className="flex justify-center items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold">Etapa 2: Gerar Discussão</h2>
                 <button onClick={() => handleShowPrompt('discussion')} className="text-gray-400 hover:text-blue-600" title="Ver prompt"><FileQuestion size={18} /></button>
              </div>
              <div className="flex items-center justify-center gap-2 mb-6 text-blue-600 dark:text-blue-400 text-sm font-medium">
                <Globe size={16} />
                <span>Google Search Grounding Ativo</span>
            </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-3xl mx-auto">
                Forneça até 5 palavras-chave. A IA usará os resultados e a <strong>Busca do Google</strong> para encontrar literatura real, gerar a "Discussão" e listar as referências consultadas.
              </p>
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {keywords.map((kw, index) => (
                    <Input
                      key={index}
                      type="text"
                      value={kw}
                      onChange={(e) => handleKeywordChange(index, e.target.value)}
                      placeholder={`Palavra-chave ${index + 1}`}
                      disabled={isGeneratingDiscussion}
                    />
                  ))}
                </div>
                
                <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Instruções Adicionais (Opcional)
                    </label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white text-sm"
                        rows={2}
                        placeholder="Ex: Utilize autores clássicos da área; Discuta as limitações do estudo..."
                        value={customDiscussionInst}
                        onChange={(e) => setCustomDiscussionInst(e.target.value)}
                    />
                </div>

                <Button
                  onClick={handleRunDiscussion}
                  disabled={isGeneratingDiscussion || isGeneratingResults || !keywords.some(k => k.trim())}
                  className="px-8 py-3 text-base flex items-center justify-center gap-2"
                >
                  {isGeneratingDiscussion ? 'Pesquisando na Web...' : <><Search size={18} /> Gerar Discussão</>}
                </Button>
              </div>
            </div>
          </Card>
      )}

      {isGeneratingDiscussion && (
        <Card className="text-center py-8">
             <div className="flex flex-col items-center">
                <Globe className="animate-spin h-8 w-8 text-blue-500 mb-2" />
                <p>A IA está pesquisando referências e escrevendo a discussão...</p>
            </div>
        </Card>
      )}
      {discussionError && (
        <Card className="border-red-500 border"><p className="text-red-600">{discussionError}</p></Card>
      )}

      {discussionText && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Discussão Gerada</h2>
             <div className="flex items-center gap-1">
                <Button onClick={() => handleExportDoc(discussionText, 'discussao')} variant="secondary" size="sm" title="Exportar para .doc"><FileDown size={14} className="mr-1"/>DOC</Button>
                <Button onClick={() => handleExportPdf(discussionText, 'discussao')} variant="secondary" size="sm" title="Exportar para .pdf"><FileType size={14} className="mr-1"/>PDF</Button>
                <Button onClick={() => handleCopyToClipboard(discussionText, 'discussion')} variant="secondary" size="sm">
                  <Clipboard size={14} className="mr-2" />
                  {copiedSection === 'discussion' ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md">{renderMarkdown(discussionText)}</div>
          <FeedbackSection 
             context="discussion" 
             onSave={(rating, refStatus, comment) => handleFeedback('discussion', rating, refStatus, comment)}
          />
        </Card>
      )}

      {referencesText && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Referências (ABNT)</h2>
             <div className="flex items-center gap-1">
                <Button onClick={() => handleExportDoc(referencesText, 'referencias')} variant="secondary" size="sm" title="Exportar para .doc"><FileDown size={14} className="mr-1"/>DOC</Button>
                <Button onClick={() => handleExportPdf(referencesText, 'referencias')} variant="secondary" size="sm" title="Exportar para .pdf"><FileType size={14} className="mr-1"/>PDF</Button>
                <Button onClick={() => handleCopyToClipboard(referencesText, 'references')} variant="secondary" size="sm">
                  <Clipboard size={14} className="mr-2" />
                  {copiedSection === 'references' ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md">{renderMarkdown(referencesText)}</div>
        </Card>
      )}

       <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-blue-600"/>
                <h2 className="text-xl font-semibold">Análise Interativa (Chat)</h2>
            </div>
            {chatHistory.length > 0 && (
                <Button onClick={handleClearChat} variant="danger" size="sm">Limpar Chat</Button>
            )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Faça perguntas sobre seus dados. A IA usará o contexto da pesquisa para responder rapidamente.
        </p>
        <div className="border rounded-lg dark:border-gray-700 flex flex-col h-[500px]">
            <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                        <MessageSquare size={48} className="mb-4"/>
                        <p>Nenhuma mensagem ainda.</p>
                        <p className="text-sm">Ex: "Qual domínio teve a pior avaliação?"</p>
                    </div>
                ) : (
                    chatHistory.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
                                {renderMarkdown(msg.text)}
                            </div>
                        </div>
                    ))
                )}
                 {isChatting && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%] p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                           <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                 )}
            </div>
            <div className="p-4 border-t dark:border-gray-700 flex items-center gap-2">
                <Input 
                    type="text" 
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Faça uma pergunta..."
                    disabled={isChatting}
                    className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={isChatting || !userMessage.trim()}><Send size={16}/></Button>
            </div>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {renderSettings()}
        {activeKey ? renderAnalysisInterface() : (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-red-800 dark:text-red-200">Chave de API Necessária</p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                        Para utilizar os recursos de IA, você deve configurar uma chave de API acima ou iniciar a aplicação com a variável de ambiente <code>API_KEY</code>.
                    </p>
                </div>
            </div>
        )}
      </div>
      <Modal 
        isOpen={isPromptModalOpen} 
        onClose={() => setIsPromptModalOpen(false)} 
        title={promptModalContent.title}
        className="max-w-4xl"
      >
        <pre className="text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-900 p-4 rounded-md">
            <code>{promptModalContent.content}</code>
        </pre>
      </Modal>
    </>
  );
};

export default GeminiAnalysisTab;
