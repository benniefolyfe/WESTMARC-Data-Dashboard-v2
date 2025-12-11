
import { WEST_VALLEY_ZIP_CODES } from '../constants';
import type { ZipCodeData, Demographics, Economics, LaborForce, Housing, Education, Commuting } from '../types';

// ACS 5-Year Data Profile variables
const CENSUS_YEAR = '2022';
const DATASET = 'acs/acs5/profile';
const HISTORICAL_YEAR = '2017'; // 5 years prior for growth calculation
const HISTORICAL_DATASET = 'acs/acs5'; // Use the more stable Detailed Tables for historical data
const HISTORICAL_POPULATION_VAR = 'B01003_001E'; // Canonical variable for Total Population in ACS5
const ARIZONA_STATE_FIPS = '04';


const VARIABLE_MAP = {
  // Demographics
  population: 'DP05_0001E',
  medianAge: 'DP05_0018E',
  totalMale: 'DP05_0002E',
  totalFemale: 'DP05_0003E',
  ageUnder5E: 'DP05_0005E',
  age5to9E: 'DP05_0006E',
  age10to14E: 'DP05_0007E',
  age15to19E: 'DP05_0008E',
  age20to24E: 'DP05_0009E',
  age25to34E: 'DP05_0010E',
  age35to44E: 'DP05_0011E',
  age45to54E: 'DP05_0012E',
  age55to59E: 'DP05_0013E',
  age60to64E: 'DP05_0014E',
  age65to74E: 'DP05_0015E',
  age75to84E: 'DP05_0016E',
  age85plusE: 'DP05_0017E',
  raceWhitePE: 'DP05_0037PE',
  raceBlackPE: 'DP05_0038PE',
  raceNativePE: 'DP05_0039PE',
  raceAsianPE: 'DP05_0044PE',
  raceIslanderPE: 'DP05_0052PE',
  raceTwoOrMorePE: 'DP05_0057PE',
  raceHispanicPE: 'DP05_0071PE',
  foreignBornPE: 'DP02_0094PE',
  
  // Economics
  medianHouseholdIncome: 'DP03_0062E',
  perCapitaIncome: 'DP03_0088E',
  povertyRatePE: 'DP03_0128PE', // Changed to "All people whose income in the past 12 months is below the poverty level"
  
  // Labor Force
  laborForceParticipationPE: 'DP03_0002PE',
  unemploymentRatePE: 'DP03_0009PE',
  occupationMgmtSciArtPE: 'DP03_0027PE',
  occupationServicePE: 'DP03_0028PE',
  occupationSalesOfficePE: 'DP03_0029PE',
  occupationNatResConstrMaintPE: 'DP03_0030PE',
  occupationProdTransMovingPE: 'DP03_0031PE',
  
  // Employment by Industry (Percentages)
  industryAgriMiningPE: 'DP03_0033PE',
  industryConstructionPE: 'DP03_0034PE',
  industryManufacturingPE: 'DP03_0035PE',
  industryWholesaleTradePE: 'DP03_0036PE',
  industryRetailTradePE: 'DP03_0037PE',
  industryTranspoWarehousingPE: 'DP03_0038PE',
  industryInformationPE: 'DP03_0039PE',
  industryFinanceInsRealEstatePE: 'DP03_0040PE',
  industryProfSciMgmtAdminPE: 'DP03_0041PE',
  industryEduHealthSocialPE: 'DP03_0042PE',
  industryArtsEntFoodPE: 'DP03_0043PE',
  industryOtherServicesPE: 'DP03_0044PE',
  industryPublicAdminPE: 'DP03_0045PE',
  
  // Housing
  medianHomeValue: 'DP04_0089E',
  ownerOccupiedRatePE: 'DP04_0046PE',
  medianGrossRent: 'DP04_0134E',
  rentCostBurden35PlusPE: 'DP04_0143PE',
  yearBuilt2020PlusPE: 'DP04_0017PE',   // Built 2020 or later
  yearBuilt2010to2019PE: 'DP04_0018PE', // Built 2010 to 2019
  yearBuilt2000to2009PE: 'DP04_0019PE',
  yearBuilt1980to1999PE: 'DP04_0020PE',
  yearBuilt1960to1979PE: 'DP04_0021PE',
  yearBuilt1940to1959PE: 'DP04_0022PE',
  yearBuiltBefore1940PE: 'DP04_0023PE',

  // Education
  hsGraduationRatePE: 'DP02_0066PE',
  collegeGraduationRatePE: 'DP02_0067PE',
  totalEnrolledInSchool: 'DP02_0052E',
  enrolledPreschool: 'DP02_0053E',
  enrolledKindergarten: 'DP02_0054E',
  enrolledGrade1to8: 'DP02_0055E', // Added missing Elementary variable
  enrolled9to12: 'DP02_0056E',
  enrolledCollege: 'DP02_0057E',

  // Commuting
  meanTravelTimeToWork: 'DP03_0025E',
  commuteDriveAlonePE: 'DP03_0019PE',
  commuteCarpoolPE: 'DP03_0020PE',
  commutePublicTransitPE: 'DP03_0021PE',
  commuteWalkPE: 'DP03_0022PE',
  commuteOtherPE: 'DP03_0023PE',
  commuteWorkFromHomePE: 'DP03_0024PE',
};

