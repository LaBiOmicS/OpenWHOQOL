
import React, { useState } from 'react';
import { AdminConfig } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { FileText, User, Mail, ShieldCheck, Info, Briefcase, BookText, ArrowRight, AlertTriangle } from 'lucide-react';
import { LegalTab } from './LegalModal';

/**
 * Props para o componente ConsentStep.
 */
interface ConsentStepProps {
  /** Função a ser chamada com a decisão do participante (true para concordo, false para discordo). */
  onConsent: (agreed: boolean) => void;
  /** Objeto de configuração da pesquisa contendo os textos e informações a serem exibidos. */
  config: AdminConfig;
  /** Função para abrir o modal legal (Política de Privacidade). */
  onOpenLegalModal: (tab: LegalTab) => void;
}

/**
 * Formata o texto do TCLE para renderizar Markdown básico (negrito e itálico) como HTML.
 * @param text O texto do TCLE.
 * @returns Um array de elementos React <p> formatados.
 */
const formatTcle = (text: string) => {
  return text
    .split('\n')
    .map((line, index) => {
      // Substitui **texto** por <strong>texto</strong>
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Substitui *texto* por <em>texto</em>
      line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Renderiza a linha dentro de um <p>, usando dangerouslySetInnerHTML para aplicar a formatação HTML
      return <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />;
    });
};

/**
 * Componente que exibe a primeira etapa do fluxo do participante: o Termo de Consentimento Livre e Esclarecido (TCLE).
 * Apresenta as informações da pesquisa e solicita o consentimento do participante.
 */
