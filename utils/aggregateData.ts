
import { ZipCodeData } from '../types';

export const aggregateZipData = (zips: ZipCodeData[]): ZipCodeData | null => {
  if (zips.length === 0) return null;
  if (zips.length === 1) return zips[0];

  const totalPopulation = zips.reduce((sum, zip) => sum + zip.demographics.population, 0);
  if (totalPopulation === 0) return zips[0]; // Avoid division by zero

  const weightedAverage = (getter: (zip: ZipCodeData) => number) => {
    const weightedSum = zips.reduce((sum, zip) => {
        const value = getter(zip);
        // Don't include NaN values (like for population growth) in the weighted average
        if (isNaN(value) || value === null) return sum;
        return sum + value * zip.demographics.population;
    }, 0);
    // Adjust total population for NaN exclusion
    const adjustedPopulation = zips.reduce((sum, zip) => {
        const value = getter(zip);
        if (isNaN(value) || value === null) return sum;
        return sum + zip.demographics.population;
    }, 0);
    return adjustedPopulation > 0 ? weightedSum / adjustedPopulation : 0;
  };
  
  const aggregateCategorical = (getter: (zip: ZipCodeData) => { name: string, value: number }[]) => {
    const combined: { [name: string]: number } = {};
    
    zips.forEach(zip => {
        const categoryList = getter(zip);
        if (Array.isArray(categoryList)) {
            categoryList.forEach(item => {
                if (!combined[item.name]) {
                    combined[item.name] = 0;
                }
                combined[item.name] += (item.value / 100) * zip.demographics.population;
            });
        }
    });
    
    return Object.entries(combined).map(([name, totalValue]) => ({
        name,
        value: totalPopulation > 0 ? (totalValue / totalPopulation) * 100 : 0
    }));
  };

  const aggregateSum = (getter: (zip: ZipCodeData) => { name: string, value: number }[]) => {
    const combined: { [name: string]: number } = {};
    zips.forEach(zip => {
        const list = getter(zip);
        if (Array.isArray(list)) {
            list.forEach(item => {
                combined[item.name] = (combined[item.name] || 0) + item.value;
            });
        }
    });
    return Object.entries(combined).map(([name, value]) => ({ name, value }));
  };

  const medianHomeValue = weightedAverage(z => z.housing.medianHomeValue);
  const medianHouseholdIncome = weightedAverage(z => z.economics.medianHouseholdIncome);

  const combined: ZipCodeData = {
    zip: 'Multiple',
    city: 'Multiple Regions',
    demographics: {
      population: totalPopulation,
      populationGrowth: weightedAverage(z => z.demographics.populationGrowth),
      medianAge: weightedAverage(z => z.demographics.medianAge),
      genderDistribution: aggregateCategorical(z => z.demographics.genderDistribution),
      ageDistribution: aggregateCategorical(z => z.demographics.ageDistribution),
      raceEthnicity: aggregateCategorical(z => z.demographics.raceEthnicity),
      foreignBornShare: weightedAverage(z => z.demographics.foreignBornShare),
    },
    education: {
      hsGraduationRate: weightedAverage(z => z.education.hsGraduationRate),
      collegeGraduationRate: weightedAverage(z => z.education.collegeGraduationRate),
      schoolEnrollment: aggregateSum(z => z.education.schoolEnrollment) // Use Sum for raw counts
    },
    economics: {
        medianHouseholdIncome,
        perCapitaIncome: weightedAverage(z => z.economics.perCapitaIncome),
        povertyRate: weightedAverage(z => z.economics.povertyRate),
    },
    laborForce: {
        laborForceParticipationRate: weightedAverage(z => z.laborForce.laborForceParticipationRate),
        unemploymentRate: weightedAverage(z => z.laborForce.unemploymentRate),
        occupationMix: aggregateCategorical(z => z.laborForce.occupationMix),
    },
    employmentByIndustry: aggregateCategorical(z => z.employmentByIndustry),
    housing: {
      medianHomeValue,
      ownerOccupiedRate: weightedAverage(z => z.housing.ownerOccupiedRate),
      medianGrossRent: weightedAverage(z => z.housing.medianGrossRent),
      rentCostBurdenRate: weightedAverage(z => z.housing.rentCostBurdenRate),
      priceToIncomeRatio: medianHouseholdIncome > 0 ? medianHomeValue / medianHouseholdIncome : 0,
      yearStructureBuilt: aggregateCategorical(z => z.housing.yearStructureBuilt),
    },
    commuting: {
        meanTravelTimeToWork: weightedAverage(z => z.commuting.meanTravelTimeToWork),
        modeShare: aggregateCategorical(z => z.commuting.modeShare),
    }
  };

  return combined;
};
