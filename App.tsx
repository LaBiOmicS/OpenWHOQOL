import React, { useState, useEffect } from 'react';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import ParticipantFlow from './components/participant/ParticipantFlow';
import { useAppData } from './hooks/useAppData';
import { AppData, View } from './types';
import { createLogEntry } from './lib/logger';

/**
 * O componente principal da aplicação (App).
 * Atua como um roteador de alto nível, decidindo qual interface exibir:
 * o fluxo do participante ou o painel de administração.
 *
 * Gerencia o estado global da aplicação através do hook `useAppData` e
 * controla o estado de autenticação do administrador.
 */
const App: React.FC = () => {
  // Hook customizado para gerenciar os dados da aplicação (carregamento, erro, atualização).
  const { data, loading, error, updateAppData } = useAppData();
  
  // Estado que define qual visualização (participante ou admin) está ativa.
  const [view, setView] = useState<View>(View.PARTICIPANT);
  
  // Estado que controla se o administrador está autenticado.
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  /**
   * Efeito que verifica a URL na montagem do componente.
   * Se o parâmetro `?admin=true` estiver presente, muda a visualização para a de admin.
   */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      setView(View.ADMIN);
    }
  }, []);

  /**
   * Manipula o login bem-sucedido do administrador.
   * Cria um registro de log, define o estado de autenticação como verdadeiro
   * e muda a visualização para o painel de administração.
   */
  const handleLoginSuccess = async () => {
    if (data) {
      const loggedData = createLogEntry(data, 'LOGIN_SUCCESS', 'Admin logado com sucesso.');
      await updateAppData(loggedData);
    }
    setIsAdminAuthenticated(true);
    setView(View.ADMIN);
  };

  /**
   * Manipula o logout do administrador.
   * Cria um registro de log, redefine o estado de autenticação,
   * volta para a visualização do participante e limpa o parâmetro `admin` da URL.
   */
  const handleLogout = async () => {
    if (data) {
        const loggedData = createLogEntry(data, 'LOGOUT', 'Admin deslogado.');
        await updateAppData(loggedData);
    }
    setIsAdminAuthenticated(false);
    setView(View.PARTICIPANT);
    // Limpa o "?admin=true" da URL para evitar confusão.
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    window.history.pushState({}, '', url.toString());
  };

  // Exibe uma mensagem de carregamento enquanto os dados do IndexedDB estão sendo buscados.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300">Carregando dados...</p>
      </div>
    );
  }

  // Exibe uma tela de erro se houver falha ao carregar os dados.
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
         <div className="text-center">
            <h1 className="text-xl font-bold text-red-600">Erro ao Carregar a Aplicação</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Não foi possível carregar os dados. Por favor, tente recarregar a página.</p>
            <pre className="mt-4 text-xs text-left bg-gray-200 dark:bg-gray-800 p-2 rounded overflow-auto">
              <code>{error?.message}</code>
            </pre>
         </div>
      </div>
    );
  }

  // Roteamento para a visualização de administrador.
  if (view === View.ADMIN) {
    // Se não estiver autenticado, mostra a tela de login.
    if (!isAdminAuthenticated) {
      return <AdminLogin onLoginSuccess={handleLoginSuccess} adminData={data.admin} />;
    }
    // Se estiver autenticado, mostra o painel de administração.
    return <AdminDashboard appData={data} setAppData={updateAppData} onLogout={handleLogout} />;
  }

  // A visualização padrão é o fluxo do participante.
  return <ParticipantFlow appData={data} setAppData={updateAppData} onLoginSuccess={handleLoginSuccess} />;
};

export default App;
