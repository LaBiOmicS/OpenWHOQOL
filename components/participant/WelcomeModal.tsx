
import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bem-vindo ao OpenWHOQOL"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-gray-700 dark:text-gray-300">
        <p>
          O <strong>OpenWHOQOL</strong> é uma ferramenta de pesquisa projetada para coletar dados sobre a qualidade de vida utilizando o questionário <strong>WHOQOL-BREF</strong>, desenvolvido pela Organização Mundial da Saúde (OMS).
        </p>
        <p>
          Sua participação é valiosa e contribuirá para o conhecimento científico. O processo é simples, rápido e totalmente confidencial.
        </p>
        <div className="pt-4 mt-4 border-t dark:border-gray-600">
          <h3 className="font-semibold text-md mb-2">Como participar:</h3>
          <ul className="list-decimal list-inside space-y-2">
            <li>
              <strong>Termo de Consentimento:</strong> Leia atentamente as informações sobre a pesquisa e, se concordar, aceite os termos para prosseguir.
            </li>
            <li>
              <strong>Questionário Socioeconômico:</strong> Preencha algumas informações básicas para que possamos caracterizar o perfil dos participantes.
            </li>
            <li>
              <strong>Questionário WHOQOL-BREF:</strong> Responda às 26 questões sobre sua percepção da qualidade de vida nas últimas duas semanas.
            </li>
            <li>
              <strong>Finalização:</strong> Ao concluir, você terá a opção de fornecer um e-mail para ser contatado sobre os resultados da pesquisa. Este passo é opcional.
            </li>
          </ul>
        </div>
        <div className="pt-4 mt-4 border-t dark:border-gray-600">
           <p className="text-sm">
              <strong>Privacidade e Segurança:</strong> Em conformidade com a LGPD, seus dados serão tratados com confidencialidade. Os dados são armazenados localmente neste dispositivo e podem ser sincronizados com base de dados externa segura para fins científicos, dependendo da configuração do estudo, sempre mantendo o anonimato.
           </p>
        </div>
         <div className="pt-4 mt-4 border-t dark:border-gray-600">
           <p className="text-sm">
              <strong>Desenvolvimento:</strong> Esta ferramenta foi desenvolvida pelo Laboratório de Bioinformática e Ciências Ômicas (LaBiOmicS) da Universidade de Mogi das Cruzes.
           </p>
        </div>
      </div>
    </Modal>
  );
};

export default WelcomeModal;
