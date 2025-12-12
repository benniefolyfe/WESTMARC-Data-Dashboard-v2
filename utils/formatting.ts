
import { WEST_VALLEY_ZIP_CODES } from '../constants';
import { MetricConfig, MetricId } from '../metrics';

export const formatZipSelection = (selectedZips: string[]): string => {
  if (selectedZips.length === 0) return 'Select cities or zip codes';
  
  // Group all available zips by city
  const cityMap: Record<string, string[]> = {};
  WEST_VALLEY_ZIP_CODES.forEach(({zip, city}) => {
    if (!cityMap[city]) cityMap[city] = [];
    cityMap[city].push(zip);
  });

  // Group selected zips by city
  const selectedByCity: Record<string, string[]> = {};
  selectedZips.forEach(zip => {
     const city = WEST_VALLEY_ZIP_CODES.find(z => z.zip === zip)?.city || 'Unknown';
     if (!selectedByCity[city]) selectedByCity[city] = [];
     selectedByCity[city].push(zip);
  });

  const parts: string[] = [];
  const sortedCities = Object.keys(selectedByCity).sort();
  
  sortedCities.forEach(city => {
      const selected = selectedByCity[city];
      const total = cityMap[city];
      
      if (total && selected.length === total.length) {
          parts.push(`${city} (All)`);
      } else {
          // Sort numerically for consistency
          parts.push(`${city} (${selected.sort().join(', ')})`);
      }
  });

  return parts.join(', ');
};

export const formatMetricSelection = (selectedIds: MetricId[], metrics: Record<MetricId, MetricConfig>): string => {
    if (selectedIds.length === 0) return 'Select data metrics';
    
    const allMetricIds = Object.keys(metrics);
    if (selectedIds.length === allMetricIds.length) return 'All Metrics';
  
    // Group definitions from config
    const groups: Record<string, string[]> = {};
    Object.values(metrics).forEach(m => {
        if (!groups[m.group]) groups[m.group] = [];
        groups[m.group].push(m.id);
    });
  
    const selectedSet = new Set(selectedIds);
    const parts: string[] = [];
    // Define preferred order
    const orderedGroups = ['Demographics', 'Economics & Labor', 'Housing & Commuting', 'Education'];
  
    orderedGroups.forEach(group => {
        const groupMetricIds = groups[group] || [];
        if (groupMetricIds.length === 0) return;
  
        const selectedInGroup = groupMetricIds.filter(id => selectedSet.has(id));
        if (selectedInGroup.length === 0) return;
  
        if (selectedInGroup.length === groupMetricIds.length) {
            parts.push(`All ${group}`);
        } else {
            // Special handling for "Economics & Labor" which has a large "Employment by Industry" subgroup
            if (group === 'Economics & Labor') {
                const industryIds = groupMetricIds.filter(id => id.startsWith('employmentByIndustry:'));
                const selectedIndustryIds = selectedInGroup.filter(id => id.startsWith('employmentByIndustry:'));
                
                const nonIndustryIds = groupMetricIds.filter(id => !id.startsWith('employmentByIndustry:'));
                const selectedNonIndustryIds = selectedInGroup.filter(id => !id.startsWith('employmentByIndustry:'));
                
                const subParts: string[] = [];
                
                // Add selected non-industry metrics
                if (selectedNonIndustryIds.length > 0) {
                     subParts.push(...selectedNonIndustryIds.map(id => metrics[id].label));
                }
  
                // Handle industries collapse
                if (selectedIndustryIds.length > 0) {
                    if (selectedIndustryIds.length === industryIds.length) {
                        subParts.push('All Industries');
                    } else {
                        // For individual industries, shorten the label to save space
                        subParts.push(...selectedIndustryIds.map(id => metrics[id].label.replace('Employment: ', '').replace(' (%)', '')));
                    }
                }
                
                if (subParts.length > 0) parts.push(subParts.join(', '));
  
            } else {
                // Standard listing for other groups
                 parts.push(selectedInGroup.map(id => metrics[id].label).join(', '));
            }
        }
    });
  
    return parts.join('; ');
};
