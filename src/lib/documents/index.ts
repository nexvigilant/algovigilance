/**
 * AlgoVigilance Document Generation System
 *
 * Comprehensive document generation for all AlgoVigilance business needs.
 * Built on jsPDF with consistent styling and professional output.
 *
 * @module documents
 */

// Color system
export {
  DOCUMENT_COLORS,
  DARK_THEME_COLORS,
  SERVICE_CATEGORY_COLORS,
  CLASSIFICATION_COLORS,
  hexToRgb,
  type ServiceCategory,
  type DocumentClassification,
} from './colors';

// Typography system
export {
  FONT_SIZES,
  LINE_HEIGHTS,
  TYPOGRAPHY,
  applyTypography,
  applyPreset,
  drawWrappedText,
  drawLabeledField,
  drawNumberedSection,
  drawNumberedSubsection,
  drawBullet,
  drawLetterItem,
  drawRomanItem,
  type TypographyStyle,
} from './typography';

// Layout system
export {
  LAYOUT,
  getPageDimensions,
  drawStandardHeader,
  drawStandardFooter,
  drawTitleBlock,
  drawRecipientBlock,
  drawSectionDivider,
  drawContactBlock,
  needsNewPage,
  addNewPage,
  type PageDimensions,
  type DocumentMetadata,
  type HeaderOptions,
  type FooterOptions,
} from './layouts';

// Base document generator
export {
  BaseDocumentGenerator,
  generateDocumentNumber,
  formatDocumentDate,
  generateSafeFilename,
  type DocumentType,
  type BaseDocumentOptions,
} from './base';

// Document generators
export {
  generateCertificate,
  downloadCertificate,
  getCertificateBlob,
  getCertificateDataUri,
  type CertificateData,
  type CertificateOptions,
} from './generators/certificate';

export {
  generateIntelligenceBrief,
  downloadIntelligenceBrief,
  getIntelligenceBriefBlob,
  getIntelligenceBriefDataUri,
  type IntelligenceBriefData,
  type IntelligenceBriefOptions,
} from './generators/intelligence-brief';

export {
  generateProposal,
  downloadProposal,
  getProposalBlob,
  getProposalDataUri,
  type ProposalData,
  type ProposalOptions,
} from './generators/proposal';

export {
  generateSOW,
  downloadSOW,
  getSOWBlob,
  getSOWDataUri,
  type SOWData,
  type SOWOptions,
} from './generators/sow';

export {
  generateAssessmentReport,
  downloadAssessmentReport,
  getAssessmentReportBlob,
  getAssessmentReportDataUri,
  type AssessmentReportData,
  type AssessmentReportOptions,
} from './generators/assessment-report';