const zipToCityMap = Object.fromEntries(WEST_VALLEY_ZIP_CODES.map(item => [item.zip, item.city]));

const safeParseFloat = (value: string | undefined): number => {
    if (value === undefined || value === null || value ==='-') return 0;
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return 0;
    return num;
}

const fetchHistoricalPopulation = async (
  zips: string[]
): Promise<Record<string, number>> => {
  const results: Record<string, number> = {};

  await Promise.all(
    zips.map(async (zip) => {
      const url = `https://api.census.gov/data/${HISTORICAL_YEAR}/${HISTORICAL_DATASET}?get=NAME,${HISTORICAL_POPULATION_VAR}&for=zip%20code%20tabulation%20area:${zip}&in=state:${ARIZONA_STATE_FIPS}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Census API failed for historical data for ZIP ${zip}`, await response.text());
          results[zip] = 0;
          return;
        }
        
        const responseText = await response.text();
        if (!responseText) {
            console.warn(`Historical population response was empty for ZIP: ${zip}`);
            results[zip] = 0;
            return;
        }
        
        const data: string[][] = JSON.parse(responseText);

        if (!Array.isArray(data) || data.length < 2) {
          console.warn('Historical population response empty or malformed for ZIP:', zip);
          results[zip] = 0;
          return;
        }
        const headers = data[0];
        const popIndex = headers.indexOf(HISTORICAL_POPULATION_VAR);
        if (popIndex === -1) {
          console.error('Could not find required headers in historical data response.', { zip, headers });
          results[zip] = 0;
          return;
        }
        const row = data[1];
        const population = Number.parseFloat(row[popIndex] ?? '0');
        results[zip] = Number.isFinite(population) ? population : 0;
      } catch (error: unknown) {
        console.error(`Failed to fetch historical population data for ZIP ${zip}:`, error);
        results[zip] = 0;
      }
    })
  );
  return results;
};

