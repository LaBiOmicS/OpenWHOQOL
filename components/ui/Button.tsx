
import React from 'react';

/**
 * Props para o componente Button.
 * Estende todos os atributos de um botão HTML padrão.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * A variante de estilo do botão, define sua cor e aparência.
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'danger';
  /**
   * O tamanho do botão, afetando o padding e o tamanho da fonte.
   * @default 'default'
   */
  size?: 'default' | 'sm';
  /**
   * Define o componente como um elemento diferente (ex: 'span' para labels).
   */
  as?: React.ElementType;
}

/**
 * Um componente de botão reutilizável com variantes de estilo e tamanho.
 * Utiliza flexbox para garantir que ícones e texto fiquem alinhados horizontalmente.
 */
export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', size = 'default', as: Component = 'button', ...props }) => {
  const baseClasses = 'inline-flex flex-row items-center justify-center gap-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizeClasses = {
    default: 'px-4 py-2 text-sm',
    sm: 'px-2 py-1 text-xs',
  };

  return (
    <Component className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </Component>
  );
};
