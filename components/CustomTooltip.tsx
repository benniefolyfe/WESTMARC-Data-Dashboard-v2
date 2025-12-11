import React from 'react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  zipToCityMap?: Record<string, string>;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, zipToCityMap }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    const name = payload[0].name;

    // Logic for ComparisonDashboard where name is "City ZIP"
    let city = '';
    let zip = '';
    
    if (label && zipToCityMap) {
        // From ComparisonDashboard, label is "City ZIP"
        const parts = label.split(' ');
        if (parts.length > 1) {
            zip = parts.pop() || '';
            city = parts.join(' ');
        }
    }
    
    // Fallback for Dashboard's ComparisonSection where payload has full data
    if (!city && data.city) {
        city = data.city;
        zip = data.zip;
    }
    
    const formattedValue = new Intl.NumberFormat('en-US', {
        style: name.toLowerCase().includes('income') || name.toLowerCase().includes('value') ? 'currency' : 'decimal',
        currency: 'USD',
        maximumFractionDigits: name.toLowerCase().includes('rate') || name.toLowerCase().includes('growth') ? 1 : 0,
    }).format(value);

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-westmarc-light-gray">
        {city && <p className="font-bold text-westmarc-midnight">{city} ({zip})</p>}
        {!city && label && <p className="font-bold text-westmarc-midnight">{label}</p>}
        <p className="text-sm text-westmarc-dark-gray">{`${name}: ${formattedValue}`}</p>
      </div>
    );
  }

  return null;
};
