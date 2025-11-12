import React, { useState, useRef, useMemo } from 'react';
import { WHOQOLResponse } from '../../types';
import { WHOQOL_QUESTIONS, INITIAL_WHOQOL_RESPONSE } from '../../constants';
import { Button } from '../ui/Button';
import { getLikertScaleForQuestion } from '../../lib/whoqol';

/**
 * Props para o sub-componente Question.
 */
interface QuestionProps {
  question: { id: string; text: string };
  number: number;
  hasError: boolean;
  response: number | undefined;
  labels: string[];
  onChange: (questionId: string, value: number) => void;
}

/**
 * Sub-componente que renderiza uma única questão do questionário.
 */
const Question: React.FC<QuestionProps> = ({ question, number, hasError, response, labels, onChange }) => (
  <div className={`p-4 rounded-lg transition-colors ${hasError ? 'bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700' : 'border-t dark:border-gray-700'}`}>
    <p className={`font-semibold mb-4 ${hasError ? 'text-red-800 dark:text-red-200' : 'text-gray-800 dark:text-gray-200'}`}>
      {number}. {question.text}
    </p>
    <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
      {labels.map((label, i) => (
        <label key={i} className="flex flex-col items-center space-y-2 cursor-pointer text-sm text-center">
          <input
            type="radio"
            name={question.id}
            value={i + 1}
            checked={response === i + 1}
            onChange={() => onChange(question.id, i + 1)}
            className="form-radio h-5 w-5 text-blue-600"
          />
          <span>{label}</span>
        </label>
      ))}
    </div>
  </div>
);

/**
 * Sub-componente para exibir os cabeçalhos de seção do questionário.
 */
const SectionHeader: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <p className="!mt-10 mb-6 text-center text-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md">
       {children}
    </p>
);

/**
 * Props para o componente WhoqolStep.
 */
interface WhoqolStepProps {
  onSubmit: (responses: WHOQOLResponse, assisted: boolean, durationMinutes: number) => void;
}

/**
 * Componente que renderiza a etapa de preenchimento do questionário WHOQOL-BREF.
 * Gerencia as respostas do usuário, valida o preenchimento e calcula o tempo de conclusão.
 */
