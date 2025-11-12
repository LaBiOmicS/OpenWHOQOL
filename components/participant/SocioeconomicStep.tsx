import React, { useState } from 'react';
import { SocioeconomicData, AdminConfig } from '../../types';
import { SOCIOECONOMIC_FIELDS, INITIAL_SOCIOECONOMIC_DATA } from '../../constants';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';

interface SocioeconomicStepProps {
  onSubmit: (data: SocioeconomicData) => void;
  config: AdminConfig;
}

const SocioeconomicStep: React.FC<SocioeconomicStepProps> = ({ onSubmit, config }) => {
  const [data, setData] = useState<SocioeconomicData>(INITIAL_SOCIOECONOMIC_DATA);
  const [isAgeModalOpen, setAgeModalOpen] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;
    
    if (name === 'age') {
        parsedValue = value === '' ? '' : parseInt(value, 10);
    }
    
    setData(prev => ({ ...prev, [name]: parsedValue }));
    
    // Clear error when user types
    if (errors.includes(name)) {
        setErrors(prev => prev.filter(f => f !== name));
    }
  };

  const validate = () => {
    const newErrors: string[] = [];
    SOCIOECONOMIC_FIELDS.forEach(field => {
        const val = data[field.id as keyof SocioeconomicData];
        if (val === '' || val === undefined) {
            newErrors.push(field.id);
        }
    });
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
        if (typeof data.age === 'number' && data.age < 18 && config.enforceAgeRestriction) {
            setAgeModalOpen(true);
        } else {
            onSubmit(data);
        }
    }
  };

  const handleConfirmUnderage = () => {
      setAgeModalOpen(false);
      onSubmit(data);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Dados Socioeconômicos</h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
                Por favor, preencha as informações abaixo para caracterização do perfil dos participantes.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {SOCIOECONOMIC_FIELDS.map(field => (
                    <div key={field.id}>
                        <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {field.label}
                        </label>
                        {field.type === 'select' ? (
                            <select
                                id={field.id}
                                name={field.id}
                                value={data[field.id as keyof SocioeconomicData]}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${errors.includes(field.id) ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                            >
                                <option value="">Selecione uma opção...</option>
                                {field.options?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : (
                            <Input
                                id={field.id}
                                name={field.id}
                                type={field.type}
                                value={data[field.id as keyof SocioeconomicData]}
                                onChange={handleChange}
                                className={errors.includes(field.id) ? 'border-red-500' : ''}
                                min={field.id === 'age' ? 0 : undefined}
                            />
                        )}
                        {errors.includes(field.id) && <p className="text-xs text-red-500 mt-1">Campo obrigatório</p>}
                    </div>
                ))}
                
                <div className="pt-4 flex justify-end">
                    <Button type="submit">Próximo</Button>
                </div>
            </form>
        </Card>
      </div>
      <Modal
        isOpen={isAgeModalOpen}
        onClose={() => setAgeModalOpen(false)}
        title="Confirmação de Idade"
        footer={
          <div className="space-x-2">
            <Button variant="secondary" onClick={() => setAgeModalOpen(false)}>Corrigir Idade</Button>
            <Button variant="danger" onClick={handleConfirmUnderage}>Sim, confirmo</Button>
          </div>
        }
      >
        <div className="text-gray-800 dark:text-gray-200">
            <p className="font-semibold">Você informou uma idade menor que 18 anos.</p>
            <p className="mt-2">
                Para este estudo, a participação é restrita a maiores de idade. Ao confirmar, sua participação será registrada, mas será automaticamente <strong>arquivada</strong> (não contabilizada nas estatísticas principais do estudo).
            </p>
            <p className="mt-4">
                Você confirma que sua idade está correta?
            </p>
        </div>
      </Modal>
    </>
  );
};

export default SocioeconomicStep;