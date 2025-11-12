import * as XLSX from 'xlsx';
import { Participant, SocioeconomicData, WHOQOLResponse } from '../types';
import { SOCIOECONOMIC_FIELDS, WHOQOL_QUESTIONS } from '../constants';

/**
 * @file Contém a lógica para importar dados de participantes de arquivos externos (CSV, TSV, XLS, XLSX).
 */

/**
 * Mapeia os possíveis nomes de cabeçalho do arquivo de importação para as chaves de dados internas da aplicação.
 * Isso torna a importação mais flexível a pequenas variações nos nomes das colunas.
 * Ex: 'ID do Participante' -> 'id', 'Idade' -> 'age', 'Q3' -> 'Q3'
 */
const HEADER_MAP: { [key: string]: string } = {
    'ID do Participante': 'id',
    'Data de Envio': 'submittedAt',
    'Consentimento Dado': 'consentGiven',
    'Email de Contato': 'contactEmail',
    'Está Excluído': 'isExcluded',
    'Motivo da Exclusão': 'exclusionReason',
    'Auxiliado no Preenchimento': 'assistedFillOut',
    'Tempo para Completar (min)': 'timeToCompleteMinutes',
};

// Adiciona mapeamentos para campos socioeconômicos
SOCIOECONOMIC_FIELDS.forEach(field => {
    HEADER_MAP[field.label] = field.id;
});

// Adiciona mapeamentos para as questões do WHOQOL (Q1, Q2, etc.)
WHOQOL_QUESTIONS.forEach(q => {
    HEADER_MAP[q.id] = q.id;
});

/**
 * Analisa uma única linha de dados do arquivo importado e a converte em um objeto Parcial de Participante.
 * @param row Um objeto onde as chaves são os cabeçalhos da coluna e os valores são os dados da célula.
 * @returns Um objeto Parcial<Participant> contendo os dados analisados e convertidos.
 */
const parseRow = (row: any): Partial<Participant> => {
    const participant: any = {
        socioeconomic: {},
        whoqol: {},
    };

    for (const header in row) {
        const mappedKey = HEADER_MAP[header.trim()];
        if (mappedKey) {
            let value: any = row[header];

            // Realiza conversões de tipo necessárias
            if (['consentGiven', 'isExcluded', 'assistedFillOut'].includes(mappedKey)) {
                value = String(value).toLowerCase() === 'true';
            } else if (mappedKey.startsWith('Q')) {
                 const numValue = parseInt(value, 10);
                 if (!isNaN(numValue)) {
                    participant.whoqol[mappedKey] = numValue;
                 }
                 continue; // Pula para a próxima iteração
            } else if (mappedKey === 'timeToCompleteMinutes') {
                const numValue = parseFloat(String(value).replace(',', '.'));
                value = isNaN(numValue) ? undefined : numValue;
            } else if (SOCIOECONOMIC_FIELDS.find(f => f.id === mappedKey && f.type === 'number')) {
                const numValue = parseInt(value, 10);
                value = isNaN(numValue) ? '' : numValue;
            }

            // Atribui o valor ao campo correto (socioeconômico ou direto no participante)
            const socioeconomicField = SOCIOECONOMIC_FIELDS.find(f => f.id === mappedKey);
            if (socioeconomicField) {
                participant.socioeconomic[socioeconomicField.id] = value;
            } else {
                participant[mappedKey] = value;
            }
        }
    }
    
    // Um ID válido é obrigatório para considerar a linha como um participante válido.
    if (!participant.id || typeof participant.id !== 'string') {
        return {};
    }

    return participant as Partial<Participant>;
};

/**
 * Lê o conteúdo de um arquivo de forma assíncrona.
 * @param file O objeto File a ser lido.
 * @returns Uma Promise que resolve com o conteúdo do arquivo como string ou ArrayBuffer.
 */
const readFile = (file: File): Promise<string | ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result!);
        reader.onerror = (e) => reject(e);
        const lowerCaseName = file.name.toLowerCase();
        if (lowerCaseName.endsWith('.xls') || lowerCaseName.endsWith('.xlsx')) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file, 'UTF-8');
        }
    });
};

/**
 * Processa uma lista de arquivos (CSV, TSV, XLS, XLSX) e extrai os dados dos participantes.
 * @param files A FileList contendo os arquivos a serem processados.
 * @returns Uma Promise que resolve com um objeto contendo a lista de novos participantes analisados.
 * @throws Um Erro se o processamento de um arquivo falhar.
 */
export const processImportedFiles = async (files: FileList): Promise<{ newParticipants: Participant[] }> => {
    const allNewParticipants: Participant[] = [];
    
    for (const file of Array.from(files)) {
        try {
            const fileContent = await readFile(file);
            let data: any[];

            if (typeof fileContent === 'string') { // Processa CSV/TSV
                const lines = fileContent.replace(/\r/g, "").split('\n').filter(Boolean);
                if (lines.length < 2) continue; // Pula arquivos vazios ou só com cabeçalho
                
                const delimiter = file.name.toLowerCase().endsWith('.tsv') ? '\t' : ',';
                const headers = lines[0].split(delimiter).map(h => h.replace(/"/g, '').trim());

                data = lines.slice(1).map(line => {
                    const values = line.split(delimiter);
                    return headers.reduce((obj, header, index) => {
                        obj[header] = values[index]?.replace(/"/g, '').trim();
                        return obj;
                    }, {} as {[key: string]: string});
                });

            } else { // Processa XLS/XLSX
                const workbook = XLSX.read(fileContent, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                data = XLSX.utils.sheet_to_json(worksheet);
            }
            
            const parsedParticipants = data
                .map(parseRow)
                .filter(p => p.id && p.socioeconomic && p.whoqol) as Participant[];
                
            allNewParticipants.push(...parsedParticipants);

        } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            throw new Error(`Falha ao processar o arquivo ${file.name}. Verifique o formato.`);
        }
    }

    return { newParticipants: allNewParticipants };
};
