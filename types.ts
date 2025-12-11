export interface Demographics {
  population: number;
  populationGrowth: number;
  medianAge: number;
  genderDistribution: { name: string; value: number }[];
  ageDistribution: { name: string; value: number }[];
  raceEthnicity: { name: string; value: number }[];
  foreignBornShare: number;
}

export interface Education {
  hsGraduationRate: number;
  collegeGraduationRate: number;
  schoolEnrollment: { name: string; value: number }[];
}

export interface Economics {
    medianHouseholdIncome: number;
    perCapitaIncome: number;
    povertyRate: number;
}

export interface LaborForce {
    laborForceParticipationRate: number;
    unemploymentRate: number;
    occupationMix: { name: string; value: number }[];
}

export interface Housing {
  medianHomeValue: number;
  ownerOccupiedRate: number;
  medianGrossRent: number;
  rentCostBurdenRate: number;
  priceToIncomeRatio: number;
  yearStructureBuilt: { name: string; value: number }[];
}

export interface Commuting {
    meanTravelTimeToWork: number;
    modeShare: { name: string; value: number }[];
}

export interface ZipCodeData {
  zip: string;
  city: string;
  demographics: Demographics;
  education: Education;
  economics: Economics;
  laborForce: LaborForce;
  employmentByIndustry: { name: string; value: number }[];
  housing: Housing;
  commuting: Commuting;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}