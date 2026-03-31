/**
 * Tests for ICH E2B(R3) ICSR Structure and Field Mapping
 *
 * Based on ICH E2B(R3) Implementation Guide and OpenRIMS-PV
 * CreateE2BForSpontaneousCommandHandler patterns.
 */

import {
  createE2BMessageHeader,
  createE2BSafetyReport,
  createE2BPrimarySource,
  createE2BPatient,
  createE2BReaction,
  createE2BDrug,
  mapReporterQualification,
  mapOutcomeToE2B,
  mapDrugCharacterization,
  E2B_ELEMENT_GUIDS,
} from '../e2b';
import { classifySeriousness, getSeriousnessE2BFields } from '../seriousness';

describe('E2B Message Header (N.1/N.2)', () => {
  it('should create message header with required fields', () => {
    const header = createE2BMessageHeader({
      messageNumber: 1,
      senderIdentifier: 'NV.GUARDIAN',
    });

    expect(header.messageIdentifier).toMatch(/^NV\.GUARDIAN-\d+-\d{8}$/);
    expect(header.messageFormatVersion).toBe('2.1');
    expect(header.messageFormatRelease).toBe('R3');
    expect(header.messageType).toBe('1'); // 1 = ICSR
    expect(header.messageDateFormat).toBe('204'); // CCYYMMDDHHMMSS
  });

  it('should generate batch number correctly', () => {
    const header = createE2BMessageHeader({
      messageNumber: 42,
      senderIdentifier: 'TEST.ORG',
    });

    expect(header.batchNumber).toMatch(/^TEST\.ORG-B\d{8}-\d+$/);
  });

  it('should include transmission date in correct format', () => {
    const header = createE2BMessageHeader({
      messageNumber: 1,
      senderIdentifier: 'NV.GUARDIAN',
    });

    // Format: CCYYMMDDHHMMSS (14 digits)
    expect(header.transmissionDate).toMatch(/^\d{14}$/);
  });
});

describe('E2B Safety Report (C.1)', () => {
  it('should create safety report with unique identifier', () => {
    const report = createE2BSafetyReport({
      reportId: 123,
      countryCode: 'US',
      senderOrganization: 'NV.GUARDIAN',
    });

    expect(report.safetyReportId).toMatch(/^US-NV\.GUARDIAN-\d{4}-000123$/);
    expect(report.reportType).toBe('1'); // 1 = Spontaneous
    expect(report.serious).toBeDefined();
  });

  it('should map seriousness criteria to E2B fields', () => {
    const report = createE2BSafetyReport({
      reportId: 1,
      countryCode: 'US',
      senderOrganization: 'TEST',
      seriousnessCriteria: ['death', 'hospitalization'],
    });

    expect(report.serious).toBe('1');
    expect(report.seriousnessResultInDeath).toBe('1=Yes');
    expect(report.seriousnessHospitalization).toBe('1=Yes');
    expect(report.seriousnessLifeThreatening).toBe('2=No');
  });

  it('should mark non-serious report correctly', () => {
    const report = createE2BSafetyReport({
      reportId: 1,
      countryCode: 'US',
      senderOrganization: 'TEST',
      seriousnessCriteria: [],
    });

    expect(report.serious).toBe('2');
    expect(report.seriousnessResultInDeath).toBe('2=No');
  });
});

describe('E2B Primary Source (C.2)', () => {
  it('should split full name into given and family names', () => {
    const source = createE2BPrimarySource({
      reporterName: 'John Smith',
      qualification: 'physician',
    });

    expect(source.reporterGivenName).toBe('John');
    expect(source.reporterFamilyName).toBe('Smith');
  });

  it('should handle single-word names', () => {
    const source = createE2BPrimarySource({
      reporterName: 'Madonna',
      qualification: 'consumer',
    });

    expect(source.reporterGivenName).toBe('Madonna');
    expect(source.reporterFamilyName).toBeUndefined();
  });

  it('should map qualification codes correctly', () => {
    expect(mapReporterQualification('physician')).toBe('1=Physician');
    expect(mapReporterQualification('pharmacist')).toBe('2=Pharmacist');
    expect(mapReporterQualification('other_health_professional')).toBe('3=Other Health Professional');
    expect(mapReporterQualification('lawyer')).toBe('4=Lawyer');
    expect(mapReporterQualification('consumer')).toBe('5=Consumer or other non health professional');
    expect(mapReporterQualification('unknown')).toBe('5=Consumer or other non health professional');
  });
});

