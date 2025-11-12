

import React, { useState } from 'react';
import { AppData } from '../../types';
import { Button } from '../ui/Button';
import SetupTab from './SetupTab';
import ParticipantsTab from './ParticipantsTab';
import StatisticsTab from './StatisticsTab';
import HelpTab from './HelpTab';
import LogsTab from './LogsTab';
import GeminiAnalysisTab from './GeminiAnalysisTab';
import DatabaseTab from './DatabaseTab';
import TechnicalDocsTab from './TechnicalDocsTab';
import { SlidersHorizontal, Users, BarChart2, LogOut, HelpCircle, History, Sparkles, Database, FileCode, LifeBuoy } from 'lucide-react';
import SupportTab from './SupportTab';

/**
 * Props para o componente AdminDashboard.
 */
interface AdminDashboardProps {
  /** O objeto de dados completo da aplicação. */
  appData: AppData;
  /** Função para atualizar e persistir os dados da aplicação. */
  setAppData: (data: AppData) => Promise<void>;
  /** Função para realizar o logout do administrador. */
  onLogout: () => void;
}

/**
 * Define os tipos de abas disponíveis no painel administrativo.
 */
type Tab = 'setup' | 'participants' | 'statistics' | 'gemini' | 'help' | 'logs' | 'database' | 'techdocs' | 'support';

/**
 * O componente principal do painel administrativo.
 * Ele gerencia a navegação entre as diferentes abas de funcionalidade
 * e fornece o layout base (cabeçalho, navegação, rodapé).
 */
const AdminDashboard: React.FC<AdminDashboardProps> = ({ appData, setAppData, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('statistics');
  
  /**
   * Configuração das abas, definindo ID, rótulo e ícone para cada uma.
   * A ordem nesta lista define a ordem de exibição na interface.
   */
  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
      { id: 'statistics', label: 'Estatísticas', icon: BarChart2 },
      { id: 'participants', label: 'Participantes', icon: Users },
      { id: 'gemini', label: 'Análise com IA', icon: Sparkles },
      { id: 'database', label: 'Banco de Dados', icon: Database },
      { id: 'setup', label: 'Configuração', icon: SlidersHorizontal },
      { id: 'logs', label: 'Logs', icon: History },
      { id: 'support', label: 'Suporte', icon: LifeBuoy },
      { id: 'help', label: 'Ajuda & Doc.', icon: HelpCircle },
      { id: 'techdocs', label: 'Doc. Técnica', icon: FileCode },
  ];

  /**
   * Renderiza o conteúdo da aba atualmente ativa.
   * @returns O componente da aba correspondente ou null.
   */
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'setup':
        return <SetupTab appData={appData} setAppData={setAppData} />;
      case 'participants':
        return <ParticipantsTab appData={appData} setAppData={setAppData} />;
      case 'statistics':
        return <StatisticsTab participants={appData.participants} />;
      case 'gemini':
        return <GeminiAnalysisTab appData={appData} setAppData={setAppData} />;
      case 'database':
        return <DatabaseTab appData={appData} setAppData={setAppData} />;
      case 'logs':
        return <LogsTab appData={appData} setAppData={setAppData} />;
      case 'support':
        return <SupportTab />;
      case 'help':
        return <HelpTab />;
      case 'techdocs':
        return <TechnicalDocsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <Button onClick={onLogout} variant="secondary">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {/* Alerta de segurança se a senha padrão "admin" ainda estiver em uso. */}
        {appData.admin.password === 'admin' && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
            <p className="font-bold">Aviso de Segurança</p>
            <p>Sua senha é a padrão ("admin"). É altamente recomendável que você a altere na aba de <button onClick={() => setActiveTab('setup')} className="font-bold underline hover:text-yellow-800 focus:outline-none">Configuração</button> para proteger seus dados.</p>
          </div>
        )}

        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
            <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                {TABS.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    title={tab.label}
                    className={`${
                    activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    } flex items-center justify-center py-4 px-4 border-b-2 font-medium text-sm transition-colors`}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                    <tab.icon className="h-5 w-5" />
                    <span className="sr-only">{tab.label}</span>
                </button>
                ))}
            </nav>
        </div>
        
        <div>{renderActiveTab()}</div>
      </main>
      
      <footer className="bg-white dark:bg-gray-800 text-center py-4 mt-8 border-t dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-4xl mx-auto px-4">
          Desenvolvido pelo Laboratório de Bioinformática e Ciências Ômicas (LaBiOmicS) vinculado ao Núcleo de Pesquisas Tecnológicas (NPT) e ao Núcleo Integrado de Biotecnologia (NIB) da Universidade de Mogi das Cruzes (UMC).
        </p>
      </footer>
    </div>
  );
};

export default AdminDashboard;