const transformCensusRow = (
  rowData: Record<string, string>,
  historicalPopulations: Record<string, number>
): ZipCodeData | null => {
  const zip = rowData['zip code tabulation area'];
  if (!zip) return null;

  const city = zipToCityMap[zip] || 'N/A';

  const totalPopulation = safeParseFloat(rowData[VARIABLE_MAP.population]);
  if (totalPopulation === 0) return null;

  const pastPopulation = historicalPopulations[zip] ?? 0;
  
  const demographics: Demographics = {
    population: totalPopulation,
    populationGrowth: pastPopulation > 0 ? ((totalPopulation - pastPopulation) / pastPopulation) * 100 : NaN,
    medianAge: safeParseFloat(rowData[VARIABLE_MAP.medianAge]),
    genderDistribution: [
      { name: 'Male', value: safeParseFloat(rowData[VARIABLE_MAP.totalMale]) / totalPopulation * 100 },
      { name: 'Female', value: safeParseFloat(rowData[VARIABLE_MAP.totalFemale]) / totalPopulation * 100 },
    ],
    ageDistribution: [
        { name: '0-19', value: (safeParseFloat(rowData[VARIABLE_MAP.ageUnder5E]) + safeParseFloat(rowData[VARIABLE_MAP.age5to9E]) + safeParseFloat(rowData[VARIABLE_MAP.age10to14E]) + safeParseFloat(rowData[VARIABLE_MAP.age15to19E])) / totalPopulation * 100 },
        { name: '20-39', value: (safeParseFloat(rowData[VARIABLE_MAP.age20to24E]) + safeParseFloat(rowData[VARIABLE_MAP.age25to34E])) / totalPopulation * 100 },
        { name: '40-59', value: (safeParseFloat(rowData[VARIABLE_MAP.age35to44E]) + safeParseFloat(rowData[VARIABLE_MAP.age45to54E]) + safeParseFloat(rowData[VARIABLE_MAP.age55to59E])) / totalPopulation * 100 },
        { name: '60+', value: (safeParseFloat(rowData[VARIABLE_MAP.age60to64E]) + safeParseFloat(rowData[VARIABLE_MAP.age65to74E]) + safeParseFloat(rowData[VARIABLE_MAP.age75to84E]) + safeParseFloat(rowData[VARIABLE_MAP.age85plusE])) / totalPopulation * 100 },
    ],
    raceEthnicity: [
        { name: 'Hispanic', value: safeParseFloat(rowData[VARIABLE_MAP.raceHispanicPE]) },
        { name: 'White', value: safeParseFloat(rowData[VARIABLE_MAP.raceWhitePE]) },
        { name: 'Black', value: safeParseFloat(rowData[VARIABLE_MAP.raceBlackPE]) },
        { name: 'Asian', value: safeParseFloat(rowData[VARIABLE_MAP.raceAsianPE]) },
        { name: 'Native Am.', value: safeParseFloat(rowData[VARIABLE_MAP.raceNativePE]) },
        { name: 'Two+', value: safeParseFloat(rowData[VARIABLE_MAP.raceTwoOrMorePE]) },
    ],
    foreignBornShare: safeParseFloat(rowData[VARIABLE_MAP.foreignBornPE]),
  };
  
  const totalEnrolled = safeParseFloat(rowData[VARIABLE_MAP.totalEnrolledInSchool]);
  const education: Education = {
    hsGraduationRate: safeParseFloat(rowData[VARIABLE_MAP.hsGraduationRatePE]),
    collegeGraduationRate: safeParseFloat(rowData[VARIABLE_MAP.collegeGraduationRatePE]),
    schoolEnrollment: [
        { name: 'Preschool', value: totalEnrolled > 0 ? safeParseFloat(rowData[VARIABLE_MAP.enrolledPreschool]) / totalEnrolled * 100 : 0 },
        { name: 'Kindergarten', value: totalEnrolled > 0 ? safeParseFloat(rowData[VARIABLE_MAP.enrolledKindergarten]) / totalEnrolled * 100 : 0 },
        { name: 'Grade 1-8', value: totalEnrolled > 0 ? safeParseFloat(rowData[VARIABLE_MAP.enrolledGrade1to8]) / totalEnrolled * 100 : 0 },
        { name: 'High School', value: totalEnrolled > 0 ? safeParseFloat(rowData[VARIABLE_MAP.enrolled9to12]) / totalEnrolled * 100 : 0 },
        { name: 'College/Grad', value: totalEnrolled > 0 ? safeParseFloat(rowData[VARIABLE_MAP.enrolledCollege]) / totalEnrolled * 100 : 0 },
    ]
  };
  
  const medianHouseholdIncome = safeParseFloat(rowData[VARIABLE_MAP.medianHouseholdIncome]);
  const economics: Economics = {
      medianHouseholdIncome,
      perCapitaIncome: safeParseFloat(rowData[VARIABLE_MAP.perCapitaIncome]),
      povertyRate: safeParseFloat(rowData[VARIABLE_MAP.povertyRatePE]),
  };

  const laborForce: LaborForce = {
      laborForceParticipationRate: safeParseFloat(rowData[VARIABLE_MAP.laborForceParticipationPE]),
      unemploymentRate: safeParseFloat(rowData[VARIABLE_MAP.unemploymentRatePE]),
      occupationMix: [
          { name: 'Mgmt/Sci/Art', value: safeParseFloat(rowData[VARIABLE_MAP.occupationMgmtSciArtPE]) },
          { name: 'Service', value: safeParseFloat(rowData[VARIABLE_MAP.occupationServicePE]) },
          { name: 'Sales/Office', value: safeParseFloat(rowData[VARIABLE_MAP.occupationSalesOfficePE]) },
          { name: 'Construct/Maint', value: safeParseFloat(rowData[VARIABLE_MAP.occupationNatResConstrMaintPE]) },
          { name: 'Prod/Transport', value: safeParseFloat(rowData[VARIABLE_MAP.occupationProdTransMovingPE]) },
      ]
  };

  const employmentByIndustry = [
      { name: 'Agri/Mining', value: safeParseFloat(rowData[VARIABLE_MAP.industryAgriMiningPE]) },
      { name: 'Construction', value: safeParseFloat(rowData[VARIABLE_MAP.industryConstructionPE]) },
      { name: 'Manufacturing', value: safeParseFloat(rowData[VARIABLE_MAP.industryManufacturingPE]) },
      { name: 'Wholesale Trade', value: safeParseFloat(rowData[VARIABLE_MAP.industryWholesaleTradePE]) },
      { name: 'Retail Trade', value: safeParseFloat(rowData[VARIABLE_MAP.industryRetailTradePE]) },
      { name: 'Transport/Warehouse', value: safeParseFloat(rowData[VARIABLE_MAP.industryTranspoWarehousingPE]) },
      { name: 'Information', value: safeParseFloat(rowData[VARIABLE_MAP.industryInformationPE]) },
      { name: 'Finance/Ins/RE', value: safeParseFloat(rowData[VARIABLE_MAP.industryFinanceInsRealEstatePE]) },
      { name: 'Prof/Sci/Mgmt', value: safeParseFloat(rowData[VARIABLE_MAP.industryProfSciMgmtAdminPE]) },
      { name: 'Edu/Health/Social', value: safeParseFloat(rowData[VARIABLE_MAP.industryEduHealthSocialPE]) },
      { name: 'Arts/Ent/Food', value: safeParseFloat(rowData[VARIABLE_MAP.industryArtsEntFoodPE]) },
      { name: 'Other Services', value: safeParseFloat(rowData[VARIABLE_MAP.industryOtherServicesPE]) },
      { name: 'Public Admin', value: safeParseFloat(rowData[VARIABLE_MAP.industryPublicAdminPE]) },
  ];

  const medianHomeValue = safeParseFloat(rowData[VARIABLE_MAP.medianHomeValue]);
  const housing: Housing = {
      medianHomeValue,
      ownerOccupiedRate: safeParseFloat(rowData[VARIABLE_MAP.ownerOccupiedRatePE]),
      medianGrossRent: safeParseFloat(rowData[VARIABLE_MAP.medianGrossRent]),
      rentCostBurdenRate: safeParseFloat(rowData[VARIABLE_MAP.rentCostBurden35PlusPE]),
      priceToIncomeRatio: medianHouseholdIncome > 0 ? medianHomeValue / medianHouseholdIncome : 0,
      yearStructureBuilt: [
          { name: '2010+', value: safeParseFloat(rowData[VARIABLE_MAP.yearBuilt2010to2019PE]) + safeParseFloat(rowData[VARIABLE_MAP.yearBuilt2020PlusPE]) },
          { name: '2000-09', value: safeParseFloat(rowData[VARIABLE_MAP.yearBuilt2000to2009PE]) },
          { name: '1980-99', value: safeParseFloat(rowData[VARIABLE_MAP.yearBuilt1980to1999PE]) },
          { name: '1960-79', value: safeParseFloat(rowData[VARIABLE_MAP.yearBuilt1960to1979PE]) },
          { name: '<1960', value: safeParseFloat(rowData[VARIABLE_MAP.yearBuilt1940to1959PE]) + safeParseFloat(rowData[VARIABLE_MAP.yearBuiltBefore1940PE])},
      ]
  };

  const commuting: Commuting = {
      meanTravelTimeToWork: safeParseFloat(rowData[VARIABLE_MAP.meanTravelTimeToWork]),
      modeShare: [
          { name: 'Drive Alone', value: safeParseFloat(rowData[VARIABLE_MAP.commuteDriveAlonePE]) },
          { name: 'Carpool', value: safeParseFloat(rowData[VARIABLE_MAP.commuteCarpoolPE]) },
          { name: 'Public Transit', value: safeParseFloat(rowData[VARIABLE_MAP.commutePublicTransitPE]) },
          { name: 'Walk', value: safeParseFloat(rowData[VARIABLE_MAP.commuteWalkPE]) },
          { name: 'Work From Home', value: safeParseFloat(rowData[VARIABLE_MAP.commuteWorkFromHomePE]) },
          { name: 'Other', value: safeParseFloat(rowData[VARIABLE_MAP.commuteOtherPE]) },
      ]
  }

  return { zip, city, demographics, education, economics, laborForce, employmentByIndustry, housing, commuting };
};