describe('E2B Patient (D)', () => {
  it('should format birthdate correctly', () => {
    const patient = createE2BPatient({
      dateOfBirth: new Date('1985-06-15'),
      sex: 'male',
    });

    expect(patient.patientBirthdate).toBe('19850615');
    expect(patient.patientSex).toBe('1=Male');
  });

  it('should calculate age at onset', () => {
    const patient = createE2BPatient({
      dateOfBirth: new Date('1985-06-15'),
      onsetDate: new Date('2023-06-15'),
      sex: 'female',
    });

    expect(patient.patientOnsetAge).toBe('38');
    expect(patient.patientOnsetAgeUnit).toBe('801=Year');
    expect(patient.patientSex).toBe('2=Female');
  });

  it('should handle patient initials', () => {
    const patient = createE2BPatient({
      initials: 'J.S.',
      sex: 'unknown',
    });

    expect(patient.patientInitials).toBe('J.S.');
    expect(patient.patientSex).toBe('0=Unknown');
  });

  it('should include weight when provided', () => {
    const patient = createE2BPatient({
      weight: 70.5,
      sex: 'male',
    });

    expect(patient.patientWeight).toBe('70.5');
  });
});

describe('E2B Reaction (E.i)', () => {
  it('should create reaction with MedDRA term', () => {
    const reaction = createE2BReaction({
      reactionDescription: 'Severe headache after medication',
      meddraLLT: 'Headache',
      meddraLLTCode: '10019211',
    });

    expect(reaction.reactionAsReported).toBe('Severe headache after medication');
    expect(reaction.reactionMedDRALLT).toBe('Headache');
    expect(reaction.reactionMedDRACode).toBe('10019211');
  });

  it('should format reaction dates correctly', () => {
    const reaction = createE2BReaction({
      reactionDescription: 'Rash',
      onsetDate: new Date('2023-05-01'),
      endDate: new Date('2023-05-10'),
    });

    expect(reaction.reactionStartDate).toBe('20230501');
    expect(reaction.reactionEndDate).toBe('20230510');
    expect(reaction.reactionDuration).toBe('9');
    expect(reaction.reactionDurationUnit).toBe('804=Day');
  });

  it('should map outcome codes correctly', () => {
    expect(mapOutcomeToE2B('recovered')).toBe('1=recovered/resolved');
    expect(mapOutcomeToE2B('recovering')).toBe('2=recovering/resolving');
    expect(mapOutcomeToE2B('not_recovered')).toBe('3=not recovered/not resolved/ongoing');
    expect(mapOutcomeToE2B('recovered_with_sequelae')).toBe('4=recovered/resolved with sequelae');
    expect(mapOutcomeToE2B('fatal')).toBe('5=fatal');
    expect(mapOutcomeToE2B('unknown')).toBe('0=unknown');
  });
});

