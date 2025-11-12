import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LifeBuoy, Github, ExternalLink, Star } from 'lucide-react';

const GITHUB_REPO_URL = 'https://github.com/LaBiOmicS/OpenWHOQOL';

const SupportTab: React.FC = () => {
    const [issueTitle, setIssueTitle] = useState('');
    const [issueDescription, setIssueDescription] = useState('');
    const [stepsToReproduce, setStepsToReproduce] = useState('');

    const generateIssueBody = () => {
        const userAgent = navigator.userAgent;
        const appVersion = 'v1.0.0'; // Hardcoded for this version

        return `**Descrição do Problema**
${issueDescription}

**Passos para Reproduzir**
${stepsToReproduce}

---
**Informações do Sistema (Preenchido Automaticamente)**
- **Versão da Aplicação:** ${appVersion}
- **Navegador:** ${userAgent}
        `;
    };

    const handleOpenIssue = () => {
        const title = encodeURIComponent(issueTitle);
        const body = encodeURIComponent(generateIssueBody());
        const issueUrl = `${GITHUB_REPO_URL}/issues/new?title=${title}&body=${body}`;
        window.open(issueUrl, '_blank');
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                            <Github className="text-gray-800 dark:text-white" /> Repositório do Projeto
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                            O OpenWHOQOL é um projeto de código aberto. Visite nosso repositório no GitHub para ver o código-fonte, acompanhar o desenvolvimento, sugerir novas funcionalidades ou contribuir. Não se esqueça de deixar uma estrela (Star) se você gosta do projeto!
                        </p>
                    </div>
                    <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex-shrink-0">
                        <Button className="w-full justify-center">
                            <Star size={16} className="mr-2" />
                            Ver no GitHub
                        </Button>
                    </a>
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <LifeBuoy className="text-blue-600" /> Suporte Técnico & Relatório de Bugs
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Encontrou um problema ou tem uma sugestão? Use o formulário abaixo para pré-preencher uma "issue" no repositório oficial do projeto no GitHub. A comunidade agradece sua colaboração!
                </p>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="issueTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Título do Problema
                        </label>
                        <Input
                            id="issueTitle"
                            value={issueTitle}
                            onChange={(e) => setIssueTitle(e.target.value)}
                            placeholder="Ex: Botão de exportação não funciona no Firefox"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label htmlFor="issueDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Descrição Detalhada do Problema
                        </label>
                        <textarea
                            id="issueDescription"
                            value={issueDescription}
                            onChange={(e) => setIssueDescription(e.target.value)}
                            rows={4}
                            placeholder="Descreva o que aconteceu, o que você esperava que acontecesse e qualquer outra informação relevante."
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                     <div>
                        <label htmlFor="stepsToReproduce" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Passos para Reproduzir
                        </label>
                        <textarea
                            id="stepsToReproduce"
                            value={stepsToReproduce}
                            onChange={(e) => setStepsToReproduce(e.target.value)}
                            rows={3}
                            placeholder="1. Fui para a aba 'Participantes'&#10;2. Cliquei no botão 'Exportar CSV'&#10;3. Ocorreu um erro X..."
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                     <Button
                        onClick={handleOpenIssue}
                        disabled={!issueTitle.trim() || !issueDescription.trim()}
                        className="w-full sm:w-auto"
                    >
                        <Github size={16} /> Abrir Issue no GitHub
                    </Button>
                    <a
                        href={`${GITHUB_REPO_URL}/issues`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                        Ver todas as issues existentes <ExternalLink size={14} />
                    </a>
                </div>
            </Card>
        </div>
    );
};

export default SupportTab;
