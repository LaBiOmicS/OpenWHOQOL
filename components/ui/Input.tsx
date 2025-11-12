import React from 'react';

/**
 * Props para o componente Input.
 * Estende todos os atributos de um elemento de input HTML padrão.
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Um componente de input de texto estilizado e reutilizável.
 * Fornece uma aparência consistente em toda a aplicação.
 */
export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white';
  
  return <input className={`${baseClasses} ${className}`} {...props} />;
};
