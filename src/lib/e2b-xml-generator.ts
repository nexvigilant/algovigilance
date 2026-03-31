/**
 * E2B(R3) XML Generator — produces ICH E2B(R3) compliant ICSR XML from structured case data.
 * Reference: ICH E2B(R3) Electronic Transmission of Individual Case Safety Reports
 */

export interface E2bCaseData {
  // A. Administrative
  safetyReportId: string;
  reportType: "1" | "2"; // 1=initial, 2=followup
  reportDate: string; // YYYYMMDD
  senderOrganization: string;
  receiverOrganization: string;

  // B.1 Patient
  patientInitials: string;
  patientAge?: number;
  patientAgeUnit?: string; // "801"=Year, "802"=Month, "803"=Day
  patientSex?: "1" | "2"; // 1=Male, 2=Female
  patientWeight?: number;
  patientHeight?: number;

  // B.2 Medical History
  medicalHistory?: string;

  // B.4 Drug(s)
  drugs: E2bDrug[];

  // B.5 Reaction(s)
  reactions: E2bReaction[];

  // C. Narrative
  narrative: string;
  senderComments?: string;
}

export interface E2bDrug {
  name: string;
  characterization: "1" | "2" | "3"; // 1=Suspect, 2=Concomitant, 3=Interacting
  indication?: string;
  dose?: string;
  doseUnit?: string;
  route?: string;
  startDate?: string;
  endDate?: string;
  dechallenge?: "1" | "2" | "3"; // 1=positive, 2=negative, 3=unknown
  rechallenge?: "1" | "2" | "3";
  batchNumber?: string;
}

export interface E2bReaction {
  description: string;
  meddraCode?: string;
  meddraVersion?: string;
  startDate?: string;
  endDate?: string;
  outcome?: "1" | "2" | "3" | "4" | "5" | "6";
  // 1=recovered, 2=recovering, 3=not recovered, 4=recovered with sequelae, 5=fatal, 6=unknown
  seriousness: {
    death?: boolean;
    lifeThreatening?: boolean;
    hospitalization?: boolean;
    disability?: boolean;
    congenitalAnomaly?: boolean;
    medicallyImportant?: boolean;
  };
}

