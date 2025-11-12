
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppData, Participant, DomainScores, SocioeconomicData } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Eye, Archive, UserCheck, Filter, ChevronDown, Trash2, Info } from 'lucide-react';
import { calculateDomainScores } from '../../lib/whoqol';
import { SOCIOECONOMIC_FIELDS, WHOQOL_QUESTIONS, DOMAIN_LABELS } from '../../constants';
import { Card } from '../ui/Card';
import { exportToCsv, exportToTsv, exportToXls, ScoreBadge } from './shared/TableComponents';
import { Input } from '../ui/Input';
import { createLogEntry } from '../../lib/logger';

/**
 * Props para o componente ParticipantsTab.
 */
interface ParticipantsTabProps {
  appData: AppData;
  setAppData: (data: AppData) => Promise<void>;
}

const PARTICIPANTS_PER_PAGE = 50;

/**
 * Define todas as colunas possíveis para a tabela de participantes.
 */
const ALL_COLUMNS = [
    { id: 'id', label: 'ID do Participante' },
    { id: 'submittedAt', label: 'Data de Envio' },
    { id: 'status', label: 'Status' },
    ...SOCIOECONOMIC_FIELDS.map(field => ({ id: field.id, label: field.label })),
    ...Object.keys(DOMAIN_LABELS).map(key => ({ id: `score_${key}`, label: `Escore ${DOMAIN_LABELS[key]}` })),
];

/**
 * Mascara um endereço de e-mail para proteger a privacidade.
 * Ex: "usuario@dominio.com" -> "u***o@d***o.com"
 * @param email O e-mail a ser mascarado.
 * @returns O e-mail mascarado ou "Não informado".
 */
const maskEmail = (email?: string | null): string => {
  if (!email) {
    return 'Não informado';
  }
  const parts = email.split('@');
  if (parts.length !== 2) {
    return email.length > 4 ? `${email.substring(0, 2)}***${email.slice(-1)}` : '****';
  }
  
  const [localPart, domainPart] = parts;
  const mask = (str: string) => {
    if (str.length <= 1) return '*';
    if (str.length <= 3) return `${str[0]}*${str.slice(-1)}`;
    return `${str[0]}***${str.slice(-1)}`;
  };

  const maskedLocalPart = mask(localPart);
  const lastDotIndex = domainPart.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0 || lastDotIndex === domainPart.length - 1) {
    return `${maskedLocalPart}@${mask(domainPart)}`;
  }
  
  const domainName = domainPart.substring(0, lastDotIndex);
  const tld = domainPart.substring(lastDotIndex);
  
  return `${maskedLocalPart}@${mask(domainName)}${tld}`;
};

/**
 * Componente que renderiza a aba "Participantes" do painel de administração.
 * Permite visualizar, filtrar, paginar e gerenciar os dados dos participantes.
 */
