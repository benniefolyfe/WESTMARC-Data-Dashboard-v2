
import type { ZipCodeData } from './types';

export type MetricId = string;

export interface MetricConfig {
  id: MetricId;
  label: string;
  group: 'Demographics' | 'Economics & Labor' | 'Housing & Commuting' | 'Education';
  format?: 'currency' | 'percent' | 'number';
  getValue: (zip: ZipCodeData) => number | null;
}

const industryList: string[] = ['Agri/Mining', 'Construction', 'Manufacturing', 'Wholesale Trade', 'Retail Trade', 'Transport/Warehouse', 'Information', 'Finance/Ins/RE', 'Prof/Sci/Mgmt', 'Edu/Health/Social', 'Arts/Ent/Food', 'Other Services', 'Public Admin'];

const BASE_METRICS: Record<MetricId, MetricConfig> = {
  // Demographics
  population: { id: 'population', label: 'Population', group: 'Demographics', format: 'number', getValue: (z) => z.demographics.population },
  populationGrowth: { id: 'populationGrowth', label: 'Population Growth (%)', group: 'Demographics', format: 'percent', getValue: (z) => z.demographics.populationGrowth },
  medianAge: { id: 'medianAge', label: 'Median Age', group: 'Demographics', format: 'number', getValue: (z) => z.demographics.medianAge },
  foreignBornShare: { id: 'foreignBornShare', label: 'Foreign-Born Share (%)', group: 'Demographics', format: 'percent', getValue: (z) => z.demographics.foreignBornShare },
  
  // Economics & Labor
  medianHouseholdIncome: { id: 'medianHouseholdIncome', label: 'Median Household Income', group: 'Economics & Labor', format: 'currency', getValue: (z) => z.economics.medianHouseholdIncome },
  perCapitaIncome: { id: 'perCapitaIncome', label: 'Per Capita Income', group: 'Economics & Labor', format: 'currency', getValue: (z) => z.economics.perCapitaIncome },
  povertyRate: { id: 'povertyRate', label: 'Poverty Rate (%)', group: 'Economics & Labor', format: 'percent', getValue: (z) => z.economics.povertyRate },
  laborForceParticipationRate: { id: 'laborForceParticipationRate', label: 'Labor Force Participation (%)', group: 'Economics & Labor', format: 'percent', getValue: (z) => z.laborForce.laborForceParticipationRate },
  unemploymentRate: { id: 'unemploymentRate', label: 'Unemployment Rate (%)', group: 'Economics & Labor', format: 'percent', getValue: (z) => z.laborForce.unemploymentRate },

  // Housing & Commuting
  medianHomeValue: { id: 'medianHomeValue', label: 'Median Home Value', group: 'Housing & Commuting', format: 'currency', getValue: (z) => z.housing.medianHomeValue },
  ownerOccupiedRate: { id: 'ownerOccupiedRate', label: 'Owner-Occupied Housing Rate (%)', group: 'Housing & Commuting', format: 'percent', getValue: (z) => z.housing.ownerOccupiedRate },
  medianGrossRent: { id: 'medianGrossRent', label: 'Median Gross Rent', group: 'Housing & Commuting', format: 'currency', getValue: (z) => z.housing.medianGrossRent },
  rentCostBurdenRate: { id: 'rentCostBurdenRate', label: 'Rent Cost Burden (>35%)', group: 'Housing & Commuting', format: 'percent', getValue: (z) => z.housing.rentCostBurdenRate },
  priceToIncomeRatio: { id: 'priceToIncomeRatio', label: 'Price-to-Income Ratio', group: 'Housing & Commuting', format: 'number', getValue: (z) => z.housing.priceToIncomeRatio },
  meanTravelTimeToWork: { id: 'meanTravelTimeToWork', label: 'Mean Travel Time to Work (min)', group: 'Housing & Commuting', format: 'number', getValue: (z) => z.commuting.meanTravelTimeToWork },
  
  // Education
  hsGraduationRate: { id: 'hsGraduationRate', label: 'High School Graduation Rate (%)', group: 'Education', format: 'percent', getValue: (z) => z.education.hsGraduationRate },
  collegeGraduationRate: { id: 'collegeGraduationRate', label: "Bachelor's Degree or Higher (%)", group: 'Education', format: 'percent', getValue: (z) => z.education.collegeGraduationRate },
  
  // Enrollment Breakdown (Metrics now calculated as % of Total Population for better comparison)
  // Data stores raw count, so we divide by total population * 100
  enrollmentPreschool: { id: 'enrollmentPreschool', label: 'Enrolled: Preschool (% of Pop)', group: 'Education', format: 'percent', getValue: (z) => z.demographics.population > 0 ? ((z.education.schoolEnrollment.find(x => x.name === 'Preschool')?.value || 0) / z.demographics.population) * 100 : 0 },
  enrollmentKindergarten: { id: 'enrollmentKindergarten', label: 'Enrolled: Kindergarten (% of Pop)', group: 'Education', format: 'percent', getValue: (z) => z.demographics.population > 0 ? ((z.education.schoolEnrollment.find(x => x.name === 'Kindergarten')?.value || 0) / z.demographics.population) * 100 : 0 },
  enrollmentGrade1to8: { id: 'enrollmentGrade1to8', label: 'Enrolled: Grade 1-8 (% of Pop)', group: 'Education', format: 'percent', getValue: (z) => z.demographics.population > 0 ? ((z.education.schoolEnrollment.find(x => x.name === 'Grade 1-8')?.value || 0) / z.demographics.population) * 100 : 0 },
  enrollmentHighSchool: { id: 'enrollmentHighSchool', label: 'Enrolled: High School (% of Pop)', group: 'Education', format: 'percent', getValue: (z) => z.demographics.population > 0 ? ((z.education.schoolEnrollment.find(x => x.name === 'High School')?.value || 0) / z.demographics.population) * 100 : 0 },
  enrollmentCollege: { id: 'enrollmentCollege', label: 'Enrolled: College/Grad (% of Pop)', group: 'Education', format: 'percent', getValue: (z) => z.demographics.population > 0 ? ((z.education.schoolEnrollment.find(x => x.name === 'College/Grad')?.value || 0) / z.demographics.population) * 100 : 0 },

};

const industryMetrics = Object.fromEntries(
    industryList.map(industryName => {
        const metricId = `employmentByIndustry:${industryName}`;
        return [
            metricId,
            {
                id: metricId,
                label: `Employment: ${industryName} (%)`,
                group: 'Economics & Labor',
                format: 'percent',
                getValue: (zip: ZipCodeData) => {
                    const match = zip.employmentByIndustry.find(
                        (i) => i.name === industryName
                    );
                    return match ? match.value : 0;
                },
            } as MetricConfig
        ]
    })
);

export const METRICS: Record<MetricId, MetricConfig> = {
    ...BASE_METRICS,
    ...industryMetrics,
};

// For MetricSelector grouping
export const ALL_INDUSTRIES = industryList;
