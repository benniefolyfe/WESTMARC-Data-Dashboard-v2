import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  containerClassName?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({title, children, containerClassName = "h-[260px]"}) => {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase text-westmarc-mid-gray tracking-wider mb-4">
        {title}
      </h3>
      <div className={containerClassName}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;