const ConsentStep: React.FC<ConsentStepProps> = ({ onConsent, config, onOpenLegalModal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Checkboxes de consentimento
  const [agreedPrivacy, setAgreedPrivacy] = useState(true);
  const [agreedRetention, setAgreedRetention] = useState(true);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [validationError, setValidationError] = useState(false);

  const handleAgree = () => {
    if (agreedPrivacy && agreedRetention && agreedTerms) {
      setValidationError(false);
      onConsent(true);
    } else {
      setValidationError(true);
    }
  };

  const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    setter(value);
    if (validationError && value) {
        // Se o usuário marcar um item enquanto o erro estiver visível, verifica se todos estão marcados para limpar o erro
        // Nota: precisamos verificar o estado atual dos outros, mas como o set state é assíncrono, apenas ocultamos se este era o único problema
        // Para simplicidade, se o usuário interagir, ocultamos o erro temporariamente até o próximo clique
        setValidationError(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          <Card>
            <div className="text-center mb-6">
              <FileText className="mx-auto h-12 w-12 text-blue-600" />
              <div className="flex items-start justify-center gap-2 mt-4">
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                    OpenWHOQOL:
                    <span className="block text-xl font-normal mt-1 text-gray-700 dark:text-gray-300">Avaliação da Qualidade de Vida com WHOQOL-BREF</span>
                 </h1>
                 <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none flex-shrink-0"
                    aria-label="Mais informações sobre WHOQOL-BREF"
                    title="Mais informações sobre WHOQOL-BREF"
                 >
                    <Info size={20} />
                 </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Por favor, leia as informações abaixo com atenção.</p>
            </div>
            
            <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 space-y-4 mb-6">
                <div className="flex items-center"><BookText size={18} className="mr-3 text-blue-500"/><strong>Projeto:</strong><span className="ml-2">{config.projectName}</span></div>
                <div className="flex items-center"><User size={18} className="mr-3 text-blue-500"/><strong>Pesquisador Responsável:</strong><span className="ml-2">{config.contactName}</span></div>
                <div className="flex items-center"><Briefcase size={18} className="mr-3 text-blue-500"/><strong>Instituição:</strong><span className="ml-2">{config.researcherInstitution}</span></div>
                <div className="flex items-center"><Mail size={18} className="mr-3 text-blue-500"/><strong>Email para Contato:</strong><span className="ml-2">{config.contactEmail}</span></div>
                <div className="flex items-center"><ShieldCheck size={18} className="mr-3 text-blue-500"/><strong>Protocolo de Aprovação CEP:</strong><span className="ml-2">{config.cepProtocol}</span></div>
            </div>
            
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 max-h-80 overflow-y-auto p-4 border rounded-md dark:border-gray-600 bg-white dark:bg-gray-800 mb-6">
               {formatTcle(config.tcle)}
            </div>

            <div className="space-y-3 mb-2 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-md border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-2">Declarações Legais Obrigatórias</h4>
                
                <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={agreedPrivacy} 
                        onChange={(e) => handleCheckboxChange(setAgreedPrivacy, e.target.checked)}
                        className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Li e concordo com a <button type="button" onClick={(e) => { e.preventDefault(); onOpenLegalModal('privacy'); }} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Política de Privacidade</button>, entendendo como meus dados serão tratados.
                    </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={agreedRetention} 
                        onChange={(e) => handleCheckboxChange(setAgreedRetention, e.target.checked)}
                        className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                         Estou ciente da <button type="button" onClick={(e) => { e.preventDefault(); onOpenLegalModal('retention'); }} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Política de Retenção de Dados</button> e do armazenamento local/remoto das informações.
                    </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={agreedTerms} 
                        onChange={(e) => handleCheckboxChange(setAgreedTerms, e.target.checked)}
                        className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Aceito os <button type="button" onClick={(e) => { e.preventDefault(); onOpenLegalModal('terms'); }} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Termos de Uso</button> e confirmo que minha participação é voluntária.
                    </span>
                </label>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 text-center">
                Utilizamos armazenamento local para o funcionamento do app. Saiba mais em <button type="button" onClick={() => onOpenLegalModal('cookies')} className="text-blue-600 dark:text-blue-400 hover:underline">Cookies e Tecnologias</button>.
            </p>

            {validationError && (
                 <div className="mb-6 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 flex items-center rounded animate-pulse">
                    <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                    <span className="text-sm font-medium">É necessário concordar com todas as políticas acima para participar da pesquisa.</span>
                 </div>
            )}
            
            <div className="mt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={() => onConsent(false)} variant="danger" className="w-full sm:w-auto">
                Não concordo e desejo sair
              </Button>
              <Button onClick={handleAgree} variant="primary" className="w-full sm:w-auto">
                Concordo e desejo participar
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Sobre o WHOQOL-BREF"
      >
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
                O <strong>WHOQOL-BREF</strong> é um instrumento abreviado desenvolvido pela Organização Mundial da Saúde (OMS) para avaliar a qualidade de vida. Ele é composto por 26 questões que cobrem quatro domínios principais: físico, psicológico, relações sociais e meio ambiente.
            </p>
            <p>
                É amplamente utilizado em pesquisas científicas em todo o mundo devido à sua confiabilidade e validade para mensurar a percepção dos indivíduos sobre sua posição na vida.
            </p>
            <div>
                <p className="font-semibold">Referência Científica (Versão em Português):</p>
                <p className="text-sm italic mt-1 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    Fleck, M. P. A., Louzada, S., Xavier, M., Chachamovich, E., Vieira, G., Santos, L., & Pinzon, V. (2000). Aplicação da versão em português do instrumento abreviado de avaliação da qualidade de vida “WHOQOL-bref”. <i>Revista de Saúde Pública, 34</i>(2), 178–183.
                </p>
            </div>
            
            <div className="pt-4 mt-4 border-t dark:border-gray-600">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1 text-blue-800 dark:text-blue-300">
                    <ShieldCheck size={16} /> Privacidade e Dados (LGPD)
                </h4>
                <p className="text-sm">
                    Sua privacidade é prioridade. Esta pesquisa está em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>. Seus dados são armazenados de forma segura e utilizados exclusivamente para fins científicos.
                </p>
                <button 
                    onClick={() => {
                        setIsModalOpen(false);
                        onOpenLegalModal('privacy');
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-2 inline-flex items-center font-medium"
                >
                    Ler Política de Privacidade Completa <ArrowRight size={14} className="ml-1" />
                </button>
            </div>
        </div>
      </Modal>
    </>
  );
};

export default ConsentStep;