describe('E2B Drug (G.k)', () => {
  it('should create drug entry with characterization', () => {
    const drug = createE2BDrug({
      drugName: 'Aspirin 100mg',
      characterization: 'suspect',
    });

    expect(drug.medicinalProduct).toBe('Aspirin 100mg');
    expect(drug.drugCharacterization).toBe('1=Suspect');
  });

  it('should map drug characterization correctly', () => {
    expect(mapDrugCharacterization('suspect')).toBe('1=Suspect');
    expect(mapDrugCharacterization('concomitant')).toBe('2=Concomitant');
    expect(mapDrugCharacterization('interacting')).toBe('3=Interacting');
    expect(mapDrugCharacterization('not_administered')).toBe('4=Drug Not Administered');
  });

  it('should format drug dates correctly', () => {
    const drug = createE2BDrug({
      drugName: 'Ibuprofen',
      characterization: 'suspect',
      startDate: new Date('2023-04-01'),
      endDate: new Date('2023-04-10'),
    });

    expect(drug.drugStartDate).toBe('20230401');
    expect(drug.drugEndDate).toBe('20230410');
    expect(drug.drugTreatmentDuration).toBe('9');
    expect(drug.drugTreatmentDurationUnit).toBe('804=Day');
  });

  it('should include batch number when provided', () => {
    const drug = createE2BDrug({
      drugName: 'Vaccine X',
      characterization: 'suspect',
      batchNumber: 'LOT123456',
    });

    expect(drug.batchNumber).toBe('LOT123456');
  });

  it('should include dosage information', () => {
    const drug = createE2BDrug({
      drugName: 'Metformin',
      characterization: 'suspect',
      dosage: 500,
      dosageUnit: 'mg',
      dosageText: '500mg twice daily',
    });

    expect(drug.structuredDosage).toBe('500');
    expect(drug.structuredDosageUnit).toBe('mg');
    expect(drug.drugDosageText).toBe('500mg twice daily');
  });

  it('should include causality assessment', () => {
    const drug = createE2BDrug({
      drugName: 'Drug A',
      characterization: 'suspect',
      causalityMethod: 'WHO Causality Scale',
      causalityResult: 'Probable',
    });

    expect(drug.assessmentMethod).toBe('WHO Causality Scale');
    expect(drug.assessmentResult).toBe('Probable');
  });
});

describe('E2B Element GUIDs (OpenRIMS compatibility)', () => {
  it('should have correct GUIDs for seriousness fields', () => {
    expect(E2B_ELEMENT_GUIDS.seriousnessResultInDeath).toBe('B4EA6CBF-2D9C-482D-918A-36ABB0C96EFA');
    expect(E2B_ELEMENT_GUIDS.seriousnessLifeThreatening).toBe('26C6F08E-B80B-411E-BFDC-0506FE102253');
    expect(E2B_ELEMENT_GUIDS.seriousnessHospitalization).toBe('837154A9-D088-41C6-A9E2-8A0231128496');
    expect(E2B_ELEMENT_GUIDS.seriousnessDisabling).toBe('DDEBDEC0-2A90-49C7-970E-B7855CFDF19D');
    expect(E2B_ELEMENT_GUIDS.seriousnessCongenitalAnomaly).toBe('DF89C98B-1D2A-4C8E-A753-02E265841F4F');
    expect(E2B_ELEMENT_GUIDS.seriousnessOther).toBe('33A75547-EF1B-42FB-8768-CD6EC52B24F8');
    expect(E2B_ELEMENT_GUIDS.serious).toBe('510EB752-2D75-4DC3-8502-A4FCDC8A621A');
  });

  it('should have correct GUIDs for patient fields', () => {
    expect(E2B_ELEMENT_GUIDS.patientInitials).toBe('A0BEAB3A-0B0A-457E-B190-1B66FE60CA73');
  });

  it('should have correct GUIDs for reaction fields', () => {
    expect(E2B_ELEMENT_GUIDS.reactionMedDRALLT).toBe('C8DD9A5E-BD9A-488D-8ABF-171271F5D370');
    expect(E2B_ELEMENT_GUIDS.reactionStartDate).toBe('1EAD9E11-60E6-4B27-9A4D-4B296B169E90');
    expect(E2B_ELEMENT_GUIDS.reactionEndDate).toBe('3A0F240E-8B36-48F6-9527-77E55F6E7CF1');
  });
});

describe('Integration with existing PV utilities', () => {
  it('should use seriousness utility for E2B field generation', () => {
    // Test that our existing seriousness utility integrates
    const classification = classifySeriousness(['death', 'hospitalization']);
    const e2bFields = getSeriousnessE2BFields(classification.criteria);

    expect(e2bFields.serious).toBe('1');
    expect(e2bFields.seriousnessResultInDeath).toBe('1=Yes');
    expect(e2bFields.seriousnessHospitalization).toBe('1=Yes');

    // These should integrate into createE2BSafetyReport
    const report = createE2BSafetyReport({
      reportId: 1,
      countryCode: 'US',
      senderOrganization: 'TEST',
      seriousnessCriteria: classification.criteria,
    });

    expect(report.serious).toBe(e2bFields.serious);
    expect(report.seriousnessResultInDeath).toBe(e2bFields.seriousnessResultInDeath);
  });
});
