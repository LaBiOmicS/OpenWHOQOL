import React from 'react';

interface WordCloudChartProps {
  data: { text: string; value: number }[];
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

export const WordCloudChart: React.FC<WordCloudChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center p-4">
        Não há dados de profissão suficientes para gerar a nuvem de palavras.
      </div>
    );
  }

  const values = data.map(item => item.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Normalize font size between a min and max range
  const minFontSize = 14; // in pixels
  const maxFontSize = 48; // in pixels

  const getFontSize = (value: number) => {
    if (maxValue === minValue) {
      return (minFontSize + maxFontSize) / 2;
    }
    const size = minFontSize + ((value - minValue) / (maxValue - minValue)) * (maxFontSize - minFontSize);
    return Math.round(size);
  };

  return (
    <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 p-4 h-full overflow-y-auto">
      {data.map((item, index) => (
        <span
          key={item.text}
          style={{
            fontSize: `${getFontSize(item.value)}px`,
            color: COLORS[index % COLORS.length],
            fontWeight: 600,
            lineHeight: 1.2,
          }}
          title={`Frequência: ${item.value}`}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
};
