/**
 * Tests for ICH E2B Seriousness Criteria Utility
 *
 * Based on ICH E2B(R3) A.1.5.2 seriousness criteria
 * and OpenRIMS-PV MapSafetyReportRelatedFields logic
 */

import {
  classifySeriousness,
  getSeriousnessE2BFields,
  isSeriousEvent,
  SERIOUSNESS_CRITERIA,
} from '../seriousness';

describe('classifySeriousness', () => {
  it('should classify death as serious', () => {
    const result = classifySeriousness(['death']);
    expect(result.isSerious).toBe(true);
    expect(result.criteria).toContain('death');
    expect(result.e2bSeriousCode).toBe('1');
  });

  it('should classify life-threatening as serious', () => {
    const result = classifySeriousness(['life_threatening']);
    expect(result.isSerious).toBe(true);
    expect(result.criteria).toContain('life_threatening');
  });

  it('should classify hospitalization as serious', () => {
    const result = classifySeriousness(['hospitalization']);
    expect(result.isSerious).toBe(true);
    expect(result.criteria).toContain('hospitalization');
  });

  it('should classify disability as serious', () => {
    const result = classifySeriousness(['disability']);
    expect(result.isSerious).toBe(true);
    expect(result.criteria).toContain('disability');
  });

  it('should classify congenital anomaly as serious', () => {
    const result = classifySeriousness(['congenital_anomaly']);
    expect(result.isSerious).toBe(true);
    expect(result.criteria).toContain('congenital_anomaly');
  });

  it('should classify other medically important as serious', () => {
    const result = classifySeriousness(['other_medically_important']);
    expect(result.isSerious).toBe(true);
    expect(result.criteria).toContain('other_medically_important');
  });

  it('should handle multiple criteria', () => {
    const result = classifySeriousness(['death', 'hospitalization']);
    expect(result.isSerious).toBe(true);
    expect(result.criteria).toHaveLength(2);
    expect(result.criteria).toContain('death');
    expect(result.criteria).toContain('hospitalization');
  });

  it('should classify empty array as non-serious', () => {
    const result = classifySeriousness([]);
    expect(result.isSerious).toBe(false);
    expect(result.criteria).toHaveLength(0);
    expect(result.e2bSeriousCode).toBe('2');
  });
});

describe('getSeriousnessE2BFields', () => {
  it('should return all No for non-serious event', () => {
    const fields = getSeriousnessE2BFields([]);
    expect(fields.seriousnessResultInDeath).toBe('2=No');
    expect(fields.seriousnessLifeThreatening).toBe('2=No');
    expect(fields.seriousnessHospitalization).toBe('2=No');
    expect(fields.seriousnessDisabling).toBe('2=No');
    expect(fields.seriousnessCongenitalAnomaly).toBe('2=No');
    expect(fields.seriousnessOther).toBe('2=No');
    expect(fields.serious).toBe('2');
  });

  it('should return Yes for death criterion', () => {
    const fields = getSeriousnessE2BFields(['death']);
    expect(fields.seriousnessResultInDeath).toBe('1=Yes');
    expect(fields.seriousnessLifeThreatening).toBe('2=No');
    expect(fields.serious).toBe('1');
  });

  it('should return Yes for life-threatening criterion', () => {
    const fields = getSeriousnessE2BFields(['life_threatening']);
    expect(fields.seriousnessLifeThreatening).toBe('1=Yes');
    expect(fields.seriousnessResultInDeath).toBe('2=No');
    expect(fields.serious).toBe('1');
  });

  it('should return Yes for hospitalization criterion', () => {
    const fields = getSeriousnessE2BFields(['hospitalization']);
    expect(fields.seriousnessHospitalization).toBe('1=Yes');
    expect(fields.serious).toBe('1');
  });

  it('should return Yes for disability criterion', () => {
    const fields = getSeriousnessE2BFields(['disability']);
    expect(fields.seriousnessDisabling).toBe('1=Yes');
    expect(fields.serious).toBe('1');
  });

  it('should return Yes for congenital anomaly criterion', () => {
    const fields = getSeriousnessE2BFields(['congenital_anomaly']);
    expect(fields.seriousnessCongenitalAnomaly).toBe('1=Yes');
    expect(fields.serious).toBe('1');
  });

  it('should return Yes for other medically important criterion', () => {
    const fields = getSeriousnessE2BFields(['other_medically_important']);
    expect(fields.seriousnessOther).toBe('1=Yes');
    expect(fields.serious).toBe('1');
  });

  it('should handle multiple criteria correctly', () => {
    const fields = getSeriousnessE2BFields(['death', 'hospitalization', 'disability']);
    expect(fields.seriousnessResultInDeath).toBe('1=Yes');
    expect(fields.seriousnessHospitalization).toBe('1=Yes');
    expect(fields.seriousnessDisabling).toBe('1=Yes');
    expect(fields.seriousnessLifeThreatening).toBe('2=No');
    expect(fields.seriousnessCongenitalAnomaly).toBe('2=No');
    expect(fields.seriousnessOther).toBe('2=No');
    expect(fields.serious).toBe('1');
  });
});

describe('isSeriousEvent', () => {
  it('should return true for any serious criterion', () => {
    expect(isSeriousEvent(['death'])).toBe(true);
    expect(isSeriousEvent(['life_threatening'])).toBe(true);
    expect(isSeriousEvent(['hospitalization'])).toBe(true);
    expect(isSeriousEvent(['disability'])).toBe(true);
    expect(isSeriousEvent(['congenital_anomaly'])).toBe(true);
    expect(isSeriousEvent(['other_medically_important'])).toBe(true);
  });

  it('should return false for empty criteria', () => {
    expect(isSeriousEvent([])).toBe(false);
  });
});

describe('SERIOUSNESS_CRITERIA', () => {
  it('should have 6 criteria defined', () => {
    expect(SERIOUSNESS_CRITERIA).toHaveLength(6);
  });

  it('should have correct E2B codes', () => {
    const death = SERIOUSNESS_CRITERIA.find(c => c.code === 'death');
    expect(death?.e2bField).toBe('A.1.5.2a');

    const lifeThreatening = SERIOUSNESS_CRITERIA.find(c => c.code === 'life_threatening');
    expect(lifeThreatening?.e2bField).toBe('A.1.5.2b');
  });

  it('should have OpenRIMS-compatible labels', () => {
    const hospitalization = SERIOUSNESS_CRITERIA.find(c => c.code === 'hospitalization');
    expect(hospitalization?.label).toContain('hospitalization');
  });
});
