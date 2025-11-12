import React, { useState } from 'react';
import { AppData, AdminConfig } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { createLogEntry } from '../../lib/logger';
import { Save, Lock, CheckCircle, XCircle, BrainCircuit, Fingerprint, Globe, HardDrive, Thermometer, Cpu, RotateCcw, Mail } from 'lucide-react';
import { INITIAL_APP_DATA } from '../../constants';

interface SetupTabProps {
  appData: AppData;
  setAppData: (data: AppData) => Promise<void>;
}

const SetupTab: React.FC<SetupTabProps> = ({ appData, setAppData }) => {
  const [config, setConfig] = useState<AdminConfig>(appData.admin.config);
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [configMessage, setConfigMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // --- Configuração Geral ---

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;

    if (type === 'checkbox') {
        newValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
        newValue = value === '' ? '' : Number(value);
    } else if (type === 'range') {
        newValue = Number(value);
    }

    setConfig(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const validatePassword = (pwd: string): boolean => {
    // Min 8, Max 32, 1 Upper, 1 Lower, 1 Number, 1 Special
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,32}$/;
    return regex.test(pwd);
  };

  const handleSaveConfig = async () => {
    let updatedAdmin = { ...appData.admin, config };
    let logDetails = 'Configurações da pesquisa atualizadas.';
    
    if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
            setPasswordError('As senhas não coincidem.');
            return;
        }
        if (!validatePassword(newPassword)) {
            setPasswordError('A senha não atende aos requisitos de complexidade.');
            return;
        }
        updatedAdmin.password = newPassword;
        logDetails += ' Senha de administrador alterada.';
    }

    const newData = { ...appData, admin: updatedAdmin };
    const dataWithLog = createLogEntry(newData, 'CONFIG_UPDATED', logDetails);
    
    await setAppData(dataWithLog);
    setConfigMessage('Configurações salvas com sucesso!');
    setPasswordError('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setConfigMessage(''), 3000);
  };

  const handleResetAIConfig = () => {
    if (window.confirm("Tem certeza que deseja redefinir a IA para os padrões de fábrica? Isso apagará a memória de aprendizado, a identidade personalizada e redefinirá os parâmetros.")) {
        setConfig(prev => ({
            ...prev,
            aiSystemIdentity: INITIAL_APP_DATA.admin.config.aiSystemIdentity,
            aiGlobalContext: INITIAL_APP_DATA.admin.config.aiGlobalContext,
            aiTuningInstructions: INITIAL_APP_DATA.admin.config.aiTuningInstructions,
            aiTemperature: INITIAL_APP_DATA.admin.config.aiTemperature,
            aiTopK: INITIAL_APP_DATA.admin.config.aiTopK,
            aiTopP: INITIAL_APP_DATA.admin.config.aiTopP,
        }));
        setConfigMessage("Configurações da IA redefinidas. Clique em Salvar para confirmar.");
    }
  };
  
    const emailServerExampleCode = `// Exemplo de servidor Node.js/Express para receber e enviar e-mails
// ----------------------------------------------------------------
// 1. Instale as dependências: npm install express cors nodemailer
// 2. Configure seu serviço de e-mail na seção "NODEMAILER CONFIGURATION"
// 3. Rode o servidor: node server.js

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
// Permite requisições do seu app e aumenta o limite para o anexo
app.use(cors()); 
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3001;

// --- NODEMAILER CONFIGURATION ---
// IMPORTANTE: Use variáveis de ambiente para credenciais em produção!
// Exemplo para Gmail (requer "Acesso a app menos seguro" na conta Google)
// Para produção, use um serviço como SendGrid, Mailgun, AWS SES, etc.
const transporter = nodemailer.createTransport({
    host: 'smtp.example.com', // Ex: 'smtp.gmail.com'
    port: 587,
    secure: false, // true para porta 465, false para outras
    auth: {
        user: 'seu_email@example.com', // Seu usuário do servidor SMTP
        pass: 'sua_senha_smtp',       // Sua senha do servidor SMTP
    },
});

// --- API ENDPOINT ---
app.post('/send-notification', (req, res) => {
    const { to, subject, body, attachment } = req.body;

    if (!to || !subject || !attachment || !attachment.content) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes: to, subject, attachment' });
    }

    const mailOptions = {
        from: '"OpenWHOQOL Notifier" <seu_email@example.com>',
        to: to,
        subject: subject,
        html: \`<p>\${body}</p>\`,
        attachments: [
            {
                filename: attachment.filename,
                content: attachment.content,
                encoding: 'base64',
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar e-mail:', error);
            return res.status(500).json({ error: 'Falha ao enviar e-mail' });
        }
        console.log('E-mail enviado: ' + info.response);
        res.status(200).json({ message: 'E-mail enviado com sucesso' });
    });
});

app.listen(PORT, () => {
    console.log(\`Servidor de notificação por e-mail rodando na porta \${PORT}\`);
});`;


  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center text-xs ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
      {met ? <CheckCircle size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
      {text}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* --- Configurações da Pesquisa --- */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Configurações da Pesquisa</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="projectName" className="block text-sm font-medium">Nome do Projeto</label>
                <Input id="projectName" name="projectName" value={config.projectName} onChange={handleConfigChange} className="mt-1" />
            </div>
            <div>
                <label htmlFor="researcherInstitution" className="block text-sm font-medium">Instituição</label>
                <Input id="researcherInstitution" name="researcherInstitution" value={config.researcherInstitution} onChange={handleConfigChange} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="contactName" className="block text-sm font-medium">Nome do Pesquisador</label>
                <Input id="contactName" name="contactName" value={config.contactName} onChange={handleConfigChange} className="mt-1" />
            </div>
            <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium">Email de Contato</label>
                <Input id="contactEmail" name="contactEmail" value={config.contactEmail} onChange={handleConfigChange} className="mt-1" />
            </div>
          </div>
          <div>
            <label htmlFor="cepProtocol" className="block text-sm font-medium">Protocolo CEP</label>
            <Input id="cepProtocol" name="cepProtocol" value={config.cepProtocol} onChange={handleConfigChange} className="mt-1" />
          </div>
          <div>
            <label htmlFor="tcle" className="block text-sm font-medium">Termo de Consentimento (TCLE) - Suporta Markdown</label>
            <textarea
              id="tcle"
              name="tcle"
              value={config.tcle}
              onChange={handleConfigChange}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mt-1 text-sm font-mono"
            />
          </div>
           <div className="flex items-center space-x-2 pt-2">
                <input
                    type="checkbox"
                    id="enforceAgeRestriction"
                    name="enforceAgeRestriction"
                    checked={config.enforceAgeRestriction}
                    onChange={handleConfigChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enforceAgeRestriction" className="text-sm font-medium">
                    Habilitar arquivamento automático para menores de 18 anos (excluir das análises)
                </label>
            </div>
            <div className="flex items-center space-x-2 pt-2">
                <input
                    type="checkbox"
                    id="requireParticipantEmail"
                    name="requireParticipantEmail"
                    checked={config.requireParticipantEmail}
                    onChange={handleConfigChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requireParticipantEmail" className="text-sm font-medium">
                    Tornar o e-mail do participante obrigatório (para correlação com outros dados)
                </label>
            </div>
        </div>
      </Card>

       {/* --- Notificações por Email --- */}
      <Card>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Mail className="h-5 w-5"/> Notificações por E-mail</h2>
          <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-200 text-sm">
                  <strong>Atenção:</strong> O envio de e-mails requer um <strong>servidor/backend customizado</strong> por você. O OpenWHOQOL apenas enviará os dados para a URL que você configurar. As credenciais de e-mail (SMTP) <strong>NÃO</strong> são armazenadas aqui por segurança.
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                  <input
                      type="checkbox"
                      id="emailNotificationEnabled"
                      name="emailNotificationEnabled"
                      checked={config.emailNotificationEnabled}
                      onChange={handleConfigChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="emailNotificationEnabled" className="text-sm font-medium">
                      Habilitar notificação por e-mail para cada nova resposta
                  </label>
              </div>

              <div className={`space-y-4 transition-opacity ${!config.emailNotificationEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label htmlFor="notificationEmailAddress" className="block text-sm font-medium">E-mail do Administrador (Destinatário)</label>
                          <Input id="notificationEmailAddress" name="notificationEmailAddress" type="email" value={config.notificationEmailAddress} onChange={handleConfigChange} className="mt-1" placeholder="admin@instituicao.com"/>
                      </div>
                      <div>
                          <label htmlFor="notificationApiEndpoint" className="block text-sm font-medium">URL do Endpoint de Envio</label>
                          <Input id="notificationApiEndpoint" name="notificationApiEndpoint" type="url" value={config.notificationApiEndpoint} onChange={handleConfigChange} className="mt-1" placeholder="https://seu-servidor.com/api/send-email"/>
                      </div>
                  </div>

                  <details className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-xs">
                      <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300">Ver exemplo de código do servidor (Node.js)</summary>
                      <pre className="mt-4 bg-gray-900 text-gray-300 p-4 rounded overflow-x-auto font-mono">{emailServerExampleCode}</pre>
                  </details>
              </div>
          </div>
      </Card>


      {/* --- Segurança --- */}
      <Card>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Lock className="h-5 w-5"/> Segurança</h2>
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium">Nova Senha de Administrador</label>
                    <Input 
                        id="newPassword" 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => {
                            setNewPassword(e.target.value);
                            if (passwordError) setPasswordError('');
                        }} 
                        placeholder="Nova senha" 
                        className="mt-1" 
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium">Confirmar Nova Senha</label>
                    <Input 
                        id="confirmPassword" 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (passwordError) setPasswordError('');
                        }} 
                        placeholder="Confirme a senha" 
                        className="mt-1" 
                    />
                </div>
            </div>
            
            {newPassword && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <PasswordRequirement met={newPassword.length >= 8 && newPassword.length <= 32} text="Entre 8 e 32 caracteres" />
                    <PasswordRequirement met={/[A-Z]/.test(newPassword)} text="Pelo menos uma letra maiúscula" />
                    <PasswordRequirement met={/[a-z]/.test(newPassword)} text="Pelo menos uma letra minúscula" />
                    <PasswordRequirement met={/\d/.test(newPassword)} text="Pelo menos um número" />
                    <PasswordRequirement met={/[\W_]/.test(newPassword)} text="Pelo menos um caractere especial (!@#...)" />
                    <PasswordRequirement met={newPassword === confirmPassword && newPassword.length > 0} text="Senhas coincidem" />
                </div>
            )}

            {passwordError && <p className="text-sm text-red-600 font-medium">{passwordError}</p>}
            <p className="text-xs text-gray-500 mt-1">Deixe os campos em branco se não desejar alterar a senha.</p>
        </div>
      </Card>

      {/* --- Gestão do Cérebro da IA --- */}
      <Card className="border-2 border-indigo-100 dark:border-indigo-900">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-indigo-600" />
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Gestão do Cérebro da IA</h3>
                    <p className="text-xs text-gray-500">Configure o comportamento, memória e parâmetros do modelo Gemini.</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna Esquerda: Comportamento */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 border-b pb-2">Comportamento & Contexto</h4>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                        <Fingerprint size={14} /> Identidade (Persona)
                    </label>
                    <textarea
                        name="aiSystemIdentity"
                        value={config.aiSystemIdentity || ''}
                        onChange={handleConfigChange}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Ex: Você é um pesquisador sênior especialista em psicometria..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Define quem a IA "é" e seu tom de voz.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                        <Globe size={14} /> Contexto Global
                    </label>
                    <textarea
                        name="aiGlobalContext"
                        value={config.aiGlobalContext || ''}
                        onChange={handleConfigChange}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Ex: O estudo foi realizado na cidade de São Paulo, durante o ano de 2024, com pacientes hospitalizados..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Fatos que a IA deve considerar em <strong>todas</strong> as análises.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                        <HardDrive size={14} /> Memória de Aprendizado (Instruções Acumuladas)
                    </label>
                    <textarea
                        name="aiTuningInstructions"
                        value={config.aiTuningInstructions || ''}
                        onChange={handleConfigChange}
                        rows={4}
                        className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-800"
                        placeholder="Instruções geradas via feedback aparecerão aqui..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Regras que a IA "aprendeu" com seu feedback. Você pode editar manualmente.</p>
                </div>
            </div>

            {/* Coluna Direita: Parâmetros */}
            <div className="space-y-6">
                <h4 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 border-b pb-2">Parâmetros do Modelo</h4>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2"><Thermometer size={14} /> Temperatura: {config.aiTemperature}</span>
                        <span className="text-xs text-gray-500">{config.aiTemperature === 0 ? 'Determinístico' : config.aiTemperature === 2 ? 'Muito Criativo' : 'Balanceado'}</span>
                    </label>
                    <input 
                        type="range" 
                        name="aiTemperature"
                        min="0" 
                        max="2" 
                        step="0.1" 
                        value={config.aiTemperature ?? 0.7} 
                        onChange={handleConfigChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0.0 (Preciso)</span>
                        <span>1.0</span>
                        <span>2.0 (Criativo)</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <Cpu size={14} /> Top K
                        </label>
                        <Input 
                            type="number" 
                            name="aiTopK"
                            value={config.aiTopK ?? 40}
                            onChange={handleConfigChange}
                        />
                        <p className="text-xs text-gray-500 mt-1">Tamanho do pool de tokens.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <Cpu size={14} /> Top P
                        </label>
                        <Input 
                            type="number" 
                            name="aiTopP"
                            step="0.01"
                            max="1"
                            value={config.aiTopP ?? 0.95}
                            onChange={handleConfigChange}
                        />
                        <p className="text-xs text-gray-500 mt-1">Probabilidade cumulativa.</p>
                    </div>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-xs text-blue-800 dark:text-blue-200 mt-4">
                    <p><strong>Nota:</strong> Estes parâmetros afetam como a IA escolhe as próximas palavras. Ajuste a <strong>Temperatura</strong> para controlar a "alucinação" vs "criatividade". Valores baixos (0.1 - 0.5) são melhores para análises factuais.</p>
                </div>
            </div>
        </div>
        
        <div className="mt-8 pt-4 border-t dark:border-gray-700 flex justify-end">
            <Button onClick={handleResetAIConfig} variant="danger" size="sm" className="text-xs">
                <RotateCcw size={14} />
                Redefinir Cérebro da IA (Padrão de Fábrica)
            </Button>
        </div>
      </Card>

      <div className="flex items-center justify-between pt-2 pb-6 sticky bottom-0 bg-gray-100 dark:bg-gray-900 z-10 border-t dark:border-gray-800 mt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            * Alterações de senha ou IA só são aplicadas ao clicar em Salvar.
        </p>
        <div className="flex items-center gap-4">
            {configMessage && <p className="text-sm text-green-600 font-medium animate-pulse">{configMessage}</p>}
            <Button onClick={handleSaveConfig} className="shadow-lg">
                <Save size={18} />
                Salvar Configurações
            </Button>
        </div>
      </div>
    </div>
  );
};

export default SetupTab;
