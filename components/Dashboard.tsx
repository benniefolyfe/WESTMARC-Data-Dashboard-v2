
import React, { useMemo } from 'react';
import DataCard from './DataCard';
import ChartCard from './ChartCard';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  PieChart,
  Legend,
  Pie,
  Cell,
  LabelList,
} from 'recharts';
import { UsersIcon, BriefcaseIcon, HomeIcon, AcademicCapIcon } from './icons';
import { ZipCodeData } from '../types';
import { CustomTooltip } from './CustomTooltip';
import { aggregateZipData } from '../utils/aggregateData';
import { WEST_VALLEY_ZIP_CODES } from '../constants';
import { MetricId, METRICS } from '../metrics';

type View = 'dashboard' | 'compare' | 'aiInsights';

interface DashboardProps {
  selectedZips: string[];
  allWestValleyData: Record<string, ZipCodeData>;
  selectedMetricIds: MetricId[];
  onNavigate: (view: View) => void;
}

const zipToCityMap = Object.fromEntries(WEST_VALLEY_ZIP_CODES.map(item => [item.zip, item.city]));

// Helper to check if a chart data array has meaningful data
const hasData = (data: { value: number }[]) => {
    return data && data.length > 0 && data.some(item => item.value > 0);
};

const EmptyChartMessage = ({ message = "No data available" }) => (
    <div className="h-full w-full flex items-center justify-center text-westmarc-mid-gray text-sm italic p-4 text-center">
        {message}
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ selectedZips, allWestValleyData, selectedMetricIds, onNavigate }) => {
    // 1. Logic to handle "All West Valley" if no selection
    const comparisonData = useMemo(() => {
        // If no ZIPs selected, use ALL available data keys
        const targetZips = selectedZips.length > 0 ? selectedZips : Object.keys(allWestValleyData);
        
        return targetZips
          .map(zip => allWestValleyData[zip])
          .filter((d): d is ZipCodeData => d !== null && d !== undefined);
    }, [selectedZips, allWestValleyData]);
    
    const combinedData = useMemo(() => aggregateZipData(comparisonData), [comparisonData]);

    const PIE_COLORS = ['#1C4953', '#68D69C', '#2A7C5E', '#F1E55F', '#FF5C3E', '#92193B', '#D9D9D9'];
  
    if (!combinedData) {
      return (
         <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <p className="text-westmarc-mid-gray">Loading data or no data available for the selected region.</p>
         </div>
      );
    }
  
    const data = combinedData;
    
    // Title Logic
    const title = selectedZips.length > 0
      ? (selectedZips.length === 1 ? `${data.city} (${data.zip})` : `${selectedZips.length} Selected Regions`)
      : "All West Valley";

    // Visibility helpers
    const showAll = selectedMetricIds.length === 0;
    const isVisible = (id: MetricId) => showAll || selectedMetricIds.includes(id);
    
    const isDemographicsVisible = showAll || selectedMetricIds.some(id => METRICS[id].group === 'Demographics');
    const isEconomicsVisible = showAll || selectedMetricIds.some(id => METRICS[id].group === 'Economics & Labor');
    const isHousingVisible = showAll || selectedMetricIds.some(id => METRICS[id].group === 'Housing & Commuting');
    const isEducationVisible = showAll || selectedMetricIds.some(id => METRICS[id].group === 'Education');

    const hasAnyIndustrySelected = selectedMetricIds.some(id => id.startsWith('employmentByIndustry:'));
    const hasAnyEnrollmentSelected = selectedMetricIds.some(id => id.startsWith('enrollment'));

    // Helper to render cards for specifically selected industries (so every metric has a module)
    const renderSelectedIndustryCards = () => {
        const industryIds = selectedMetricIds.filter(id => id.startsWith('employmentByIndustry:'));
        if (industryIds.length === 0) return null;
        
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
                {industryIds.map(id => {
                    const metric = METRICS[id];
                    const val = metric.getValue(data);
                    if (val === null) return null;
                    return (
                        <DataCard 
                            key={id}
                            title={metric.label.replace('Employment: ', '')} 
                            value={`${val.toFixed(1)}%`}
                            className="border-l-4 border-westmarc-saguaro"
                        />
                    );
                })}
            </div>
        );
    };

    // Helper for selected enrollment cards
    const renderSelectedEnrollmentCards = () => {
         const enrollmentIds = selectedMetricIds.filter(id => id.startsWith('enrollment'));
         if (enrollmentIds.length === 0) return null;

         return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
                {enrollmentIds.map(id => {
                    const metric = METRICS[id];
                    const val = metric.getValue(data);
                    if (val === null) return null;
                    return (
                        <DataCard 
                            key={id}
                            title={metric.label.replace('Enrolled: ', '')} 
                            value={`${val.toFixed(1)}%`}
                            className="border-l-4 border-westmarc-polaris"
                        />
                    );
                })}
            </div>
        );
    }
  
    return (
      <div className="relative pb-10">
        <div className="space-y-8">
          
          {/* Demographics Section */}
          {isDemographicsVisible && (
            <section className="space-y-4">
              <div className="flex items-center">
                  <UsersIcon className="h-8 w-8 text-westmarc-polaris" />
                  <h2 className="ml-3 text-2xl font-extrabold text-westmarc-midnight">
                  Demographics: {title}
                  </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(isVisible('population') || isVisible('populationGrowth')) && (
                   <DataCard title="Population" value={data.demographics.population.toLocaleString()} description={`Annual Growth: ${isNaN(data.demographics.populationGrowth) ? 'N/A' : `${data.demographics.populationGrowth.toFixed(1)}%`}`} />
                )}
                {isVisible('medianAge') && (
                   <DataCard title="Median Age" value={data.demographics.medianAge.toFixed(1)} />
                )}
                {isVisible('foreignBornShare') && (
                   <DataCard title="Foreign-Born" value={`${data.demographics.foreignBornShare.toFixed(1)}%`} />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(showAll || isVisible('population')) && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <ChartCard title="Race & Ethnicity">
                            {hasData(data.demographics.raceEthnicity) ? (
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={data.demographics.raceEthnicity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}>
                                            {data.demographics.raceEthnicity.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                                        <Legend formatter={(value: string) => value} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <EmptyChartMessage />}
                        </ChartCard>
                    </div>
                )}
                {(showAll || isVisible('medianAge')) && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <ChartCard title="Age Distribution">
                             {hasData(data.demographics.ageDistribution) ? (
                                <ResponsiveContainer>
                                    <BarChart data={data.demographics.ageDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <XAxis type="number" stroke="#4B4B4B" fontSize={12} unit="%" />
                                        <YAxis type="category" dataKey="name" stroke="#4B4B4B" fontSize={12} width={40} />
                                        <Tooltip cursor={{ fill: 'rgba(104, 214, 156, 0.2)' }} formatter={(value: number) => `${value.toFixed(1)}%`} />
                                        <Bar dataKey="value" fill="#68D69C" name="Percentage" unit="%" />
                                    </BarChart>
                                </ResponsiveContainer>
                             ) : <EmptyChartMessage />}
                        </ChartCard>
                    </div>
                )}
              </div>
            </section>
          )}

          {/* Economics Section */}
          {isEconomicsVisible && (
            <section className="space-y-4">
              <div className="flex items-center"><BriefcaseIcon className="h-8 w-8 text-westmarc-polaris" /><h2 className="ml-3 text-2xl font-extrabold text-westmarc-midnight">Economics & Labor Force</h2></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {isVisible('medianHouseholdIncome') && <DataCard title="Median Household Income" value={`$${data.economics.medianHouseholdIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />}
                  {isVisible('perCapitaIncome') && <DataCard title="Per Capita Income" value={`$${data.economics.perCapitaIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />}
                  {isVisible('povertyRate') && <DataCard title="Poverty Rate" value={`${data.economics.povertyRate.toFixed(1)}%`} />}
                  {isVisible('laborForceParticipationRate') && <DataCard title="Labor Force Participation" value={`${data.laborForce.laborForceParticipationRate.toFixed(1)}%`} />}
                  {isVisible('unemploymentRate') && <DataCard title="Unemployment Rate" value={`${data.laborForce.unemploymentRate.toFixed(1)}%`} />}
              </div>
              
              {/* Render specific cards for selected Industries */}
              {renderSelectedIndustryCards()}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {(showAll || hasAnyIndustrySelected) && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <ChartCard title="Employment by Industry">
                            {hasData(data.employmentByIndustry) ? (
                                <ResponsiveContainer>
                                    <BarChart data={data.employmentByIndustry} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                        <XAxis type="number" stroke="#4B4B4B" fontSize={12} unit="%" />
                                        <YAxis type="category" dataKey="name" width={120} stroke="#4B4B4B" fontSize={12} interval={0} />
                                        <Tooltip cursor={{ fill: 'rgba(104, 214, 156, 0.2)' }} formatter={(value: number) => `${value.toFixed(1)}%`} />
                                        <Bar dataKey="value" fill="#2A7C5E" name="Percentage" unit="%" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <EmptyChartMessage />}
                        </ChartCard>
                    </div>
                  )}
                  {(showAll || isVisible('laborForceParticipationRate')) && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <ChartCard title="Occupation Mix">
                             {hasData(data.laborForce.occupationMix) ? (
                                <ResponsiveContainer>
                                    <BarChart data={data.laborForce.occupationMix} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                        <XAxis type="number" stroke="#4B4B4B" fontSize={12} unit="%" />
                                        <YAxis type="category" dataKey="name" width={110} stroke="#4B4B4B" fontSize={12} interval={0} />
                                        <Tooltip cursor={{ fill: 'rgba(104, 214, 156, 0.2)' }} formatter={(value: number) => `${value.toFixed(1)}%`} />
                                        <Bar dataKey="value" fill="#2A7C5E" name="Percentage" unit="%" />
                                    </BarChart>
                                </ResponsiveContainer>
                             ) : <EmptyChartMessage />}
                        </ChartCard>
                    </div>
                  )}
              </div>
            </section>
          )}

          {/* Housing Section */}
          {isHousingVisible && (
            <section className="space-y-4">
              <div className="flex items-center"><HomeIcon className="h-8 w-8 text-westmarc-polaris" /><h2 className="ml-3 text-2xl font-extrabold text-westmarc-midnight">Housing & Commuting</h2></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {isVisible('medianHomeValue') && <DataCard title="Median Home Value" value={`$${data.housing.medianHomeValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />}
                    {isVisible('ownerOccupiedRate') && <DataCard title="Owner-Occupied" value={`${data.housing.ownerOccupiedRate.toFixed(1)}%`} />}
                    {isVisible('medianGrossRent') && <DataCard title="Median Gross Rent" value={`$${data.housing.medianGrossRent.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />}
                    {isVisible('rentCostBurdenRate') && <DataCard title="Rent Cost Burden (>35%)" value={`${data.housing.rentCostBurdenRate.toFixed(1)}%`} />}
                    {isVisible('priceToIncomeRatio') && <DataCard title="Price-to-Income Ratio" value={data.housing.priceToIncomeRatio.toFixed(1)} />}
                    {isVisible('meanTravelTimeToWork') && <DataCard title="Mean Travel Time" value={`${data.commuting.meanTravelTimeToWork.toFixed(1)} min`} />}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(showAll || isVisible('medianHomeValue')) && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <ChartCard title="Year Structure Built">
                         {hasData(data.housing.yearStructureBuilt) ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={data.housing.yearStructureBuilt} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}>
                                        {data.housing.yearStructureBuilt.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                         ) : <EmptyChartMessage />}
                    </ChartCard>
                  </div>
                )}
                {(showAll || isVisible('meanTravelTimeToWork')) && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <ChartCard title="Commute Mode Share">
                         {hasData(data.commuting.modeShare) ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={data.commuting.modeShare} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}>
                                        {data.commuting.modeShare.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                         ) : <EmptyChartMessage />}
                    </ChartCard>
                  </div>
                )}
              </div>
            </section>
          )}

           {/* Education Section */}
           {isEducationVisible && (
            <section className="space-y-4">
              <div className="flex items-center"><AcademicCapIcon className="h-8 w-8 text-westmarc-polaris" /><h2 className="ml-3 text-2xl font-extrabold text-westmarc-midnight">Education</h2></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {isVisible('hsGraduationRate') && <DataCard title="High School Graduation Rate" value={`${data.education.hsGraduationRate.toFixed(1)}%`} />}
                    {isVisible('collegeGraduationRate') && <DataCard title="Bachelor's Degree or Higher" value={`${data.education.collegeGraduationRate.toFixed(1)}%`} />}
              </div>
              
              {/* Render specific cards for selected Enrollment breakdown */}
              {renderSelectedEnrollmentCards()}

              {(showAll || isVisible('hsGraduationRate') || isVisible('collegeGraduationRate') || hasAnyEnrollmentSelected) && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <ChartCard title="School Enrollment Breakdown">
                         {hasData(data.education.schoolEnrollment) ? (
                            <ResponsiveContainer>
                                <BarChart data={data.education.schoolEnrollment}>
                                    <XAxis dataKey="name" stroke="#4B4B4B" fontSize={12} />
                                    <YAxis stroke="#4B4B4B" fontSize={12} unit="%" />
                                    <Tooltip cursor={{ fill: 'rgba(104, 214, 156, 0.2)' }} formatter={(value: number) => `${value.toFixed(1)}%`} />
                                    <Bar dataKey="value" name="Percent of Total Enrolled" unit="%">
                                        <LabelList dataKey="value" position="top" formatter={(val: number) => `${val.toFixed(1)}%`} fontSize={11} />
                                        <Cell fill="#68D69C" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                         ) : <EmptyChartMessage />}
                    </ChartCard>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    );
};

export default Dashboard;