const WhoqolStep: React.FC<WhoqolStepProps> = ({ onSubmit }) => {
  const [responses, setResponses] = useState<WHOQOLResponse>(INITIAL_WHOQOL_RESPONSE);
  const [errors, setErrors] = useState<string[]>([]);
  const [assisted, setAssisted] = useState<boolean | null>(null);
  const [assistedError, setAssistedError] = useState(false);
  const [startTime] = useState(Date.now());
  const assistanceQuestionRef = useRef<HTMLDivElement>(null);
  
  // Usar um Map para busca mais eficiente de questões por ID
  const questionsMap = useMemo(() => new Map(WHOQOL_QUESTIONS.map(q => [q.id, q])), []);

  /**
   * Atualiza o estado das respostas e limpa o erro da questão, se houver.
   */
  const handleResponseChange = (questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    if (errors.includes(questionId)) {
      setErrors(prev => prev.filter(id => id !== questionId));
    }
  };
  
  /**
   * Atualiza o estado da pergunta sobre auxílio no preenchimento.
   */
  const handleAssistedChange = (value: boolean) => {
    setAssisted(value);
    if (assistedError) {
      setAssistedError(false);
    }
  };

  /**
   * Valida e submete o formulário.
   * Verifica se todas as questões foram respondidas e, em caso afirmativo,
   * calcula a duração e chama a função `onSubmit`.
   */
  const handleSubmit = () => {
    const unanswered = WHOQOL_QUESTIONS.filter(q => responses[q.id] === undefined);
    const assistedUnanswered = assisted === null;

    if (unanswered.length > 0 || assistedUnanswered) {
      setErrors(unanswered.map(q => q.id));
      setAssistedError(assistedUnanswered);
      if (unanswered.length > 0) {
        // Rola a tela para o topo para mostrar o erro e a primeira questão não respondida.
        window.scrollTo(0, 0);
      } else if (assistedUnanswered && assistanceQuestionRef.current) {
        // Se apenas a pergunta de auxílio não foi respondida, rola até ela.
        assistanceQuestionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setErrors([]);
      setAssistedError(false);
      const endTime = Date.now();
      const durationMinutes = (endTime - startTime) / (1000 * 60);
      onSubmit(responses, assisted!, durationMinutes);
    }
  };

  /**
   * Renderiza uma questão específica.
   */
  const renderQuestion = (id: string, number: number) => {
    const q = questionsMap.get(id);
    if (!q) return null;
    return (
      <Question
        key={id}
        question={q}
        number={number}
        hasError={errors.includes(id)}
        response={responses[id]}
        labels={getLikertScaleForQuestion(id)}
        onChange={handleResponseChange}
      />
    );
  };
  
  const questionIds = useMemo(() => WHOQOL_QUESTIONS.map(q => q.id), []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">Questionário de Qualidade de Vida</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Por favor, leia cada questão, veja o que você acha e selecione a melhor resposta.
        </p>
        
        {(errors.length > 0 || assistedError) && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
            <p className="font-bold">Campos Obrigatórios</p>
            <p>Por favor, responda a todas as questões destacadas em vermelho para continuar.</p>
          </div>
        )}

        <div className="space-y-8">
            {renderQuestion('Q1', 1)}
            {renderQuestion('Q2', 2)}

            <SectionHeader>As questões seguintes são sobre o <strong>quanto</strong> você tem sentido algumas coisas nas últimas duas semanas.</SectionHeader>
            {['Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9'].map(id => renderQuestion(id, questionIds.indexOf(id) + 1))}

            <SectionHeader>As questões seguintes perguntam sobre <strong>quão completamente</strong> você tem sentido ou é capaz de fazer certas coisas nestas últimas duas semanas.</SectionHeader>
            {['Q10', 'Q11', 'Q12', 'Q13', 'Q14'].map(id => renderQuestion(id, questionIds.indexOf(id) + 1))}
            
            <SectionHeader>As questões seguintes perguntam sobre <strong>quão bem ou satisfeito</strong> você se sentiu a respeito de vários aspectos de sua vida nas últimas duas semanas.</SectionHeader>
            {['Q15', 'Q16', 'Q17', 'Q18', 'Q19', 'Q20', 'Q21', 'Q22', 'Q23', 'Q24', 'Q25'].map(id => renderQuestion(id, questionIds.indexOf(id) + 1))}

            <SectionHeader>As questões seguintes referem-se a <strong>com que frequência</strong> você sentiu ou experimentou certas coisas nas últimas duas semanas.</SectionHeader>
            {renderQuestion('Q26', 26)}

            <div ref={assistanceQuestionRef} className={`p-4 rounded-lg mt-10 transition-colors ${assistedError ? 'bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700' : 'border-t dark:border-gray-700'}`}>
                <p className={`font-semibold mb-4 text-center ${assistedError ? 'text-red-800 dark:text-red-200' : 'text-gray-800 dark:text-gray-200'}`}>
                    Alguém lhe ajudou a preencher este questionário?
                </p>
                <div className="flex justify-center items-center space-x-8">
                    <label className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                        type="radio"
                        name="assisted"
                        checked={assisted === true}
                        onChange={() => handleAssistedChange(true)}
                        className="form-radio h-5 w-5 text-blue-600"
                    />
                    <span>Sim</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                        type="radio"
                        name="assisted"
                        checked={assisted === false}
                        onChange={() => handleAssistedChange(false)}
                        className="form-radio h-5 w-5 text-blue-600"
                    />
                    <span>Não</span>
                    </label>
                </div>
            </div>
        </div>

        <div className="mt-12 text-center">
          <Button onClick={handleSubmit} className="w-full md:w-auto">
            Finalizar e Enviar Respostas
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WhoqolStep;