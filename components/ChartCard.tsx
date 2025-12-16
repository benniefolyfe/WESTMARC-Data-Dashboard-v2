
import React, { useRef } from 'react';
import ClipboardButton from './ClipboardButton';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  containerClassName?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({title, children, containerClassName = "h-[260px]"}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  return (
    <div className="group relative">
      <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-bold uppercase text-westmarc-mid-gray tracking-wider">
            {title}
          </h3>
          <ClipboardButton 
            targetRef={chartRef} 
            ariaLabel={`Copy ${title} Chart`} 
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
      </div>
      <div ref={chartRef} className={`bg-white rounded-lg ${containerClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
