
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Lock, Database, FileText, Cookie } from 'lucide-react';

export type LegalTab = 'privacy' | 'retention' | 'terms' | 'cookies';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, initialTab = 'privacy' }) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  // Atualiza a aba ativa quando o modal é aberto ou a prop initialTab muda
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'privacy':
        return (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Lock className="w-5 h-5 text-blue-600"/> Política de Privacidade</h3>
            <p>O <strong>OpenWHOQOL</strong> está comprometido em proteger sua privacidade durante a participação nesta pesquisa.</p>
            
            <h4 className="font-semibold mt-4">1. Coleta de Dados</h4>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Dados Fornecidos:</strong> Coletamos apenas as informações que você fornece voluntariamente nos formulários socioeconômico e WHOQOL-BREF.</li>
              <li><strong>Dados Pessoais:</strong> Não coletamos obrigatoriamente identificadores diretos (como CPF ou RG). O fornecimento de e-mail é opcional.</li>
            </ul>

            <h4 className="font-semibold mt-4">2. Uso de Inteligência Artificial</h4>
            <p>Este estudo pode utilizar ferramentas de Inteligência Artificial (como Google Gemini) para auxiliar na análise estatística e qualitativa dos dados.</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Os dados enviados para análise são anonimizados ou agregados sempre que possível.</li>
                <li>A IA é utilizada apenas para fins de pesquisa e interpretação de resultados, não para tomada de decisões automatizadas que afetem você individualmente.</li>
            </ul>

            <h4 className="font-semibold mt-4">3. Uso das Informações</h4>
            <p>Os dados são utilizados exclusivamente para fins acadêmicos, científicos e estatísticos. Resultados agregados podem ser publicados em artigos ou congressos, sempre garantindo que nenhum participante possa ser identificado individualmente.</p>

            <h4 className="font-semibold mt-4">4. Base Legal</h4>
            <p>O tratamento de dados é realizado em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018), fundamentado no interesse público e na realização de estudos por órgão de pesquisa.</p>
          </div>
        );
      case 'retention':
        return (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Database className="w-5 h-5 text-purple-600"/> Retenção de Dados</h3>
            
            <h4 className="font-semibold mt-4">1. Armazenamento Local</h4>
            <p>Primariamente, suas respostas são salvas no banco de dados interno do seu navegador (IndexedDB) neste dispositivo. Estes dados persistem até que o cache do navegador seja limpo.</p>

            <h4 className="font-semibold mt-4">2. Sincronização Externa</h4>
            <p>Se esta instância do OpenWHOQOL estiver configurada para sincronizar com um servidor de pesquisa central, seus dados anonimizados serão transmitidos de forma segura (criptografia SSL/TLS).</p>

            <h4 className="font-semibold mt-4">3. Tempo de Retenção</h4>
            <p>Os dados da pesquisa serão mantidos pelo período necessário para a conclusão do estudo e eventuais auditorias científicas, tipicamente por 5 anos após a publicação dos resultados, sendo posteriormente anonimizados ou excluídos de forma segura.</p>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-green-600"/> Termos de Uso</h3>
            
            <h4 className="font-semibold mt-4">1. Natureza da Participação</h4>
            <p>Sua participação é voluntária e não remunerada. Você tem o direito de desistir a qualquer momento sem prejuízo.</p>

            <h4 className="font-semibold mt-4">2. Veracidade das Informações</h4>
            <p>Ao participar, você concorda em fornecer respostas verdadeiras e que reflitam sua percepção pessoal, essenciais para a validade científica do estudo.</p>

            <h4 className="font-semibold mt-4">3. Propriedade Intelectual</h4>
            <p>O instrumento WHOQOL-BREF é propriedade da Organização Mundial da Saúde (OMS). Esta aplicação é uma ferramenta de administração e não reivindica propriedade sobre o instrumento em si.</p>
            
            <h4 className="font-semibold mt-4">4. Isenção de Responsabilidade</h4>
            <p>Esta ferramenta é destinada à pesquisa e não substitui diagnóstico ou aconselhamento médico profissional. Se você estiver em sofrimento psíquico, procure ajuda profissional.</p>
          </div>
        );
      case 'cookies':
        return (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Cookie className="w-5 h-5 text-orange-600"/> Cookies e Tecnologias</h3>
              
              <p>Esta aplicação utiliza tecnologias de armazenamento local estritamente necessárias para seu funcionamento.</p>
  
              <h4 className="font-semibold mt-4">1. O que utilizamos?</h4>
              <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>IndexedDB:</strong> Um banco de dados no seu navegador usado para salvar suas respostas com segurança, permitindo que o aplicativo funcione mesmo sem internet.</li>
                  <li><strong>LocalStorage:</strong> Usado para armazenar configurações de preferência (como o tema claro/escuro) e estado da sessão.</li>
              </ul>
  
              <h4 className="font-semibold mt-4">2. Finalidade</h4>
              <p>Estas tecnologias são utilizadas exclusivamente para garantir a integridade dos dados da pesquisa e a funcionalidade da interface. <strong>Não utilizamos cookies de terceiros para rastreamento publicitário ou marketing.</strong></p>
  
              <h4 className="font-semibold mt-4">3. Controle</h4>
              <p>Você pode limpar esses dados a qualquer momento através das configurações do seu navegador (opção "Limpar dados de navegação"), mas isso resultará na perda das respostas não enviadas.</p>
            </div>
          );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Informações Legais"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      }
    >
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'privacy' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          Privacidade
        </button>
        <button
          onClick={() => setActiveTab('retention')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'retention' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          Retenção
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'terms' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          Termos
        </button>
        <button
          onClick={() => setActiveTab('cookies')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'cookies' ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          Cookies & Tec.
        </button>
      </div>
      <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed min-h-[300px]">
        {renderContent()}
      </div>
    </Modal>
  );
};

export default LegalModal;
