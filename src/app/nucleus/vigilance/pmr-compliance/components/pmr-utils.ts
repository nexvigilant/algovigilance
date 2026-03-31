import { type PmrRecord } from './pmr-types';

// ---------------------------------------------------------------------------
// Parser — tilde-delimited with multi-line quote handling (client-side)
// ---------------------------------------------------------------------------

export function parsePmrData(text: string): PmrRecord[] {
  // Split into logical records (handle multi-line quoted fields)
  const records: string[] = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuote = !inQuote;
      current += ch;
    } else if (ch === '\n' && !inQuote) {
      if (current.trim()) records.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) records.push(current);

  // Split a single record by tilde delimiter
  function splitRow(line: string): string[] {
    const fields: string[] = [];
    let field = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') q = !q;
      else if (ch === '~' && !q) {
        fields.push(field.trim());
        field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  // Skip header row
  return records.slice(1).map((line) => {
    const f = splitRow(line);
    return {
      id: f[0] ?? '',
      center: f[1] ?? '',
      appType: f[2] ?? '',
      appNumber: f[3] ?? '',
      applicant: f[4] ?? '',
      product: f[5] ?? '',
      approvalDate: f[6] ?? '',
      submissionType: f[7] ?? '',
      submissionNumber: f[8] ?? '',
      uniqueId: f[9] ?? '',
      pmrOrPmc: f[10] ?? '',
      pmrType: f[11] ?? '',
      setNumber: f[12] ?? '',
      pmrNumber: f[13] ?? '',
      description: f[14] ?? '',
      status: f[15] ?? '',
      statusExplanation: f[16] ?? '',
      dueDate: f[17] ?? '',
      lastReportDate: f[18] ?? '',
    };
  });
}
