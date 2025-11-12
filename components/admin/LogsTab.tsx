
import React, { useState } from 'react';
import { AppData } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { StyledTable, StyledThead, StyledTh, StyledTbody, StyledTd } from './shared/TableComponents';
import { createLogEntry } from '../../lib/logger';
import { Trash2 } from 'lucide-react';

/**
 * Props para o componente LogsTab.
 */
interface LogsTabProps {
  appData: AppData;
  setAppData: (data: AppData) => Promise<void>;
}

/**
 * Mapeamento de identificadores de ação para rótulos legíveis por humanos.
 */
const ACTION_LABELS: { [key: string]: string } = {
    LOGIN_SUCCESS: 'Login de Admin',
    LOGOUT: 'Logout de Admin',
    CONFIG_UPDATED: 'Configuração Salva',
    CREDENTIALS_UPDATED: 'Credenciais Alteradas',
    PARTICIPANTS_CLEARED: 'Participantes Limpos',
    TEST_DATA_ADDED: 'Dados de Teste Adicionados',
    TEST_DATA_REPLACED: 'Dados de Teste Substituídos',
    DATA_IMPORTED_JSON: 'Backup JSON Importado',
    PARTICIPANTS_IMPORTED_FILE: 'Participantes Importados',
    PARTICIPANT_ARCHIVED: 'Participante Arquivado',
    PARTICIPANT_REACTIVATED: 'Participante Reativado',
    ARCHIVED_DELETED: 'Arquivados Excluídos',
    LOGS_CLEARED: 'Logs Limpos',
    GEMINI_KEY_UPDATED: 'Chave de API do Gemini Salva',
    GEMINI_KEY_REMOVED: 'Chave de API do Gemini Removida',
};

/**
 * Componente que renderiza a aba "Logs", exibindo um registro de auditoria
 * das ações administrativas realizadas na ferramenta.
 */
const LogsTab: React.FC<LogsTabProps> = ({ appData, setAppData }) => {
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const logs = appData.logs || [];

  /**
   * Limpa todos os logs de auditoria, exceto por um novo registro que documenta a própria ação de limpeza.
   */
  const handleClearLogs = async () => {
    // Cria um novo log para a ação de limpeza.
    const dataWithLog = createLogEntry(appData, 'LOGS_CLEARED', `Todos os ${logs.length} logs de auditoria foram limpos.`);
    // Substitui a lista de logs antiga por uma nova contendo apenas o log da limpeza.
    dataWithLog.logs = [dataWithLog.logs[0]];
    
    await setAppData(dataWithLog);
    setIsClearModalOpen(false);
  };
  
  /**
   * Formata a coluna de detalhes para exibição. Se os detalhes forem um objeto,
   * ele é formatado como uma string JSON para legibilidade.
   * @param details O conteúdo da coluna de detalhes.
   * @returns O conteúdo formatado como string ou JSX.
   */
  const formatDetails = (details: any) => {
    if (!details) return '—';
    if (typeof details === 'string') return details;
    if (typeof details === 'object' && details !== null) {
      return <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto"><code>{JSON.stringify(details, null, 2)}</code></pre>;
    }
    return String(details);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div>
                <h2 className="text-xl font-semibold">Logs de Auditoria</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Um registro das ações administrativas realizadas nesta ferramenta.</p>
            </div>
            <Button 
                variant="danger" 
                onClick={() => setIsClearModalOpen(true)} 
                disabled={logs.length === 0}
            >
                <Trash2 size={16} />
                Limpar Logs
            </Button>
        </div>
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <StyledTable>
                <StyledThead>
                    <StyledTh>Data e Hora</StyledTh>
                    <StyledTh>Ação</StyledTh>
                    <StyledTh>Detalhes</StyledTh>
                </StyledThead>
                <StyledTbody>
                {logs.map(log => (
                    <tr key={log.id}>
                    <StyledTd className="whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</StyledTd>
                    <StyledTd className="font-medium">{ACTION_LABELS[log.action] || log.action}</StyledTd>
                    <StyledTd>{formatDetails(log.details)}</StyledTd>
                    </tr>
                ))}
                </StyledTbody>
            </StyledTable>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Nenhum log de auditoria encontrado.</p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Confirmar Limpeza de Logs"
        footer={
          <div className="space-x-2">
            <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleClearLogs}>Sim, Limpar Logs</Button>
          </div>
        }
      >
        <p className="text-gray-800 dark:text-gray-200">
            Você tem certeza que deseja limpar <strong>TODOS</strong> os logs de auditoria? Esta ação é irreversível e será registrada como a única entrada restante.
        </p>
      </Modal>
    </div>
  );
};

export default LogsTab;
