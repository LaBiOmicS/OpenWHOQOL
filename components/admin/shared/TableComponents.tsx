import React, { useState, useRef } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Info } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatNumber, transformedToRawScore, classifyRawScore } from '../../../lib/statistics';

const downloadBlob = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Exports data to a CSV file.
 * @param {string[]} headers The table headers.
 * @param {(string | number)[][]} rows The table data rows.
 * @param {string} filename The desired filename for the download.
 */
export const exportToCsv = (headers: string[], rows: (string | number)[][], filename:string) => {
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(value => {
            let stringValue = String(value);
            if (stringValue.includes(',')) {
              stringValue = `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
};

/**
 * Exports data to a TSV (Tab-Separated Values) file.
 * @param {string[]} headers The table headers.
 * @param {(string | number)[][]} rows The table data rows.
 * @param {string} filename The desired filename for the download.
 */
export const exportToTsv = (headers: string[], rows: (string | number)[][], filename: string) => {
    const tsvContent = [
        headers.join('\t'),
        ...rows.map(row => row.map(value => String(value)).join('\t'))
    ].join('\n');
    const blob = new Blob([`\uFEFF${tsvContent}`], { type: 'text/tab-separated-values;charset=utf-8;' });
    downloadBlob(blob, filename);
};

/**
 * Exports data to an XLS file using an HTML table wrapper.
 * @param {string[]} headers The table headers.
 * @param {(string | number)[][]} rows The table data rows.
 * @param {string} filename The desired filename for the download.
 */
export const exportToXls = (headers: string[], rows: (string | number)[][], filename: string) => {
    const tableHeader = `<tr>${headers.map(h => `<th>${String(h)}</th>`).join('')}</tr>`;
    const tableRows = rows.map(row => `<tr>${row.map(cell => `<td>${String(cell)}</td>`).join('')}</tr>`).join('');
    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Dados</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>${tableHeader}${tableRows}</table></body></html>`;
    const blob = new Blob([`\uFEFF${template}`], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    downloadBlob(blob, filename);
};

// Styled components for consistent table rendering
export const StyledTable: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className="overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
            {children}
        </table>
    </div>
);

export const StyledThead: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <thead className={`bg-gray-50 dark:bg-gray-700 ${className}`}>
        <tr>{children}</tr>
    </thead>
);

export const StyledTh: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${className}`}>
        {children}
    </th>
);

export const StyledTbody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <tbody className={`bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
        {children}
    </tbody>
);

export const StyledTd: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
    <td {...props} className={`px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 ${className}`}>
        {children}
    </td>
);