/** Generate E2B(R3) compliant XML string */
export function generateE2bXml(data: E2bCaseData): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<ichicsr lang="en" xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
  );
  lines.push("  <ichicsrmessageheader>");
  lines.push(
    `    <messagetype>ichicsr</messagetype>`,
  );
  lines.push(
    `    <messageformatversion>2.1</messageformatversion>`,
  );
  lines.push(
    `    <messageformatrelease>3.0</messageformatrelease>`,
  );
  lines.push(
    `    <messagenumb>${data.safetyReportId}</messagenumb>`,
  );
  lines.push(
    `    <messagesenderidentifier>${escapeXml(data.senderOrganization)}</messagesenderidentifier>`,
  );
  lines.push(
    `    <messagereceiveridentifier>${escapeXml(data.receiverOrganization)}</messagereceiveridentifier>`,
  );
  lines.push(
    `    <messagedateformat>204</messagedateformat>`,
  );
  lines.push(
    `    <messagedate>${data.reportDate}</messagedate>`,
  );
  lines.push("  </ichicsrmessageheader>");

  // Safety Report
  lines.push("  <safetyreport>");
  lines.push(
    `    <safetyreportversion>1</safetyreportversion>`,
  );
  lines.push(
    `    <safetyreportid>${escapeXml(data.safetyReportId)}</safetyreportid>`,
  );
  lines.push(
    `    <reporttype>${data.reportType}</reporttype>`,
  );

  // Seriousness from first reaction
  const firstReaction = data.reactions[0];
  if (firstReaction) {
    const s = firstReaction.seriousness;
    const isSerious =
      s.death ||
      s.lifeThreatening ||
      s.hospitalization ||
      s.disability ||
      s.congenitalAnomaly ||
      s.medicallyImportant;
    lines.push(`    <serious>${isSerious ? "1" : "2"}</serious>`);
    if (s.death) lines.push("    <seriousnessdeath>1</seriousnessdeath>");
    if (s.lifeThreatening)
      lines.push(
        "    <seriousnesslifethreatening>1</seriousnesslifethreatening>",
      );
    if (s.hospitalization)
      lines.push(
        "    <seriousnesshospitalization>1</seriousnesshospitalization>",
      );
    if (s.disability)
      lines.push(
        "    <seriousnessdisabling>1</seriousnessdisabling>",
      );
    if (s.congenitalAnomaly)
      lines.push(
        "    <seriousnesscongenitalanomali>1</seriousnesscongenitalanomali>",
      );
    if (s.medicallyImportant)
      lines.push("    <seriousnessother>1</seriousnessother>");
  }

  lines.push(
    `    <receivedate>${data.reportDate}</receivedate>`,
  );
  lines.push(`    <receivedateformat>102</receivedateformat>`);

  // Patient
  lines.push("    <patient>");
  lines.push(
    `      <patientinitial>${escapeXml(data.patientInitials)}</patientinitial>`,
  );
  if (data.patientAge) {
    lines.push(
      `      <patientonsetage>${data.patientAge}</patientonsetage>`,
    );
    lines.push(
      `      <patientonsetageunit>${data.patientAgeUnit ?? "801"}</patientonsetageunit>`,
    );
  }
  if (data.patientSex) {
    lines.push(`      <patientsex>${data.patientSex}</patientsex>`);
  }
  if (data.patientWeight) {
    lines.push(
      `      <patientweight>${data.patientWeight}</patientweight>`,
    );
  }
  if (data.patientHeight) {
    lines.push(
      `      <patientheight>${data.patientHeight}</patientheight>`,
    );
  }
  if (data.medicalHistory) {
    lines.push("      <medicalhistoryepisode>");
    lines.push(
      `        <patientmedicalcomment>${escapeXml(data.medicalHistory)}</patientmedicalcomment>`,
    );
    lines.push("      </medicalhistoryepisode>");
  }

  // Reactions
  for (const rx of data.reactions) {
    lines.push("      <reaction>");
    lines.push(
      `        <primarysourcereaction>${escapeXml(rx.description)}</primarysourcereaction>`,
    );
    if (rx.meddraCode) {
      lines.push(
        `        <reactionmeddraversionllt>${rx.meddraVersion ?? "27.0"}</reactionmeddraversionllt>`,
      );
      lines.push(
        `        <reactionmeddrallt>${escapeXml(rx.meddraCode)}</reactionmeddrallt>`,
      );
    }
    if (rx.startDate) {
      lines.push(`        <reactionstartdateformat>102</reactionstartdateformat>`);
      lines.push(`        <reactionstartdate>${rx.startDate}</reactionstartdate>`);
    }
    if (rx.outcome) {
      lines.push(`        <reactionoutcome>${rx.outcome}</reactionoutcome>`);
    }
    lines.push("      </reaction>");
  }

  // Drugs
  for (const drug of data.drugs) {
    lines.push("      <drug>");
    lines.push(
      `        <drugcharacterization>${drug.characterization}</drugcharacterization>`,
    );
    lines.push(
      `        <medicinalproduct>${escapeXml(drug.name)}</medicinalproduct>`,
    );
    if (drug.indication) {
      lines.push(
        `        <drugindication>${escapeXml(drug.indication)}</drugindication>`,
      );
    }
    if (drug.dose) {
      lines.push(
        `        <drugstructuredosagenumb>${escapeXml(drug.dose)}</drugstructuredosagenumb>`,
      );
    }
    if (drug.route) {
      lines.push(
        `        <drugadministrationroute>${escapeXml(drug.route)}</drugadministrationroute>`,
      );
    }
    if (drug.startDate) {
      lines.push(`        <drugstartdateformat>102</drugstartdateformat>`);
      lines.push(`        <drugstartdate>${drug.startDate}</drugstartdate>`);
    }
    if (drug.endDate) {
      lines.push(`        <drugenddateformat>102</drugenddateformat>`);
      lines.push(`        <drugenddate>${drug.endDate}</drugenddate>`);
    }
    if (drug.batchNumber) {
      lines.push(
        `        <drugbatchnumb>${escapeXml(drug.batchNumber)}</drugbatchnumb>`,
      );
    }
    if (drug.dechallenge) {
      lines.push(
        `        <drugrecurreadministration>${drug.rechallenge ?? "3"}</drugrecurreadministration>`,
      );
    }
    lines.push("      </drug>");
  }

  // Narrative
  lines.push("      <summary>");
  lines.push(
    `        <narrativeincludeclinical>${escapeXml(data.narrative)}</narrativeincludeclinical>`,
  );
  if (data.senderComments) {
    lines.push(
      `        <sendercomment>${escapeXml(data.senderComments)}</sendercomment>`,
    );
  }
  lines.push("      </summary>");

  lines.push("    </patient>");
  lines.push("  </safetyreport>");
  lines.push("</ichicsr>");

  return lines.join("\n");
}

/** Trigger XML file download */
export function downloadE2bXml(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
