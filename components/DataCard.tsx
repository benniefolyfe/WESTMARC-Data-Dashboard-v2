

import React from 'react';

interface DataCardProps {
  title: string;
  value?: string | number;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

const DataCard: React.FC<DataCardProps> = ({ title, value, description, children, className }) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className || ''}`}>
      <h3 className="text-sm font-bold uppercase text-westmarc-mid-gray tracking-wider">{title}</h3>
      {value !== undefined && <div className="mt-2 text-4xl font-extrabold text-westmarc-midnight">{value}</div>}
      {description && <p className="mt-1 text-sm text-westmarc-dark-gray font-light">{description}</p>}
      {children && <div className="pt-4">{children}</div>}
    </div>
  );
};

export default DataCard;