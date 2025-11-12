import React, { useState } from 'react';
import { AppData, Participant, SocioeconomicData, WHOQOLResponse, AdminConfig } from '../../types';
import { INITIAL_SOCIOECONOMIC_DATA, INITIAL_WHOQOL_RESPONSE, SOCIOECONOMIC_FIELDS, WHOQOL_QUESTIONS } from '../../constants';
import ConsentStep from './ConsentStep';
import SocioeconomicStep from './SocioeconomicStep';
import WhoqolStep from './WhoqolStep';
import CompletionStep from './CompletionStep';
import { v4 as uuidv4 } from 'uuid';
import { Shield, HelpCircle, Scale, ScrollText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import WelcomeModal from './WelcomeModal';
import LicenseModal from './LicenseModal';
import LegalModal, { LegalTab } from './LegalModal';
import InstructionStep from './InstructionStep';
import * as XLSX from 'xlsx';

/**
 * Props para o componente ParticipantFlow.
 */
interface ParticipantFlowProps {
  appData: AppData;
  setAppData: (data: AppData) => Promise<void>;
  onLoginSuccess: () => void;
}

/**
 * Define os possíveis passos no fluxo de preenchimento do participante.
 */
type Step = 'consent' | 'instructions' | 'socioeconomic' | 'whoqol' | 'completion' | 'declined';

/**
 * Componente que orquestra todo o fluxo de um participante,
 * desde o consentimento até a finalização do questionário.
 * Gerencia o estado da etapa atual e os dados coletados.
 */
const ParticipantFlow: React.FC<ParticipantFlowProps> = ({ appData, setAppData, onLoginSuccess }) => {
  // Estado para controlar a etapa atual do fluxo.
  const [step, setStep] = useState<Step>('consent');
  // Estado para armazenar os dados coletados em cada etapa.
  const [socioeconomicData, setSocioeconomicData] = useState<SocioeconomicData>(INITIAL_SOCIOECONOMIC_DATA);
  const [whoqolResponse, setWhoqolResponse] = useState<WHOQOLResponse>(INITIAL_WHOQOL_RESPONSE);
  const [participantId, setParticipantId] = useState<string>(uuidv4());
  const [assistedFillOut, setAssistedFillOut] = useState<boolean | undefined>(undefined);
  const [timeToCompleteMinutes, setTimeToCompleteMinutes] = useState<number | undefined>(undefined);
  
  // Estados dos Modais
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isLegalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('privacy');
  const [isWelcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [isLicenseModalOpen, setLicenseModalOpen] = useState(false);

  // Estado para Login
  const [username, setUsername] = useState(appData.admin.username);
  const [password, setPassword] = useState(
    appData.admin.password === 'admin' ? appData.admin.password : ''
  );
  const [loginError, setLoginError] = useState('');

  /**
   * Manipula a tentativa de login do administrador a partir do modal.
   */
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === appData.admin.username && password === appData.admin.password) {
      setLoginError('');
      setLoginModalOpen(false);
      onLoginSuccess();
    } else {
      setLoginError('Usuário ou senha incorreta.');
    }
  };

  /**
   * Abre o modal legal em uma aba específica.
   */
  const openLegalModal = (tab: LegalTab) => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  /**
   * Avança para a próxima etapa com base na resposta de consentimento.
   */
  const handleConsent = (agreed: boolean) => {
    setStep(agreed ? 'instructions' : 'declined');
  };
  
  const handleInstructionsProceed = () => {
    setStep('socioeconomic');
  };

  const handleSocioeconomicSubmit = (data: SocioeconomicData) => {
    setSocioeconomicData(data);
    setStep('whoqol');
  };

  const handleWhoqolSubmit = (responses: WHOQOLResponse, assisted: boolean, durationMinutes: number) => {
    setWhoqolResponse(responses);
    setAssistedFillOut(assisted);
    setTimeToCompleteMinutes(durationMinutes);
    setStep('completion');
  };
  
  /**
    * Função que encapsula o envio de notificação via API.
    */
  const sendEmailNotification = async (participant: Participant, config: AdminConfig) => {
    if (!config.emailNotificationEnabled || !config.notificationApiEndpoint || !config.notificationEmailAddress) {
        return;
    }

    try {
        const headers = ['ID', 'Data Envio', ...SOCIOECONOMIC_FIELDS.map(f => f.label), ...WHOQOL_QUESTIONS.map(q => q.id)];
        const rowData = [
            participant.id,
            participant.submittedAt,
            ...SOCIOECONOMIC_FIELDS.map(f => participant.socioeconomic?.[f.id] ?? ''),
            ...WHOQOL_QUESTIONS.map(q => participant.whoqol?.[q.id] ?? '')
        ];

        const worksheet = XLSX.utils.aoa_to_sheet([headers, rowData]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Respostas');
        
        const xlsxBase64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

        const payload = {
            to: config.notificationEmailAddress,
            subject: `[OpenWHOQOL] Nova Resposta: ${config.projectName}`,
            body: `Um novo participante (ID: ${participant.id}) completou o questionário. As respostas estão em anexo.`,
            attachment: {
                filename: `resposta_${participant.id.substring(0, 8)}.xlsx`,
                content: xlsxBase64,
                encoding: 'base64'
            }
        };

        await fetch(config.notificationApiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log("Completion notification request sent.");

    } catch (error) {
        console.error("Failed to send completion notification:", error);
    }
  };
  
  /**
   * Finaliza a participação, cria o objeto do participante, salva localmente e envia notificação por e-mail.
   */
  const handleCompletion = async (_: Participant, email?: string) => {
    const age = socioeconomicData.age;
    const isUnderage = typeof age === 'number' && age > 0 && age < 18;
    const shouldExclude = isUnderage && appData.admin.config.enforceAgeRestriction;

    const newParticipant: Participant = {
      id: participantId,
      submittedAt: new Date().toISOString(),
      consentGiven: true,
      socioeconomic: socioeconomicData,
      whoqol: whoqolResponse,
      contactEmail: email,
      isExcluded: shouldExclude,
      exclusionReason: shouldExclude ? 'Critério de idade (menor de 18 anos)' : null,
      assistedFillOut,
      timeToCompleteMinutes,
    };

    // Salva os dados localmente
    await setAppData({ ...appData, participants: [...appData.participants, newParticipant] });
    
    // Dispara a notificação por e-mail em segundo plano (não bloqueia a UI)
    sendEmailNotification(newParticipant, appData.admin.config);
  };

  /**
   * Reseta o fluxo para o início, permitindo que um novo participante comece.
   */
  const handleGoHome = () => {
    setStep('consent');
    setSocioeconomicData(INITIAL_SOCIOECONOMIC_DATA);
    setWhoqolResponse(INITIAL_WHOQOL_RESPONSE);
    setParticipantId(uuidv4());
    setAssistedFillOut(undefined);
    setTimeToCompleteMinutes(undefined);
  };

  /**
   * Renderiza o componente da etapa atual com base no estado `step`.
   */
  const renderStep = () => {
    switch (step) {
      case 'consent':
        return <ConsentStep onConsent={handleConsent} config={appData.admin.config} onOpenLegalModal={openLegalModal} />;
      case 'instructions':
        return <InstructionStep onProceed={handleInstructionsProceed} />;
      case 'socioeconomic':
        return <SocioeconomicStep onSubmit={handleSocioeconomicSubmit} config={appData.admin.config} />;
      case 'whoqol':
        return <WhoqolStep onSubmit={handleWhoqolSubmit} />;
      case 'completion':
        return <CompletionStep onComplete={handleCompletion} onGoHome={handleGoHome} timeToComplete={timeToCompleteMinutes} config={appData.admin.config} />;
      case 'declined':
          return (
              <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
                  <Card className="max-w-xl w-full text-center p-8">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Participação Encerrada</h1>
                      <p className="text-gray-600 dark:text-gray-300 mb-8">Agradecemos seu interesse, mas sua participação não pode prosseguir sem o consentimento. Respeitamos sua decisão.</p>
                      <Button onClick={handleGoHome} variant="secondary">
                        Voltar para o início
                      </Button>
                  </Card>
              </div>
          );
      default:
        return null;
    }
  }

  const showActionButtons = step !== 'completion' && step !== 'declined';
  
  // Atualizado para cor cinza no dark mode para diferenciar do botão principal
  const buttonClasses = "bg-white text-gray-700 p-3 rounded-full shadow-lg hover:bg-gray-100 border border-gray-200 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600 dark:focus:ring-gray-500";

  return (
    <div className="relative min-h-screen pb-20">
      {renderStep()}

      {/* Botões flutuantes centralizados com espaçamento uniforme (gap-3) */}
      {showActionButtons && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
            <button
                onClick={() => setLoginModalOpen(true)}
                className={buttonClasses}
                aria-label="Acesso Administrativo"
                title="Acesso Administrativo"
            >
                <Shield size={24} />
            </button>

            <button
                onClick={() => openLegalModal('privacy')}
                className={buttonClasses}
                aria-label="Termos e Privacidade"
                title="Termos e Privacidade"
            >
                <ScrollText size={24} />
            </button>

            <button
                onClick={() => setLicenseModalOpen(true)}
                className={buttonClasses}
                aria-label="Licença Open Source"
                title="Licença Open Source (MIT)"
            >
                <Scale size={24} />
            </button>

            <button
                onClick={() => setWelcomeModalOpen(true)}
                className={buttonClasses}
                aria-label="Ajuda e Informações"
                title="Ajuda e Informações"
            >
                <HelpCircle size={24} />
            </button>
        </div>
      )}

      {/* Modais */}
      <WelcomeModal isOpen={isWelcomeModalOpen} onClose={() => setWelcomeModalOpen(false)} />
      <LicenseModal isOpen={isLicenseModalOpen} onClose={() => setLicenseModalOpen(false)} />
      <LegalModal isOpen={isLegalModalOpen} onClose={() => setLegalModalOpen(false)} initialTab={legalModalTab} />

      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        title="Acesso Administrativo"
      >
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuário</label>
            <Input id="admin-username" type="text" value={username} onChange={e => setUsername(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <label htmlFor="admin-password-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
            <Input id="admin-password-modal" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1" />
          </div>
          {loginError && <p className="text-sm text-red-600">{loginError}</p>}
          <div className="flex justify-end pt-2">
            <Button type="submit">Entrar</Button>
          </div>
        </form>
      </Modal>

      <footer className="absolute bottom-0 left-0 right-0 w-full p-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
              Desenvolvido pelo Laboratório de Bioinformática e Ciências Ômicas (LaBiOmicS) vinculado ao Núcleo de Pesquisas Tecnológicas (NPT) e ao Núcleo Integrado de Biotecnologia (NIB) da Universidade de Mogi das Cruzes (UMC).
          </p>
      </footer>
    </div>
  );
};

export default ParticipantFlow;