async function fetchCensusData(variables: string[], zips: string): Promise<string[][]> {
    if (variables.length === 0) return [];
    const varsString = variables.join(',');
    const url = `https://api.census.gov/data/${CENSUS_YEAR}/${DATASET}?get=${varsString},NAME&for=zip%20code%20tabulation%20area:${zips}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Census API request failed for variables starting with ${variables[0].substring(0,4)}... with status ${response.status}: ${errorText}`);
        }
        return response.json();
    } catch (e) {
        console.error(`Error fetching variables starting with ${variables[0].substring(0,4)}:`, e);
        throw e;
    }
}

export const fetchAllWestValleyData = async (): Promise<
  Record<string, ZipCodeData>
> => {
  const uniqueZips = [...new Set(WEST_VALLEY_ZIP_CODES.map((z) => z.zip))];
  const zipListString = uniqueZips.join(',');

  try {
    const varGroups = {
        dp02: Object.entries(VARIABLE_MAP).filter(([, v]) => v.startsWith('DP02')).map(([, v]) => v),
        dp03: Object.entries(VARIABLE_MAP).filter(([, v]) => v.startsWith('DP03')).map(([, v]) => v),
        dp04: Object.entries(VARIABLE_MAP).filter(([, v]) => v.startsWith('DP04')).map(([, v]) => v),
        dp05: Object.entries(VARIABLE_MAP).filter(([, v]) => v.startsWith('DP05')).map(([, v]) => v),
    };

    const [dp02Data, dp03Data, dp04Data, dp05Data, historicalPopulations] = await Promise.all([
        fetchCensusData(varGroups.dp02, zipListString),
        fetchCensusData(varGroups.dp03, zipListString),
        fetchCensusData(varGroups.dp04, zipListString),
        fetchCensusData(varGroups.dp05, zipListString),
        fetchHistoricalPopulation(uniqueZips),
    ]);

    const allDataByZip: { [zip: string]: { [variableCode: string]: string } } = {};

    const processResponse = (data: string[][]) => {
        if (!data || data.length < 2) return;
        const headers = data[0];
        const zipCodeIndex = headers.indexOf('zip code tabulation area');
        if (zipCodeIndex === -1) return;

        data.slice(1).forEach(row => {
            const zip = row[zipCodeIndex];
            if (!allDataByZip[zip]) {
                allDataByZip[zip] = {};
            }
            headers.forEach((header, index) => {
                allDataByZip[zip][header] = row[index];
            });
        });
    };

    processResponse(dp02Data);
    processResponse(dp03Data);
    processResponse(dp04Data);
    processResponse(dp05Data);

    const transformedData = uniqueZips.reduce(
      (acc, zip) => {
        const rowData = allDataByZip[zip];
        if (rowData) {
          const zipData = transformCensusRow(rowData, historicalPopulations);
          if (zipData) {
            acc[zipData.zip] = zipData;
          }
        }
        return acc;
      },
      {} as Record<string, ZipCodeData>
    );

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch or transform Census data:', error);
    throw new Error(
      'Could not retrieve West Valley data from the Census Bureau API.'
    );
  }
};
