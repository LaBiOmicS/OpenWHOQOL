import React from 'react';

/**
 * Props para o componente Card.
 */
interface CardProps {
  /** O conteúdo a ser renderizado dentro do card. */
  children: React.ReactNode;
  /** Classes CSS adicionais para aplicar ao card. */
  className?: string;
}

/**
 * Um componente de contêiner reutilizável com estilo de card.
 * Usado para agrupar visualmente conteúdo relacionado.
 */
export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};
