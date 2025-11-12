import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Shield } from 'lucide-react';
import { AdminData } from '../../types';

/**
 * Props para o componente AdminLogin.
 */
interface AdminLoginProps {
  /** Função a ser chamada quando o login for bem-sucedido. */
  onLoginSuccess: () => void;
  /** Os dados do administrador contendo o nome de usuário e senha corretos. */
  adminData: AdminData;
}

/**
 * Componente que renderiza o formulário de login para o painel administrativo.
 * Ele valida as credenciais fornecidas pelo usuário contra os dados armazenados.
 */
const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, adminData }) => {
  // O estado do nome de usuário é inicializado com o valor real para conveniência,
  // mas o usuário ainda pode alterá-lo.
  const [inputUsername, setInputUsername] = useState(adminData.username);
  // A senha só é pré-preenchida se for a senha padrão "admin" para facilitar o primeiro acesso.
  const [inputPassword, setInputPassword] =useState(adminData.password === 'admin' ? adminData.password : '');
  const [error, setError] = useState('');

  /**
   * Manipula o envio do formulário de login.
   * @param e O evento do formulário.
   */
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUsername === adminData.username && inputPassword === adminData.password) {
      setError('');
      onLoginSuccess();
    } else {
      setError('Usuário ou senha incorreta. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <Shield className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Acesso Administrativo</h1>
          <p className="text-gray-600 dark:text-gray-400">Entre com suas credenciais para gerenciar a pesquisa.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Usuário
            </label>
            <Input
              id="username"
              type="text"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              required
              className="mt-1"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              required
              className="mt-1"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
