import React, { useState, useMemo, useEffect } from 'react';
import { Participant, SocioeconomicData } from '../../../types';
import { SOCIOECONOMIC_FIELDS } from '../../../constants';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Filter } from 'lucide-react';

/**
 * Props para o componente DescriptiveFilter.
 */
interface DescriptiveFilterProps {
  /** A lista completa de participantes para extrair as opções de filtro. */
  participants: Participant[];
  /** Função de callback a ser chamada quando um filtro é aplicado ou limpo. */
  onFilterChange: (field: keyof SocioeconomicData | null, value: string | null, fieldLabel: string | null) => void;
}

// Filtra os campos socioeconômicos para incluir apenas os de tipo 'select' (categóricos).
const categoricalFields = SOCIOECONOMIC_FIELDS.filter(f => f.type === 'select');

/**
 * Componente que fornece uma interface para filtrar a amostra de participantes
 * com base em uma característica socioeconômrica. Usado na aba de Estatísticas.
 */
const DescriptiveFilter: React.FC<DescriptiveFilterProps> = ({ participants, onFilterChange }) => {
  const [filterField, setFilterField] = useState<keyof SocioeconomicData | ''>('');
  const [filterValue, setFilterValue] = useState<string>('');
  
  // Memoiza as opções de valor disponíveis para o campo de filtro selecionado.
  const availableValues = useMemo(() => {
    if (!filterField) return [];
    const values = participants.map(p => p.socioeconomic?.[filterField]);
    return [...new Set(values)].filter((v): v is string => typeof v === 'string' && v.length > 0).sort();
  }, [filterField, participants]);
  
  // Efeito para limpar o valor selecionado sempre que o campo de filtro é alterado.
  useEffect(() => {
    setFilterValue('');
  }, [filterField]);

  /**
   * Aplica o filtro selecionado, chamando o callback `onFilterChange`.
   */
  const handleApplyFilter = () => {
    if (filterField && filterValue) {
        const fieldLabel = categoricalFields.find(f => f.id === filterField)?.label || String(filterField);
        onFilterChange(filterField, filterValue, fieldLabel);
    }
  };

  /**
   * Limpa o filtro ativo e chama o callback para mostrar todos os participantes.
   */
  const handleClearFilter = () => {
    setFilterField('');
    setFilterValue('');
    onFilterChange(null, null, null);
  };

  return (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center"><Filter size={18} className="mr-2"/> Filtro de Amostra</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="filter-field" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filtrar por Característica
          </label>
          <select
            id="filter-field"
            value={filterField}
            onChange={(e) => setFilterField(e.target.value as keyof SocioeconomicData)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          >
            <option value="">Selecione uma característica</option>
            {categoricalFields.map(field => (
              <option key={field.id} value={field.id}>{field.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Grupo Específico
          </label>
          <select
            id="filter-value"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            disabled={!filterField || availableValues.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
          >
            <option value="">Selecione um grupo</option>
            {availableValues.map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
            <Button onClick={handleApplyFilter} disabled={!filterField || !filterValue} className="flex-1">
                Aplicar Filtro
            </Button>
            <Button onClick={handleClearFilter} variant="secondary" className="flex-1">
                Mostrar Todos
            </Button>
        </div>
      </div>
    </Card>
  );
};

export default DescriptiveFilter;
