/**
 * API Route for Google Sheets Formatting
 *
 * Hardened version with authentication, allowlisting, and secret management.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { google, type sheets_v4 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import type { OAuth2Client } from 'google-auth-library';
import fs from 'fs/promises';

import { logger } from '@/lib/logger';
const log = logger.scope('format/route');

// Type definitions for formatting rules
interface FormattingRule {
  values: string[];
  bg: string;
  fg: string;
  bold?: boolean;
}

interface ColumnConfig {
  column: string;
  rules: FormattingRule[];
}

interface FormattingTemplate {
  [key: string]: ColumnConfig;
}

// Formatting templates
const FORMATTING_TEMPLATES = {
  bugsTracker: {
    status: {
      column: 'E',
      rules: [
        { values: ['Resolved'], bg: '#34a853', fg: '#ffffff', bold: true },
        { values: ['Open'], bg: '#ea4335', fg: '#ffffff', bold: true },
        { values: ['Blocked'], bg: '#f57c00', fg: '#ffffff', bold: true },
        { values: ['In Progress'], bg: '#4285f4', fg: '#ffffff', bold: true },
      ],
    },
    severity: {
      column: 'C',
      rules: [
        { values: ['Critical'], bg: '#ffffff', fg: '#d93025', bold: true },
        { values: ['High'], bg: '#ffffff', fg: '#ff6d00', bold: true },
        { values: ['Medium'], bg: '#ffffff', fg: '#f9ab00', bold: false },
        { values: ['Low'], bg: '#ffffff', fg: '#1e8e3e', bold: false },
      ],
    },
  },
  projectTracker: {
    status: {
      column: 'D',
      rules: [
        { values: ['Complete'], bg: '#34a853', fg: '#ffffff' },
        { values: ['In Progress'], bg: '#4285f4', fg: '#ffffff' },
        { values: ['Blocked'], bg: '#ea4335', fg: '#ffffff' },
        { values: ['Not Started'], bg: '#9aa0a6', fg: '#ffffff' },
      ],
    },
    priority: {
      column: 'B',
      rules: [
        { values: ['P0', 'Critical'], bg: '#d93025', fg: '#ffffff' },
        { values: ['P1', 'High'], bg: '#ff6d00', fg: '#ffffff' },
        { values: ['P2', 'Medium'], bg: '#fbbc04', fg: '#000000' },
        { values: ['P3', 'Low'], bg: '#81c995', fg: '#000000' },
      ],
    },
  },
  pagesTracker: {
    status: {
      column: 'C',
      rules: [
        { values: ['Complete'], bg: '#34a853', fg: '#ffffff', bold: true },
        { values: ['In Progress'], bg: '#4285f4', fg: '#ffffff', bold: true },
        { values: ['Not Started'], bg: '#9aa0a6', fg: '#ffffff', bold: true },
      ],
    },
    priority: {
      column: 'D',
      rules: [
        { values: ['Critical'], bg: '#ffffff', fg: '#d93025', bold: true },
        { values: ['High'], bg: '#ffffff', fg: '#ff6d00', bold: true },
        { values: ['Medium'], bg: '#ffffff', fg: '#f9ab00', bold: false },
        { values: ['Low'], bg: '#ffffff', fg: '#1e8e3e', bold: false },
      ],
    },
  },
  featuresTracker: {
    status: {
      column: 'D',
      rules: [
        { values: ['Complete'], bg: '#34a853', fg: '#ffffff', bold: true },
        { values: ['In Progress'], bg: '#4285f4', fg: '#ffffff', bold: true },
        { values: ['Blocked'], bg: '#f57c00', fg: '#ffffff', bold: true },
        { values: ['Not Started'], bg: '#9aa0a6', fg: '#ffffff', bold: true },
      ],
    },
    priority: {
      column: 'E',
      rules: [
        { values: ['Critical'], bg: '#ffffff', fg: '#d93025', bold: true },
        { values: ['High'], bg: '#ffffff', fg: '#ff6d00', bold: true },
        { values: ['Medium'], bg: '#ffffff', fg: '#f9ab00', bold: false },
        { values: ['Low'], bg: '#ffffff', fg: '#1e8e3e', bold: false },
      ],
    },
  },
  testingTracker: {
    status: {
      column: 'E',
      rules: [
        { values: ['Passed'], bg: '#34a853', fg: '#ffffff', bold: true },
        { values: ['Failed'], bg: '#ea4335', fg: '#ffffff', bold: true },
        { values: ['Pending'], bg: '#fbbc04', fg: '#000000', bold: true },
        { values: ['Skipped'], bg: '#9aa0a6', fg: '#ffffff', bold: false },
      ],
    },
  },
  sprintPlanning: {
    // Minimal formatting - just clean headers and borders
  },
} as const;

// Convert hex to RGB
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        red: parseInt(result[1], 16) / 255,
        green: parseInt(result[2], 16) / 255,
        blue: parseInt(result[3], 16) / 255,
      }
    : { red: 0, green: 0, blue: 0 };
}

// Column letter to index
function columnToIndex(column: string): number {
  let index = 0;
  for (let i = 0; i < column.length; i++) {
    index = index * 26 + (column.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return index - 1;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-security-token');
    const expectedToken = process.env.SHEETS_FORMAT_TOKEN;

    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      spreadsheetId,
      sheetName = 'Bugs Tracker',
      template = 'bugsTracker',
      customRules,
    } = body;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'spreadsheetId is required' },
        { status: 400 }
      );
    }

    const allowedSheets = (process.env.ALLOWED_SHEETS_FORMAT_IDS || '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    if (!allowedSheets.includes(spreadsheetId)) {
      return NextResponse.json(
        { error: 'Spreadsheet not allowed' },
        { status: 403 }
      );
    }

    const serviceAccountPath = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PATH;
    if (!serviceAccountPath) {
      return NextResponse.json(
        { error: 'Service account path not configured' },
        { status: 500 }
      );
    }

    const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, 'utf-8'));

    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as OAuth2Client });

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    );

    if (!sheet?.properties?.sheetId) {
      return NextResponse.json(
        { error: `Sheet "${sheetName}" not found` },
        { status: 404 }
      );
    }

    const sheetId = sheet.properties.sheetId;
    const requests: sheets_v4.Schema$Request[] = [];

    const rulesToApply: FormattingTemplate | undefined =
      customRules || FORMATTING_TEMPLATES[template as keyof typeof FORMATTING_TEMPLATES];

    if (!rulesToApply) {
      return NextResponse.json(
        { error: `Template "${template}" not found` },
        { status: 400 }
      );
    }

    for (const [, config] of Object.entries(rulesToApply) as [string, ColumnConfig][]) {
      const columnIndex = columnToIndex(config.column);

      config.rules.forEach((rule: FormattingRule) => {
        rule.values.forEach((value: string) => {
          requests.push({
            addConditionalFormatRule: {
              rule: {
                ranges: [
                  {
                    sheetId,
                    startColumnIndex: columnIndex,
                    endColumnIndex: columnIndex + 1,
                    startRowIndex: 1,
                    endRowIndex: 1000,
                  },
                ],
                booleanRule: {
                  condition: {
                    type: 'TEXT_EQ',
                    values: [{ userEnteredValue: value }],
                  },
                  format: {
                    backgroundColor: hexToRgb(rule.bg),
                    textFormat: {
                      foregroundColor: hexToRgb(rule.fg),
                      bold: rule.bold || false,
                    },
                  },
                },
              },
            },
          });
        });
      });
    }

    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1, // Start after header
          endRowIndex: 1000,
          startColumnIndex: 0,
          endColumnIndex: 26,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: hexToRgb('#ffffff'), // White background
          },
        },
        fields: 'userEnteredFormat.backgroundColor',
      },
    });

    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 26,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: hexToRgb('#1a73e8'),
            textFormat: {
              foregroundColor: hexToRgb('#ffffff'),
              bold: true,
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
      },
    });

    requests.push({
      updateBorders: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 100,
          startColumnIndex: 0,
          endColumnIndex: 26,
        },
        top: { style: 'SOLID', color: hexToRgb('#dadce0') },
        bottom: { style: 'SOLID', color: hexToRgb('#dadce0') },
        left: { style: 'SOLID', color: hexToRgb('#dadce0') },
        right: { style: 'SOLID', color: hexToRgb('#dadce0') },
        innerHorizontal: { style: 'SOLID', color: hexToRgb('#dadce0') },
        innerVertical: { style: 'SOLID', color: hexToRgb('#dadce0') },
      },
    });

    requests.push({
      setBasicFilter: {
        filter: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1000,
            startColumnIndex: 0,
            endColumnIndex: 9, // A through I (Bug ID through Notes)
          },
        },
      },
    });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });

    return NextResponse.json({
      success: true,
      message: `Applied ${requests.length - 1} formatting rules to ${sheetName}`,
      sheet: {
        id: sheetId,
        name: sheetName,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId}`,
      },
    });
  } catch (error) {
    log.error('Formatting error:', error);
    return NextResponse.json(
      { error: 'Sheet formatting failed' },
      { status: 500 }
    );
  }
}