const ParticipantsTab: React.FC<ParticipantsTabProps> = ({ appData, setAppData }) => {
  // Estado para modais e seleções
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [exclusionReason, setExclusionReason] = useState('');
  
  // Estado para a tabela e filtros
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['id', 'status']);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const columnSelectorRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    id: '',
    socioeconomicField: '',
    socioeconomicValue: '',
  });
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>(appData.participants);
  const [currentPage, setCurrentPage] = useState(1);
  
  const archivedParticipantsCount = useMemo(() => appData.participants.filter(p => p.isExcluded).length, [appData.participants]);
  const categoricalSocioeconomicFields = SOCIOECONOMIC_FIELDS.filter(field => field.type === 'select');

  // Efeito para aplicar filtros sempre que o estado dos filtros ou os dados dos participantes mudarem.
  useEffect(() => {
    let participants = [...appData.participants];

    if (filters.status === 'included') participants = participants.filter(p => !p.isExcluded);
    if (filters.status === 'excluded') participants = participants.filter(p => p.isExcluded);
    
    if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setUTCHours(0, 0, 0, 0);
        participants = participants.filter(p => new Date(p.submittedAt) >= startDate);
    }
    if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setUTCHours(23, 59, 59, 999);
        participants = participants.filter(p => new Date(p.submittedAt) <= endDate);
    }

    if (filters.id.trim()) participants = participants.filter(p => p.id.toLowerCase().startsWith(filters.id.trim().toLowerCase()));

    if (filters.socioeconomicField && filters.socioeconomicValue) {
        participants = participants.filter(p => 
            p.socioeconomic?.[filters.socioeconomicField as keyof SocioeconomicData] === filters.socioeconomicValue
        );
    }

    setFilteredParticipants(participants);
    setCurrentPage(1); // Reseta a paginação ao aplicar filtros
  }, [filters, appData.participants]);

  // Efeito para fechar o seletor de colunas ao clicar fora dele.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) {
            setIsColumnSelectorOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  /**
   * Manipula mudanças nos campos de filtro.
   */
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => {
        const newFilters = { ...prev, [name]: value };
        if (name === 'socioeconomicField') {
            newFilters.socioeconomicValue = ''; // Reseta o valor ao trocar o campo
        }
        return newFilters;
    });
  };
  
  const handleToggleColumn = (id: string) => {
    setVisibleColumns(prev => 
        prev.includes(id) ? prev.filter(colId => colId !== id) : [...prev, id]
    );
  };
  
  const handleClearFilters = () => {
    setFilters({ status: 'all', startDate: '', endDate: '', id: '', socioeconomicField: '', socioeconomicValue: '' });
  };

  const openDetailModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsDetailModalOpen(true);
  };

  const openArchiveModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsArchiveModalOpen(true);
  };

  /**
   * Arquiva um participante, marcando-o como excluído e adicionando um motivo.
   */
  const handleArchiveParticipant = async () => {
    if (selectedParticipant) {
      const details = { participantId: selectedParticipant.id, reason: exclusionReason };
      const dataWithLog = createLogEntry(appData, 'PARTICIPANT_ARCHIVED', details);
      const updatedParticipants = dataWithLog.participants.map(p =>
        p.id === selectedParticipant.id ? { ...p, isExcluded: true, exclusionReason } : p
      );
      await setAppData({ ...dataWithLog, participants: updatedParticipants });
      setIsArchiveModalOpen(false);
      setExclusionReason('');
      setSelectedParticipant(null);
    }
  };

  /**
   * Reativa um participante previamente arquivado.
   */
  const handleReactivateParticipant = async (participant: Participant) => {
    const details = { participantId: participant.id };
    const dataWithLog = createLogEntry(appData, 'PARTICIPANT_REACTIVATED', details);
    const updatedParticipants = dataWithLog.participants.map(p =>
      p.id === participant.id ? { ...p, isExcluded: false, exclusionReason: null } : p
    );
    await setAppData({ ...dataWithLog, participants: updatedParticipants });
  };
  
  /**
   * Exclui permanentemente todos os participantes que estão arquivados.
   */
  const handlePermanentDelete = async () => {
    const details = { count: archivedParticipantsCount };
    const dataWithLog = createLogEntry(appData, 'ARCHIVED_DELETED', details);
    const updatedParticipants = dataWithLog.participants.filter(p => !p.isExcluded);
    await setAppData({ ...dataWithLog, participants: updatedParticipants });
    setIsDeleteModalOpen(false);
  };

  // Memoiza o cálculo da paginação
  const { paginatedParticipants, totalPages } = useMemo(() => {
    const total = filteredParticipants.length;
    const pages = Math.ceil(total / PARTICIPANTS_PER_PAGE);
    const startIndex = (currentPage - 1) * PARTICIPANTS_PER_PAGE;
    return {
      paginatedParticipants: filteredParticipants.slice(startIndex, startIndex + PARTICIPANTS_PER_PAGE),
      totalPages: pages
    };
  }, [filteredParticipants, currentPage]);

  // Memoiza o cálculo dos escores de domínio para evitar recálculos desnecessários
  const participantScores = useMemo(() => {
    const scoresMap = new Map<string, DomainScores>();
    filteredParticipants.forEach(p => {
      if (p.whoqol) {
        scoresMap.set(p.id, calculateDomainScores(p.whoqol));
      }
    });
    return scoresMap;
  }, [filteredParticipants]);

  /**
   * Renderiza o conteúdo de uma célula da tabela com base no ID da coluna.
   */
  const renderCellContent = (participant: Participant, columnId: string) => {
    if (columnId === 'id') return <span title={participant.id}>{participant.id.substring(0, 8)}</span>;
    if (columnId === 'submittedAt') return new Date(participant.submittedAt).toLocaleString('pt-BR');
    if (columnId === 'status') {
        return participant.isExcluded 
          ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Arquivado</span>
          : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Incluído</span>;
    }
    if (columnId.startsWith('score_')) {
        const scores = participantScores.get(participant.id);
        if (!scores) return 'N/A';
        const scoreKey = columnId.replace('score_', '') as keyof DomainScores;
        const scoreValue = scores[scoreKey];
        if (isNaN(scoreValue)) return 'N/A';
        return <ScoreBadge score={scoreValue} size="xs" />;
    }
    
    const socioeconomicValue = participant.socioeconomic?.[columnId as keyof SocioeconomicData];
    return socioeconomicValue ?? 'N/A';
  };

  /**
   * Prepara e aciona o download dos dados em um formato específico.
   */
  const handleExport = (participantsToExport: Participant[], filenameBase: string, format: 'csv' | 'tsv' | 'xls') => {
    const headers = ALL_COLUMNS.map(c => c.label);
    const rows = participantsToExport.map(p => {
        const scores = p.whoqol ? calculateDomainScores(p.whoqol) : null;
        return ALL_COLUMNS.map(col => {
            if (col.id === 'id') return p.id;
            if (col.id === 'submittedAt') return p.submittedAt;
            if (col.id === 'status') return p.isExcluded ? 'Arquivado' : 'Incluído';
            if (col.id.startsWith('score_')) {
                const key = col.id.replace('score_', '') as keyof DomainScores;
                return scores ? scores[key] : 'N/A';
            }
            return p.socioeconomic?.[col.id as keyof SocioeconomicData] || '';
        });
    });
    
    const filename = `${filenameBase}.${format === 'xls' ? 'xls' : format}`;
    if (format === 'csv') exportToCsv(headers, rows, filename);
    if (format === 'tsv') exportToTsv(headers, rows, filename);
    if (format === 'xls') exportToXls(headers, rows, filename);
  };
  
  const handleExportFiltered = (format: 'csv' | 'tsv' | 'xls') => handleExport(filteredParticipants, `whoqol_export_filtrado_${new Date().toISOString().split('T')[0]}`, format);
  const handleExportSingle = (participant: Participant, format: 'csv' | 'tsv' | 'xls') => handleExport([participant], `whoqol_export_${participant.id.substring(0,8)}`, format);

  /**
   * Renderiza a seção de escores no modal de detalhes do participante.
   */
  const renderScores = (participant: Participant) => {
    if (!participant.whoqol) return <p>Questionário WHOQOL não preenchido.</p>;
    const scores = calculateDomainScores(participant.whoqol);
    const regularDomains: (keyof DomainScores)[] = ['physical', 'psychological', 'social', 'environment', 'overall'];

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {regularDomains.map((domain) => (
            <div key={domain} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{DOMAIN_LABELS[domain] || domain}</span>
              <ScoreBadge score={scores[domain]} />
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                <span className="font-semibold text-gray-800 dark:text-gray-200">Qualidade de Vida Média*</span>
                <ScoreBadge score={scores.qualidadeDeVidaMedia} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center italic">
                *Média aritmética ilustrativa dos 4 domínios (Físico, Psicológico, Social, Meio Ambiente). Não é um valor oficial do WHOQOL-BREF.
            </p>
        </div>
      </>
    );
  };
  
  if (appData.participants.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Nenhum Participante Encontrado</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Ainda não há dados de participantes para exibir.</p>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-300">
            Para testar a visualização e as funcionalidades, você pode gerar dados de teste na aba de <strong>Banco de Dados</strong>.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
       <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center"><Filter size={18} className="mr-2"/> Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="id-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID do Participante</label>
              <Input id="id-filter" name="id" value={filters.id} onChange={handleFilterChange} placeholder="Começa com..." />
            </div>
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select id="status-filter" name="status" value={filters.status} onChange={handleFilterChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                <option value="all">Todos</option>
                <option value="included">Incluído</option>
                <option value="excluded">Arquivado</option>
              </select>
            </div>
            <div>
              <label htmlFor="start-date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Início</label>
              <Input id="start-date-filter" name="startDate" type="date" value={filters.startDate} onChange={handleFilterChange} />
            </div>
            <div>
              <label htmlFor="end-date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Final</label>
              <Input id="end-date-filter" name="endDate" type="date" value={filters.endDate} onChange={handleFilterChange} />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-end">
            <div>
                <label htmlFor="socioeconomic-field-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtro Socioeconômico</label>
                <select 
                    id="socioeconomic-field-filter" 
                    name="socioeconomicField" 
                    value={filters.socioeconomicField} 
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                >
                    <option value="">Selecione um campo</option>
                    {categoricalSocioeconomicFields.map(field => (
                        <option key={field.id} value={field.id}>{field.label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="socioeconomic-value-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
                <select 
                    id="socioeconomic-value-filter" 
                    name="socioeconomicValue" 
                    value={filters.socioeconomicValue} 
                    onChange={handleFilterChange}
                    disabled={!filters.socioeconomicField}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    <option value="">Selecione um valor</option>
                    {filters.socioeconomicField &&
                        (categoricalSocioeconomicFields.find(f => f.id === filters.socioeconomicField)?.options ?? []).map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))
                    }
                </select>
            </div>
        </div>
        <div className="mt-4 flex justify-end">
            <Button onClick={handleClearFilters} variant="secondary">Limpar Filtros</Button>
        </div>
      </Card>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200 p-4 rounded-md shadow-sm text-sm" role="status">
        <div className="flex">
            <div className="flex-shrink-0">
                <Info className="h-5 w-5" />
            </div>
            <div className="ml-3">
                <p>
                    <strong>Dica:</strong> Use a ação de <strong>Arquivar</strong> (<Archive className="inline h-4 w-4" />) para remover um participante das análises na aba "Estatísticas". Participantes arquivados podem ser reativados (<UserCheck className="inline h-4 w-4" />) e não são excluídos permanentemente.
                </p>
            </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Encontrados <strong>{filteredParticipants.length}</strong> de <strong>{appData.participants.length}</strong> participantes.
        </p>
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative" ref={columnSelectorRef}>
                <Button onClick={() => setIsColumnSelectorOpen(prev => !prev)} variant="secondary" size="sm">
                    Colunas <ChevronDown size={16} />
                </Button>
                {isColumnSelectorOpen && (
                    <div className="absolute z-10 mt-2 w-80 right-0 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="p-2 grid grid-cols-2 gap-1 max-h-96 overflow-y-auto">
                            {ALL_COLUMNS.map(col => (
                                <label key={col.id} className="flex items-center space-x-2 px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns.includes(col.id)}
                                        onChange={() => handleToggleColumn(col.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>{col.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
                <span className="text-sm font-medium">Exportar:</span>
                <Button variant="secondary" size="sm" onClick={() => handleExportFiltered('csv')}>CSV</Button>
                <Button variant="secondary" size="sm" onClick={() => handleExportFiltered('tsv')}>TSV</Button>
                <Button variant="secondary" size="sm" onClick={() => handleExportFiltered('xls')}>XLS</Button>
            </div>
        </div>
      </div>
      
      {filteredParticipants.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {visibleColumns.map(colId => {
                      const col = ALL_COLUMNS.find(c => c.id === colId);
                      return <th key={colId} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{col?.label}</th>;
                  })}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedParticipants.map(p => (
                  <tr key={p.id} className={p.isExcluded ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                    {visibleColumns.map(colId => (
                        <td key={colId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {renderCellContent(p, colId)}
                        </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => openDetailModal(p)} className="text-blue-600 hover:text-blue-900" title="Ver Detalhes"><Eye size={18} /></button>
                      {p.isExcluded ? (
                        <button onClick={() => handleReactivateParticipant(p)} className="text-green-600 hover:text-green-900" title="Reativar Participante"><UserCheck size={18} /></button>
                      ) : (
                        <button onClick={() => openArchiveModal(p)} className="text-yellow-600 hover:text-yellow-900" title="Arquivar Participante"><Archive size={18} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 px-4 py-3 border-t dark:border-gray-700">
                    <Button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        variant="secondary"
                    >
                        Anterior
                    </Button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Página {currentPage} de {totalPages}
                    </span>
                    <Button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        variant="secondary"
                    >
                        Próximo
                    </Button>
                </div>
            )}
        </div>
      ) : (
         <Card>
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Nenhum Resultado Encontrado</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Nenhum participante corresponde aos filtros aplicados.</p>
              <Button onClick={handleClearFilters} variant="secondary" className="mt-4">
                  Limpar Filtros
              </Button>
            </div>
          </Card>
      )}

      <Card className="mt-8 border-red-500 border-2">
        <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Zona de Risco</h3>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div>
                <p className="font-medium">Excluir Participantes Arquivados</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Esta ação irá apagar permanentemente todos os <strong>{archivedParticipantsCount}</strong> participantes arquivados. Esta ação é irreversível.
                </p>
            </div>
            <Button 
                variant="danger" 
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={archivedParticipantsCount === 0}
            >
                <Trash2 size={16} />
                Excluir Permanentemente
            </Button>
        </div>
      </Card>

      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        title="Detalhes do Participante"
        footer={
          selectedParticipant && (
            <div className="flex justify-end w-full">
               <div className="flex items-center space-x-1">
                    <Button variant="secondary" size="sm" onClick={() => handleExportSingle(selectedParticipant, 'csv')}>CSV</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleExportSingle(selectedParticipant, 'tsv')}>TSV</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleExportSingle(selectedParticipant, 'xls')}>XLS</Button>
                </div>
            </div>
          )
        }
        >
        {selectedParticipant && (
          <div className="text-sm text-gray-800 dark:text-gray-200 space-y-4">
            <div><strong>ID:</strong> {selectedParticipant.id}</div>
            <div><strong>Data:</strong> {new Date(selectedParticipant.submittedAt).toLocaleString()}</div>
            <div><strong>Email de Contato:</strong> {maskEmail(selectedParticipant.contactEmail)}</div>
            {selectedParticipant.assistedFillOut !== undefined && (
                <div><strong>Auxiliado no preenchimento:</strong> {selectedParticipant.assistedFillOut ? 'Sim' : 'Não'}</div>
            )}
            {selectedParticipant.timeToCompleteMinutes !== undefined && (
                <div><strong>Tempo para completar:</strong> {Math.round(selectedParticipant.timeToCompleteMinutes)} minuto(s)</div>
            )}
            {selectedParticipant.isExcluded && (
              <div><strong>Motivo do Arquivamento:</strong> {selectedParticipant.exclusionReason}</div>
            )}
            
            <div className="pt-4 mt-4 border-t dark:border-gray-600">
                <h3 className="font-semibold text-md mb-2">Dados Socioeconômicos</h3>
                <ul className="space-y-1">
                  {selectedParticipant.socioeconomic && SOCIOECONOMIC_FIELDS.map(field => (
                    <li key={field.id}><strong>{field.label}:</strong> {selectedParticipant.socioeconomic?.[field.id] ?? 'Não informado'}</li>
                  ))}
                </ul>
            </div>
             <div className="pt-4 mt-4 border-t dark:border-gray-600">
                <h3 className="font-semibold text-md mb-2">Scores WHOQOL-BREF</h3>
                {renderScores(selectedParticipant)}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        title="Arquivar Participante"
        footer={
          <div className="space-x-2">
            <Button variant="secondary" onClick={() => setIsArchiveModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleArchiveParticipant}>Confirmar Arquivamento</Button>
          </div>
        }
      >
        <p className="text-gray-800 dark:text-gray-200 mb-4">Por favor, informe o motivo do arquivamento. O participante não será removido permanentemente, mas não será incluído nos cálculos estatísticos.</p>
        <textarea
          value={exclusionReason}
          onChange={(e) => setExclusionReason(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Ex: Não atende aos critérios de inclusão..."
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão Permanente"
        footer={
          <div className="space-x-2">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handlePermanentDelete}>Sim, Excluir Permanentemente</Button>
          </div>
        }
      >
        <p className="text-gray-800 dark:text-gray-200">
          Você está prestes a excluir permanentemente <strong>{archivedParticipantsCount}</strong> participante(s) arquivado(s).
          Esta ação é <strong>irreversível</strong> e os dados não poderão ser recuperados. Deseja continuar?
        </p>
      </Modal>
    </div>
  );
};

export default ParticipantsTab;
