// src/utils/metricUtils.ts
import type { ZipCodeData } from '../types';
import type { MetricId } from '../metrics';
import { METRICS } from '../metrics';

export interface MetricResult {
  valuesByZip: Record<string, number | null>;
  domain: [number, number] | null;
}

export function computeMetricForZips(
  metricId: MetricId,
  zipDataByZip: Record<string, ZipCodeData>
): MetricResult {
  const cfg = METRICS[metricId];
  if (!cfg) {
    return { valuesByZip: {}, domain: null };
  }


  const valuesByZip: Record<string, number | null> = {};
  const numericValues: number[] = [];

  for (const [zip, data] of Object.entries(zipDataByZip)) {
    const v = cfg.getValue(data);
    if (v == null || Number.isNaN(v)) {
      valuesByZip[zip] = null;
    } else {
      valuesByZip[zip] = v;
      numericValues.push(v);
    }
  }

  if (numericValues.length === 0) {
    return { valuesByZip, domain: null };
  }

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);

  return { valuesByZip, domain: [min, max] };
}