const getClassColors = (classification: string | undefined) => {
    switch(classification) {
        case 'Ruim':
            return { bgColor: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-800 dark:text-red-200' };
        case 'Regular':
            return { bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-800 dark:text-yellow-200' };
        case 'Boa':
            return { bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-800 dark:text-green-200' };
        case 'Muito Boa':
            return { bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-800 dark:text-blue-200' };
        default:
            return { bgColor: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-800 dark:text-gray-200' };
    }
};

/**
 * A reusable component to display a WHOQOL score with color-coding based on its qualitative classification.
 * @param {object} props The component props.
 * @param {number | undefined | null} props.score The score (0-100 scale) to display.
 * @param {'sm' | 'xs'} [props.size='sm'] The font size of the badge.
 * @param {string} [props.classification] Optional classification string to determine color. If not provided, it's calculated from the score.
 */
export const ScoreBadge: React.FC<{ score: number | undefined | null; size?: 'sm' | 'xs'; classification?: string; }> = ({ score, size = 'sm', classification: providedClassification }) => {
    if (score === undefined || score === null || isNaN(score)) {
        return (
            <span className={`px-2 py-1 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 ${size === 'sm' ? 'text-sm' : 'text-xs'}`}>
                N/A
            </span>
        );
    }
    
    const classification = providedClassification || classifyRawScore(transformedToRawScore(score));
    const { bgColor, textColor } = getClassColors(classification);
    
    return (
      <span className={`px-2 py-1 font-semibold rounded-full ${bgColor} ${textColor} ${size === 'sm' ? 'text-sm' : 'text-xs'}`}>
        {formatNumber(score)}
      </span>
    );
};

/**
 * A reusable component to display a mean score (1-5 scale) with color-coding based on its qualitative classification.
 * @param {object} props The component props.
 * @param {number | undefined | null} props.score The score to display.
 * @param {boolean} [props.isNegative=false] Whether the question has a negative sense (inverts color logic).
 */
export const MeanScoreBadge: React.FC<{ score: number | undefined | null; isNegative?: boolean }> = ({ score, isNegative = false }) => {
    if (score === undefined || score === null || isNaN(score)) {
        return (
            <span className="px-2 py-1 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs">
                N/A
            </span>
        );
    }

    // For negative questions, a lower score is better, so we invert it for color logic.
    // e.g., a score of 1 (good) becomes 5; a score of 5 (bad) becomes 1.
    const effectiveScore = isNegative ? 6 - score : score;
    const classification = classifyRawScore(effectiveScore);
    const { bgColor, textColor } = getClassColors(classification);

    return (
        <span className={`px-2 py-1 font-semibold rounded-full ${bgColor} ${textColor} text-xs`}>
            {formatNumber(score)}
        </span>
    );
};


/**
 * A reusable card component for displaying charts.
 * It includes a title, an optional info modal, and buttons to export the chart content
 * as a PNG, SVG, or PDF.
 * @param {object} props The component props.
 * @param {string} props.title The title of the chart card.
 * @param {React.ReactNode} props.children The chart component to be rendered.
 * @param {React.ReactNode} [props.infoContent] Optional content for an info modal.
 */
export const ChartCard: React.FC<{ title: string; children: React.ReactNode; infoContent?: React.ReactNode; }> = ({ title, children, infoContent }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const baseFilename = title.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_{2,}/g, '_');

    const captureCardAsCanvas = async () => {
        const cardElement = chartRef.current?.firstChild as HTMLElement | null;
        if (!cardElement) return null;

        return await html2canvas(cardElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            onclone: (doc) => {
                // In the cloned document, remove all dark mode classes to force light-mode rendering
                doc.querySelectorAll('[class*="dark:"]').forEach(el => {
                    const classes = Array.from(el.classList);
                    const darkClasses = classes.filter(c => (c as string).startsWith('dark:'));
                    el.classList.remove(...darkClasses);
                });
                // Explicitly set the background of the card itself to white
                const rootEl = doc.body.firstChild as HTMLElement;
                if (rootEl) {
                   rootEl.style.backgroundColor = 'white';
                }
            }
        });
    };

    const downloadPdf = async () => {
        try {
            const canvas = await captureCardAsCanvas();
            if (!canvas) return;
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'l' : 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${baseFilename}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
        }
    };

    const downloadPng = async () => {
        try {
            const canvas = await captureCardAsCanvas();
            if (!canvas) return;
            const link = document.createElement('a');
            link.download = `${baseFilename}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error generating PNG:", error);
            alert("Ocorreu um erro ao gerar o PNG. Por favor, tente novamente.");
        }
    };

    const downloadSvg = () => {
        const element = chartRef.current;
        if (!element) return;
        const svgElement = element.querySelector('svg');
        if (svgElement) {
            const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    
            // Create a white background rectangle
            const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            background.setAttribute('width', '100%');
            background.setAttribute('height', '100%');
            background.setAttribute('fill', 'white');
    
            // Insert the background as the first child of the cloned SVG
            svgClone.insertBefore(background, svgClone.firstChild);

            const serializer = new XMLSerializer();
            let svgString = serializer.serializeToString(svgClone);

            if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${baseFilename}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else {
            alert('Não foi possível encontrar o elemento SVG para exportar. Esta opção é válida apenas para gráficos vetoriais.');
        }
    };

    return (
        <>
            <div ref={chartRef}>
                <Card>
                    <div className="flex justify-between items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                           <h3 className="text-lg font-semibold">{title}</h3>
                           {infoContent && (
                                <button
                                    onClick={() => setIsInfoModalOpen(true)}
                                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                                    aria-label={`Mais informações sobre ${title}`}
                                    title={`Mais informações sobre ${title}`}
                                >
                                    <Info size={16} />
                                </button>
                           )}
                        </div>
                        <div className="flex items-center space-x-1">
                            <Button variant="secondary" size="sm" onClick={downloadPng} title="Exportar como PNG">PNG</Button>
                            <Button variant="secondary" size="sm" onClick={downloadSvg} title="Exportar como SVG">SVG</Button>
                            <Button variant="secondary" size="sm" onClick={downloadPdf} title="Exportar como PDF">PDF</Button>
                        </div>
                    </div>
                    <div className="w-full h-[350px]">
                        {children}
                    </div>
                </Card>
            </div>
            {infoContent && (
                <Modal
                    isOpen={isInfoModalOpen}
                    onClose={() => setIsInfoModalOpen(false)}
                    title={`Sobre: ${title}`}
                >
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                        {infoContent}
                    </div>
                </Modal>
            )}
        </>
    );
};

/**
 * A reusable card component for displaying tables.
 * It includes a title, export buttons, an optional legend, an optional info modal, and the table content.
 * @param {object} props The component props.
 * @param {string} props.title The title of the table card.
 * @param {React.ReactNode} props.children The table component to be rendered.
 * @param {(format: 'csv' | 'tsv' | 'xls') => void} [props.onExport] Optional handler for exporting data.
 * @param {React.ReactNode} [props.legend] Optional legend content to display below the title.
 * @param {React.ReactNode} [props.infoContent] Optional content for an info modal.
 */
export const TableCard: React.FC<{ title: string; children: React.ReactNode; onExport?: (format: 'csv' | 'tsv' | 'xls') => void; legend?: React.ReactNode; infoContent?: React.ReactNode; }> = ({ title, children, onExport, legend, infoContent }) => {
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    
    return (
        <>
            <Card>
                <div className="flex justify-between items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{title}</h3>
                      {infoContent && (
                          <button
                              onClick={() => setIsInfoModalOpen(true)}
                              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                              aria-label={`Mais informações sobre ${title}`}
                              title={`Mais informações sobre ${title}`}
                          >
                              <Info size={16} />
                          </button>
                      )}
                    </div>
                    {onExport && (
                        <div className="flex items-center space-x-1">
                            <Button variant="secondary" size="sm" onClick={() => onExport('csv')}>CSV</Button>
                            <Button variant="secondary" size="sm" onClick={() => onExport('tsv')}>TSV</Button>
                            <Button variant="secondary" size="sm" onClick={() => onExport('xls')}>XLS</Button>
                        </div>
                    )}
                </div>
                {legend && (
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                        {legend}
                    </div>
                )}
                <div className="mt-4">
                    {children}
                </div>
            </Card>
            {infoContent && (
                 <Modal
                    isOpen={isInfoModalOpen}
                    onClose={() => setIsInfoModalOpen(false)}
                    title={`Sobre: ${title}`}
                >
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                        {infoContent}
                    </div>
                </Modal>
            )}
        </>
    );
};