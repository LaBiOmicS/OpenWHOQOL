import React from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

/**
 * Props para o componente InstructionStep.
 */
interface InstructionStepProps {
  /** Função a ser chamada quando o participante clica para prosseguir. */
  onProceed: () => void;
}

/**
 * Props para o sub-componente ExampleQuestion.
 */
interface ExampleQuestionProps {
  questionText: string;
  labels: string[];
  /** O valor (1-5) que deve ser marcado como exemplo. */
  selectedValue?: number;
}

/**
 * Sub-componente que renderiza um exemplo de questão do WHOQOL para fins de instrução.
 * As opções são desabilitadas para impedir interação.
 */
const ExampleQuestion: React.FC<ExampleQuestionProps> = ({ questionText, labels, selectedValue }) => (
  <div className="p-4 rounded-lg border dark:border-gray-700 my-4 bg-gray-50 dark:bg-gray-800/50">
      <p className="font-semibold mb-4 text-gray-800 dark:text-gray-200">{questionText}</p>
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {labels.map((label, i) => (
          <label key={i} className="flex flex-col items-center space-y-2 cursor-default text-sm text-center">
              <input
                type="radio"
                name={`example-question-${selectedValue || 'a'}`}
                value={i + 1}
                checked={selectedValue === i + 1}
                disabled 
                readOnly
                className="form-radio h-5 w-5 text-blue-600 disabled:opacity-100"
              />
              <span>{label}</span>
          </label>
          ))}
      </div>
  </div>
);

/**
 * Componente que exibe as instruções de preenchimento do questionário WHOQOL-BREF.
 * Garante que o participante entenda como responder às questões antes de começar.
 */
const InstructionStep: React.FC<InstructionStepProps> = ({ onProceed }) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">Instruções</h1>
        
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4">
            <p>
                Este questionário é sobre como você se sente a respeito de sua qualidade de vida, saúde e outras áreas de sua vida. <strong>Por favor, responda a todas as questões.</strong> Se você não tem certeza sobre que resposta dar em uma questão, por favor, escolha entre as alternativas a que lhe parece mais apropriada. Esta, muitas vezes, poderá ser sua primeira escolha.
            </p>
            <p>
                Por favor, tenha em mente seus valores, aspirações, prazeres e preocupações. Nós estamos perguntando o que você acha de sua vida, tomando como referência as <strong>duas últimas semanas</strong>. Por exemplo, pensando nas últimas duas semanas, uma questão poderia ser:
            </p>

            <ExampleQuestion
                questionText="Você recebe dos outros o apoio de que necessita?"
                labels={['nada', 'muito pouco', 'médio', 'muito', 'completamente']}
            />
            
            <p>
                Você deve <strong>selecionar a opção</strong> que melhor corresponde ao quanto você recebe dos outros o apoio de que necessita nestas últimas duas semanas. Portanto, você deve selecionar a opção "muito" se você recebeu "muito" apoio, como abaixo.
            </p>

            <ExampleQuestion
                questionText="Você recebe dos outros o apoio de que necessita?"
                labels={['nada', 'muito pouco', 'médio', 'muito', 'completamente']}
                selectedValue={4}
            />
            
             <p>
                Da mesma forma, selecione a opção "nada" se você não recebeu "nada" de apoio.
            </p>
        </div>

        <div className="mt-8 text-center">
            <Button onClick={onProceed} className="w-full sm:w-auto">
                Prosseguir para o Questionário
            </Button>
        </div>

      </Card>
    </div>
  );
};

export default InstructionStep;
