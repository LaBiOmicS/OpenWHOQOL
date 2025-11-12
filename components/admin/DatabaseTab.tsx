
import React, { useState, useEffect, useRef } from 'react';
import { AppData, ExternalStorageConfig, Participant, SocioeconomicData } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Database, Save, RefreshCw, Server, CheckCircle, XCircle, Copy, Download, Upload, Trash2, FileSpreadsheet, FileJson, AlertTriangle, UserPlus, Users } from 'lucide-react';
import { getExternalConfig, saveExternalConfig, syncFromExternal, syncToExternal } from '../../lib/db';
import { processImportedFiles } from '../../lib/importer';
import { createLogEntry } from '../../lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { SOCIOECONOMIC_FIELDS, WHOQOL_QUESTIONS, INITIAL_WHOQOL_RESPONSE } from '../../constants';

interface DatabaseTabProps {
  appData: AppData;
  setAppData: (data: AppData) => Promise<void>;
}

type GenerationProfile = 'random' | 'high_qol' | 'very_high_qol' | 'low_qol' | 'very_low_qol' | 'elderly' | 'students';
type GenerationMode = 'append' | 'replace';

const DatabaseTab: React.FC<DatabaseTabProps> = ({ appData, setAppData }) => {
  // External Config State
  const [config, setConfig] = useState<ExternalStorageConfig>({
    enabled: false,
    endpointUrl: '',
    apiKey: ''
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  // Data Management State
  const [generateCount, setGenerateCount] = useState<number>(50);
  const [generationProfile, setGenerationProfile] = useState<GenerationProfile>('random');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('append');
  const [isLoading, setIsLoading] = useState(false);
  const [dataMessage, setDataMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedConfig = getExternalConfig();
    if (storedConfig) {
      setConfig(storedConfig);
    }
  }, []);

  // --- External Config Handlers ---

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveConfig = () => {
    saveExternalConfig(config);
    setTestStatus('idle');
    setTestMessage('Configuração salva localmente.');
    setTimeout(() => setTestMessage(''), 3000);
  };

  const handleTestConnection = async () => {
    if (!config.endpointUrl) {
        setTestStatus('error');
        setTestMessage('URL do Endpoint é obrigatória.');
        return;
    }
    setTestStatus('testing');
    setTestMessage('Testando conexão...');
    try {
        await syncFromExternal(config);
        setTestStatus('success');
        setTestMessage('Conexão bem-sucedida! Dados recebidos corretamente.');
    } catch (error) {
        setTestStatus('error');
        setTestMessage(`Falha na conexão: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSyncPush = async () => {
      if (!confirm("Tem certeza? Isso irá SOBRESCREVER os dados no banco externo com os dados atuais deste navegador.")) return;
      setSyncStatus('syncing');
      setSyncMessage('Enviando dados locais para o servidor...');
      try {
          await syncToExternal(config, appData);
          setSyncStatus('success');
          setSyncMessage('Dados enviados com sucesso para o servidor!');
      } catch (error) {
          setSyncStatus('error');
          setSyncMessage(`Erro ao enviar: ${error instanceof Error ? error.message : String(error)}`);
      }
  };

  const handleSyncPull = async () => {
      if (!confirm("Tem certeza? Isso irá SOBRESCREVER os dados locais deste navegador com os dados do servidor externo.")) return;
      setSyncStatus('syncing');
      setSyncMessage('Baixando dados do servidor...');
      try {
          const remoteData = await syncFromExternal(config);
          await setAppData(remoteData);
          setSyncStatus('success');
          setSyncMessage('Dados locais atualizados com sucesso a partir do servidor!');
      } catch (error) {
          setSyncStatus('error');
          setSyncMessage(`Erro ao baixar: ${error instanceof Error ? error.message : String(error)}`);
      }
  };

  // --- Data Generation Logic ---

  const weightedRandom = (items: string[], weights: number[]) => {
      let i;
      let sum = 0;
      const r = Math.random();
      for (i in weights) {
          sum += weights[i];
          if (r <= sum) return items[i];
      }
      return items[0];
  };

  const generateSingleParticipant = (profile: GenerationProfile): Participant => {
    const educationOptions = SOCIOECONOMIC_FIELDS.find(f => f.id === 'education')?.options || [];
    const incomeOptions = SOCIOECONOMIC_FIELDS.find(f => f.id === 'income')?.options || [];
    const maritalOptions = SOCIOECONOMIC_FIELDS.find(f => f.id === 'maritalStatus')?.options || [];
    
    // Pega todas as opções de gênero definidas nas constantes para garantir variabilidade completa
    const genderOptions = SOCIOECONOMIC_FIELDS.find(f => f.id === 'gender')?.options || ['Outro'];

    let age = 0;
    let education = '';
    let profession = '';
    let income = '';
    let maritalStatus = '';
    
    // Seleciona gênero aleatoriamente de TODAS as opções disponíveis
    let gender = genderOptions[Math.floor(Math.random() * genderOptions.length)];

    switch (profile) {
        case 'elderly':
            age = Math.floor(Math.random() * 30) + 60; // 60-90
            profession = 'Aposentado';
            maritalStatus = ['Casado(a)/União Estável', 'Viúvo(a)', 'Divorciado(a)/Separado(a)'][Math.floor(Math.random() * 3)];
            education = weightedRandom(educationOptions, [0.4, 0.2, 0.2, 0.1, 0.1, 0.0, 0.0]);
            income = weightedRandom(incomeOptions, [0.1, 0.4, 0.3, 0.15, 0.05]);
            break;
        case 'students':
            age = Math.floor(Math.random() * 8) + 18; // 18-26
            profession = 'Estudante';
            maritalStatus = 'Solteiro(a)';
            education = weightedRandom(educationOptions, [0.0, 0.0, 0.1, 0.3, 0.6, 0.0, 0.0]);
            income = weightedRandom(incomeOptions, [0.5, 0.3, 0.15, 0.05, 0.0]);
            break;
        case 'high_qol':
        case 'very_high_qol':
            age = Math.floor(Math.random() * 50) + 25;
            profession = ['Empresário', 'Médico', 'Engenheiro', 'Diretor', 'Advogado', 'Juiz', 'Cientista'][Math.floor(Math.random() * 7)];
            income = weightedRandom(incomeOptions, [0.0, 0.0, 0.1, 0.3, 0.6]);
            education = weightedRandom(educationOptions, [0.0, 0.0, 0.0, 0.1, 0.1, 0.4, 0.4]);
            maritalStatus = maritalOptions[Math.floor(Math.random() * maritalOptions.length)];
            break;
        case 'low_qol':
        case 'very_low_qol':
            age = Math.floor(Math.random() * 50) + 18;
            profession = ['Desempregado', 'Autônomo', 'Auxiliar', 'Serviços Gerais', 'Bico'][Math.floor(Math.random() * 5)];
            income = weightedRandom(incomeOptions, [0.6, 0.3, 0.1, 0.0, 0.0, 0.0, 0.0]);
            education = weightedRandom(educationOptions, [0.4, 0.4, 0.2, 0.0, 0.0, 0.0, 0.0]);
            maritalStatus = maritalOptions[Math.floor(Math.random() * maritalOptions.length)];
            break;
        case 'random':
        default:
            age = Math.floor(Math.random() * 60) + 18;
            profession = ['Professor', 'Vendedor', 'Administrador', 'Motorista', 'Do lar', 'Designer', 'Programador', 'Enfermeiro', 'Técnico'][Math.floor(Math.random() * 9)];
            education = weightedRandom(educationOptions, [0.05, 0.1, 0.15, 0.3, 0.2, 0.15, 0.05]);
            income = weightedRandom(incomeOptions, [0.2, 0.3, 0.3, 0.15, 0.05]);
            maritalStatus = maritalOptions[Math.floor(Math.random() * maritalOptions.length)];
            break;
    }

    const socio: SocioeconomicData = { age, gender, education, maritalStatus, profession, income };

    const whoqolResponse = { ...INITIAL_WHOQOL_RESPONSE };
    let targetScore = 3; 
    let volatility = 1.0;

    if (profile === 'very_high_qol') {
        targetScore = 4.9; // Quase perfeito
        volatility = 0.2;  // Pouquíssima variação
    } else if (profile === 'high_qol') {
        targetScore = 4.5; 
        volatility = 0.6;
    } else if (profile === 'very_low_qol') {
        targetScore = 1.1; // Quase mínimo
        volatility = 0.2;  // Pouquíssima variação
    } else if (profile === 'low_qol') {
        targetScore = 1.8; 
        volatility = 0.8;
    } else if (profile === 'students') {
        targetScore = 3.5; 
        volatility = 1.0;
    } else if (profile === 'elderly') {
        targetScore = 3.2; 
        volatility = 0.9;
    } else {
        targetScore = 3 + (Math.random() * 1 - 0.5);
        volatility = 1.2;
    }

    WHOQOL_QUESTIONS.forEach(q => {
        let questionTarget = targetScore;
        
        // Ajustes finos por perfil (exceto os extremos que forçam o score)
        if (!profile.startsWith('very_')) {
            if (profile === 'students') {
                if (q.id === 'Q12') questionTarget -= 1.5; // Dinheiro
                if (q.domain === 'social') questionTarget += 0.5;
            }
            if (profile === 'elderly') {
                if (q.domain === 'physical') questionTarget -= 0.8;
                if (q.domain === 'environment') questionTarget += 0.5;
            }
        }

        let rawTarget = q.negative ? (6 - questionTarget) : questionTarget;
        let val = Math.round(rawTarget + (Math.random() * 2 - 1) * volatility);
        
        if (val < 1) val = 1;
        if (val > 5) val = 5;
        whoqolResponse[q.id] = val;
    });

    return {
        id: uuidv4(),
        submittedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        consentGiven: true,
        socioeconomic: socio,
        whoqol: whoqolResponse,
        isExcluded: false,
        exclusionReason: null,
        assistedFillOut: profile === 'elderly' ? Math.random() > 0.7 : Math.random() > 0.95,
        timeToCompleteMinutes: Math.floor(Math.random() * 15) + 5,
    };
  };

  const handleGenerateTestData = async () => {
    if (generateCount <= 0) {
        alert("Por favor, insira uma quantidade válida maior que 0.");
        return;
    }
    setIsLoading(true);
    let currentParticipants = generationMode === 'replace' ? [] : [...appData.participants];
    const newParticipants: Participant[] = [];
    for (let i = 0; i < generateCount; i++) {
        newParticipants.push(generateSingleParticipant(generationProfile));
    }
    const finalParticipants = [...currentParticipants, ...newParticipants];
    const logAction = generationMode === 'replace' ? 'TEST_DATA_REPLACED' : 'TEST_DATA_ADDED';
    const logMsg = generationMode === 'replace' 
        ? `Base substituída por ${generateCount} participantes (Perfil: ${generationProfile}).`
        : `Adicionados ${generateCount} participantes (Perfil: ${generationProfile}).`;
    const newData = { ...appData, participants: finalParticipants };
    const dataWithLog = createLogEntry(newData, logAction, logMsg);
    await setAppData(dataWithLog);
    setDataMessage(`${generateCount} participantes gerados com sucesso!`);
    setTimeout(() => setDataMessage(''), 3000);
    setIsLoading(false);
  };

  const handleClearParticipants = async () => {
    if (window.confirm('ATENÇÃO: Isso apagará TODOS os dados dos participantes do banco de dados local. Certifique-se de ter um backup. Deseja continuar?')) {
      const newData = { ...appData, participants: [] };
      const dataWithLog = createLogEntry(newData, 'PARTICIPANTS_CLEARED', 'Base de participantes limpa.');
      await setAppData(dataWithLog);
      setDataMessage('Base de participantes limpa com sucesso.');
      setTimeout(() => setDataMessage(''), 3000);
    }
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `openwhoqol_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    const dataWithLog = createLogEntry(appData, 'DATA_EXPORTED', 'Backup JSON gerado.');
    setAppData(dataWithLog); 
    setDataMessage('Backup JSON gerado com sucesso.');
    setTimeout(() => setDataMessage(''), 3000);
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('Isso substituirá TODOS os dados atuais (configurações e participantes) pelos dados do arquivo. Deseja continuar?')) {
        if (jsonInputRef.current) jsonInputRef.current.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.admin && Array.isArray(json.participants)) {
            const importedData = json as AppData;
            const dataWithLog = createLogEntry(importedData, 'DATA_IMPORTED_JSON', 'Backup restaurado via arquivo.');
            await setAppData(dataWithLog);
            setDataMessage('Backup restaurado com sucesso!');
        } else {
            alert('Arquivo de backup inválido. Estrutura JSON incorreta.');
        }
      } catch (error) {
        console.error(error);
        alert('Erro ao ler o arquivo JSON.');
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
    setTimeout(() => setDataMessage(''), 3000);
  };

  const handleImportParticipants = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      setIsLoading(true);
      try {
          const { newParticipants } = await processImportedFiles(files);
          
          // Filtra IDs duplicados
          const existingIds = new Set(appData.participants.map(p => p.id));
          const uniqueNewParticipants = newParticipants.filter(p => !existingIds.has(p.id));
          const ignoredCount = newParticipants.length - uniqueNewParticipants.length;

          if (uniqueNewParticipants.length > 0) {
              const newData = { ...appData, participants: [...appData.participants, ...uniqueNewParticipants] };
              const dataWithLog = createLogEntry(newData, 'PARTICIPANTS_IMPORTED_FILE', { count: uniqueNewParticipants.length, ignored: ignoredCount });
              await setAppData(dataWithLog);
              
              let msg = `${uniqueNewParticipants.length} participantes importados com sucesso!`;
              if (ignoredCount > 0) {
                  msg += ` (${ignoredCount} ignorados pois já existiam).`;
              }
              setDataMessage(msg);
          } else if (ignoredCount > 0) {
              setDataMessage(`Nenhum dado novo. Todos os ${ignoredCount} participantes encontrados já existem no banco.`);
          } else {
              alert("Nenhum participante válido encontrado nos arquivos.");
          }
      } catch (error) {
          alert(`Erro na importação: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
          setIsLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setTimeout(() => setDataMessage(''), 5000);
      }
  };

  const copyCode = () => {
      navigator.clipboard.writeText(serverExampleCode);
      alert("Código copiado para a área de transferência!");
  };

  const serverExampleCode = `// Exemplo de servidor Node.js/Express simples para receber os dados
// Instale: npm install express cors body-parser
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
app.use(express.json({ limit: '50mb' }));
app.use(cors());
let databaseStorage = null;
const authenticate = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const VALID_KEY = 'sua-chave-secreta-aqui';
    if (apiKey === VALID_KEY) next();
    else res.status(403).json({ error: 'Acesso negado: Chave de API inválida' });
};
app.get('/api/storage', authenticate, (req, res) => {
    if (!databaseStorage) return res.status(404).json({ error: 'Nenhum dado encontrado no servidor' });
    res.json(databaseStorage);
});
app.post('/api/storage', authenticate, (req, res) => {
    const data = req.body;
    if (!data || !data.participants) return res.status(400).json({ error: 'Formato de dados inválido' });
    databaseStorage = data;
    console.log(\`Dados recebidos e salvos: \${data.participants.length} participantes.\`);
    res.json({ success: true, message: 'Dados salvos com sucesso' });
});
app.listen(port, () => {
    console.log(\`Servidor de armazenamento rodando em http://localhost:\${port}\`);
});`;

  return (
    <div className="space-y-6">
      {/* --- Local Data Management --- */}
      <Card>
         <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Database className="text-blue-600"/> Gerenciamento de Dados Locais</h2>
         
         {dataMessage && (
              <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-sm border border-blue-200 dark:border-blue-800 animate-pulse">
                  {dataMessage}
              </div>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna 1: Gerar Dados */}
              <div className="flex flex-col h-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-md font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <RefreshCw size={16}/> Gerar Dados de Teste
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex-grow">
                      Gere participantes fictícios para testar análises e gráficos. Escolha um perfil demográfico/QoL para simular cenários específicos.
                  </p>
                  <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label htmlFor="genCount" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Quantidade:</label>
                            <Input 
                                id="genCount" 
                                type="number" 
                                min="1" 
                                value={generateCount} 
                                onChange={(e) => setGenerateCount(parseInt(e.target.value) || 0)} 
                            />
                          </div>
                          <div>
                             <label htmlFor="genProfile" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Perfil de Simulação:</label>
                             <select
                                id="genProfile"
                                value={generationProfile}
                                onChange={(e) => setGenerationProfile(e.target.value as GenerationProfile)}
                                className="w-full px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm h-[42px]"
                             >
                                 <option value="random">Aleatório (Padrão)</option>
                                 <option value="high_qol">Alta Qualidade de Vida</option>
                                 <option value="very_high_qol">Muito Alta QV (Extremo)</option>
                                 <option value="low_qol">Baixa Qualidade de Vida</option>
                                 <option value="very_low_qol">Muito Baixa QV (Extremo)</option>
                                 <option value="elderly">Perfil: Idosos</option>
                                 <option value="students">Perfil: Estudantes</option>
                             </select>
                          </div>
                      </div>

                      <div className="flex gap-4 py-2 justify-between">
                           <label className="flex items-center text-xs cursor-pointer">
                               <input 
                                   type="radio" 
                                   name="genMode" 
                                   value="append" 
                                   checked={generationMode === 'append'} 
                                   onChange={() => setGenerationMode('append')}
                                   className="mr-1 text-blue-600 focus:ring-blue-500"
                               />
                               <UserPlus size={14} className="mr-1 text-green-600"/> Adicionar
                           </label>
                           <label className="flex items-center text-xs cursor-pointer">
                               <input 
                                   type="radio" 
                                   name="genMode" 
                                   value="replace" 
                                   checked={generationMode === 'replace'} 
                                   onChange={() => setGenerationMode('replace')}
                                   className="mr-1 text-blue-600 focus:ring-blue-500"
                               />
                               <Users size={14} className="mr-1 text-red-500"/> Substituir Tudo
                           </label>
                      </div>

                      <Button onClick={handleGenerateTestData} variant="primary" disabled={isLoading} className="w-full justify-center">
                          {isLoading ? 'Gerando...' : 'Gerar Dados'}
                      </Button>
                  </div>
              </div>

              {/* Coluna 2: Backup e Restauração */}
              <div className="flex flex-col h-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                   <h3 className="text-md font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                       <Download size={16}/> Backup & Migração
                   </h3>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex-grow">
                       Exporte todos os dados para segurança ou transfira para outro computador. Suporta importação de JSON (Backup) ou Planilhas (Dados Externos).
                   </p>
                   <div className="space-y-3">
                       <Button onClick={handleExportBackup} variant="secondary" className="w-full justify-start">
                           <FileJson size={16} className="text-blue-600" />
                           Exportar Backup (JSON)
                       </Button>
                       
                       <div className="relative">
                             <input type="file" accept=".json" ref={jsonInputRef} onChange={handleImportBackup} className="hidden" id="json-upload"/>
                             <label htmlFor="json-upload" className="block w-full">
                                 <Button as="span" variant="secondary" className="w-full justify-start cursor-pointer">
                                     <Upload size={16} className="text-green-600" />
                                     Restaurar Backup (JSON)
                                 </Button>
                             </label>
                        </div>

                        <div className="relative">
                             <input type="file" accept=".csv, .tsv, .xls, .xlsx" multiple ref={fileInputRef} onChange={handleImportParticipants} className="hidden" id="file-upload"/>
                             <label htmlFor="file-upload" className="block w-full">
                                 <Button as="span" variant="secondary" className="w-full justify-start cursor-pointer" disabled={isLoading}>
                                     <FileSpreadsheet size={16} className="text-green-600" />
                                     Importar Planilha (CSV/XLS)
                                 </Button>
                             </label>
                        </div>
                   </div>
              </div>
              
              {/* Coluna 3: Zona de Perigo */}
              <div className="flex flex-col h-full p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-900/10">
                  <h3 className="text-md font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                      <AlertTriangle size={16}/> Zona de Perigo
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex-grow">
                      Ações destrutivas. Apagam dados permanentemente do navegador. Certifique-se de ter exportado um backup antes.
                  </p>
                  <div className="mt-auto">
                      <Button onClick={handleClearParticipants} variant="danger" disabled={appData.participants.length === 0} className="w-full justify-center">
                          <Trash2 size={16} />
                          Apagar Todos os Dados
                      </Button>
                  </div>
              </div>
         </div>
      </Card>

      {/* --- External DB Config --- */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
            <Server className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Banco de Dados Externo (Sincronização)</h2>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400 p-4 mb-6 text-sm text-purple-800 dark:text-purple-200">
            <p>
                <strong>Como funciona:</strong> Esta funcionalidade permite conectar o painel administrativo a uma API externa. 
                O navegador enviará o objeto JSON completo para o endpoint configurado, permitindo persistência em nuvem.
            </p>
        </div>

        <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-4 border-b dark:border-gray-700">
                <input
                    type="checkbox"
                    id="enabled"
                    name="enabled"
                    checked={config.enabled}
                    onChange={handleConfigChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="font-medium text-gray-900 dark:text-white">
                    Habilitar Armazenamento Externo
                </label>
            </div>

            <div className={`space-y-4 transition-opacity ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                    <label htmlFor="endpointUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        URL do Endpoint (API)
                    </label>
                    <Input
                        id="endpointUrl"
                        name="endpointUrl"
                        type="url"
                        placeholder="Ex: https://meu-servidor.com/api/storage"
                        value={config.endpointUrl}
                        onChange={handleConfigChange}
                        className="mt-1"
                    />
                </div>

                <div>
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Chave de API / Token
                    </label>
                    <Input
                        id="apiKey"
                        name="apiKey"
                        type="password"
                        placeholder="Sua chave secreta definida no servidor"
                        value={config.apiKey}
                        onChange={handleConfigChange}
                        className="mt-1"
                    />
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                    <Button onClick={handleSaveConfig}>
                        <Save size={16} /> Salvar Configuração
                    </Button>
                    <Button onClick={handleTestConnection} variant="secondary">
                        Testar Conexão
                    </Button>
                </div>

                {testMessage && (
                    <p className={`text-sm mt-2 ${testStatus === 'success' ? 'text-green-600' : testStatus === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                        {testMessage}
                    </p>
                )}
            </div>
        </div>
      </Card>

      {/* --- Sync Actions --- */}
      {config.enabled && (
          <Card className="border-t-4 border-purple-500">
              <h3 className="text-lg font-semibold mb-4">Ações de Sincronização Manual</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h4 className="font-bold text-gray-800 dark:text-white mb-2">Enviar para Nuvem (Push)</h4>
                      <p className="text-xs text-gray-500 mb-4">
                          Sobrescreve os dados do servidor com os dados atuais deste navegador.
                      </p>
                      <Button onClick={handleSyncPush} variant="primary" className="w-full" disabled={syncStatus === 'syncing'}>
                          <Upload size={16} /> Enviar Dados Locais
                      </Button>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h4 className="font-bold text-gray-800 dark:text-white mb-2">Baixar da Nuvem (Pull)</h4>
                      <p className="text-xs text-gray-500 mb-4">
                          Sobrescreve os dados deste navegador com os dados do servidor.
                      </p>
                      <Button onClick={handleSyncPull} variant="secondary" className="w-full" disabled={syncStatus === 'syncing'}>
                          <Download size={16} /> Baixar Dados Remotos
                      </Button>
                  </div>
              </div>
              {syncMessage && (
                <p className={`text-sm mt-4 text-center ${syncStatus === 'success' ? 'text-green-600' : syncStatus === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                    {syncMessage}
                </p>
              )}
          </Card>
      )}
      
      {/* --- Server Example --- */}
      <Card>
          <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Exemplo de Backend (Node.js)</h3>
              <Button size="sm" variant="secondary" onClick={copyCode} title="Copiar código">
                  <Copy size={14} /> Copiar
              </Button>
          </div>
          <div className="bg-gray-900 text-gray-300 p-4 rounded-md overflow-x-auto text-xs font-mono border border-gray-700">
              <pre>{serverExampleCode}</pre>
          </div>
      </Card>
    </div>
  );
};

export default DatabaseTab;
