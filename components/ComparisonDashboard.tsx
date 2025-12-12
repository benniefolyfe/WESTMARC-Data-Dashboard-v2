
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  LabelList,
  Cell,
} from 'recharts';
import ChartCard from './ChartCard';
import { METRICS, MetricId } from '../metrics';
import { ZipCodeData } from '../types';
import { getChoroplethColor } from '../utils/colorScale';
import { MetricResult } from '../utils/metricUtils';
import { MapPinIcon } from './icons';
import { CustomTooltip } from './CustomTooltip';

interface ComparisonDashboardProps {
  allData: ZipCodeData[];
  selectedZips: string[];
  metricIds: MetricId[];
  allMetricsData: Record<string, MetricResult>;
  activeMetricId: MetricId | null;
  onSetActive: (id: MetricId) => void;
  zipToCityMap: Record<string, string>;
}

const formatValue = (value: number, format: 'currency' | 'percent' | 'number' | undefined) => {
    if (value == null || isNaN(value)) return 'N/A';
    switch (format) {
        case 'currency':
            return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        case 'percent':
            return `${value.toFixed(1)}%`;
        case 'number':
        default:
            return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
    }
}

const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({ 
    allData, 
    selectedZips, 
    metricIds,
    allMetricsData,
    activeMetricId,
    onSetActive,
    zipToCityMap,
}) => {

  const orderedMetricIds = (Object.keys(METRICS) as MetricId[]).filter((id) =>
    metricIds.includes(id)
  );
  
  if (metricIds.length === 0) {
    return (
        <div className="text-center py-16 bg-white rounded-lg shadow-md h-full flex flex-col justify-center items-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-westmarc-light-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h3 className="mt-2 text-lg font-extrabold text-westmarc-midnight">
                Data Comparison
            </h3>
            <p className="mt-1 text-md text-westmarc-dark-gray font-light">
                Select a data metric to begin your comparison.
            </p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        {orderedMetricIds.map(metricId => {
            const activeMetric = METRICS[metricId];
            const metricData = allMetricsData[metricId];
            const { valuesByZip, domain } = metricData || { valuesByZip: {}, domain: null };
            const isActive = metricId === activeMetricId;

            const chartData = (selectedZips.length > 0
              ? allData.filter(d => selectedZips.includes(d.zip))
              : allData
            ).map(zipData => ({
              name: `${zipData.city} ${zipData.zip}`,
              value: valuesByZip[zipData.zip] ?? 0,
            })).sort((a, b) => b.value - a.value);

            return (
                <div 
                    key={metricId} 
                    className={`bg-white p-6 rounded-lg shadow-md transition-all duration-300 cursor-pointer relative ${isActive ? 'ring-2 ring-westmarc-polaris' : 'ring-1 ring-transparent hover:ring-1 hover:ring-westmarc-mid-gray/50'}`}
                    onClick={() => onSetActive(metricId)}
                >
                    {isActive && (
                        <div className="absolute top-2 right-2 z-10 bg-westmarc-polaris text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                           <MapPinIcon className="h-3 w-3" />
                           Active on Map
                        </div>
                    )}
                    <ChartCard title={activeMetric.label} containerClassName="">
                        <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 30)}>
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
                            >
                                <XAxis 
                                    type="number" 
                                    stroke="#4B4B4B" 
                                    fontSize={12} 
                                    tickFormatter={(val) => formatValue(val as number, activeMetric.format)}
                                />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    width={150} 
                                    stroke="#4B4B4B" 
                                    fontSize={12}
                                    interval={0}
                                />
                                <Tooltip
                                    content={<CustomTooltip zipToCityMap={zipToCityMap} />}
                                    cursor={{ fill: 'rgba(104, 214, 156, 0.2)' }}
                                    formatter={(value: number) => formatValue(value, activeMetric.format)}
                                />
                                <Bar dataKey="value" name={activeMetric.label}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getChoroplethColor(entry.value, domain)} />
                                    ))}
                                    <LabelList 
                                        dataKey="value" 
                                        position="right" 
                                        offset={5}
                                        fontSize={11}
                                        formatter={(val: number) => formatValue(val, activeMetric.format)}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )
        })}
    </div>
  );
};

export default ComparisonDashboard;
