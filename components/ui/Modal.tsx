import React from 'react';
import { X } from 'lucide-react';

/**
 * Props para o componente Modal.
 */
interface ModalProps {
  /** Controla se o modal está visível ou não. */
  isOpen: boolean;
  /** Função a ser chamada quando o modal deve ser fechado (ex: clique no overlay ou no botão de fechar). */
  onClose: () => void;
  /** O título exibido no cabeçalho do modal. */
  title: string;
  /** O conteúdo principal do modal. */
  children: React.ReactNode;
  /** Conteúdo opcional para o rodapé do modal, geralmente contendo botões de ação. */
  footer?: React.ReactNode;
  /** Classes CSS adicionais para aplicar ao contêiner principal do modal. */
  className?: string;
}

/**
 * Um componente de modal acessível e reutilizável.
 * Exibe conteúdo em uma camada sobre a página principal.
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, className }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] ${className}`}
        // Impede que o clique dentro do modal o feche
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" aria-label="Fechar modal">
            <X size={24} />
          </button>
        </header>
        <main className="p-6 overflow-y-auto">{children}</main>
        {footer && <footer className="flex justify-end p-4 border-t dark:border-gray-700 flex-shrink-0">{footer}</footer>}
      </div>
    </div>
  );
};
