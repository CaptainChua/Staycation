import { Buffer } from "buffer";
import { google } from "googleapis";
import pool from "../config/db";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export const getGoogleSheetsAuth = () => {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  // Handle newlines in private key if they are escaped as literal "\n"
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google Sheets credentials in environment variables.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  return auth;
};

type SyncResult = {
  success: boolean;
  totalInDb: number;
  appended: number;
  skipped: number;
  deleted: number;
  error?: string;
};

const getRequiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing ${key} in environment variables.`);
  return value;
};

const isSafeIdentifier = (value: string) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);

const quoteIdentifier = (value: string) => {
  if (!isSafeIdentifier(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`);
  }
  return `"${value.replace(/"/g, '""')}"`;
};

const getBookingTableConfig = () => {
  const tableSchema = (process.env.BOOKING_TABLE_SCHEMA || "public").trim();
  const tableName = (process.env.BOOKING_TABLE_NAME || "booking").trim();

  if (!isSafeIdentifier(tableSchema)) {
    throw new Error(`Invalid BOOKING_TABLE_SCHEMA: ${tableSchema}`);
  }
  if (!isSafeIdentifier(tableName)) {
    throw new Error(`Invalid BOOKING_TABLE_NAME: ${tableName}`);
  }

  return { tableSchema, tableName };
};

const normalizeCellValue = (value: unknown) => {
  if (value === null || typeof value === "undefined") return "";
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString("base64");
  if (typeof value === "object") return JSON.stringify(value);
  return value;
};

const columnIndexToLetter = (index: number) => {
  let num = index + 1;
  let out = "";
  while (num > 0) {
    const rem = (num - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    num = Math.floor((num - 1) / 26);
  }
  return out;
};

const getSheetsClient = () => {
  const auth = getGoogleSheetsAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = getRequiredEnv("SPREADSHEET_ID");
  const sheetName = (process.env.SPREADSHEET_SHEET_NAME || "Sheet1").trim();
  return { sheets, spreadsheetId, sheetName };
};

export const getBookingColumnNames = async () => {
  const { tableSchema, tableName } = getBookingTableConfig();
  const result = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = $1
        AND table_name = $2
      ORDER BY ordinal_position ASC
    `,
    [tableSchema, tableName]
  );

  return result.rows.map((r) => String(r.column_name));
};

export const fetchBookingRecords = async (columnNames: string[]) => {
  const { tableSchema, tableName } = getBookingTableConfig();
  const orderBy = columnNames.includes("created_at")
    ? ` ORDER BY ${quoteIdentifier("created_at")} DESC`
    : "";

  const sql = `SELECT * FROM ${quoteIdentifier(tableSchema)}.${quoteIdentifier(tableName)}${orderBy}`;
  const result = await pool.query(sql);
  return result.rows as Record<string, unknown>[];
};

const getSheetHeader = async (args: {
  sheets: ReturnType<typeof google.sheets>;
  spreadsheetId: string;
  sheetName: string;
}) => {
  const res = await args.sheets.spreadsheets.values.get({
    spreadsheetId: args.spreadsheetId,
    range: `${args.sheetName}!1:1`,
  });

  const header = res.data.values?.[0] || [];
  return header.map((v) => String(v));
};

const setSheetHeader = async (args: {
  sheets: ReturnType<typeof google.sheets>;
  spreadsheetId: string;
  sheetName: string;
  header: string[];
}) => {
  await args.sheets.spreadsheets.values.update({
    spreadsheetId: args.spreadsheetId,
    range: `${args.sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [args.header],
    },
  });
};

const clearSheetValues = async (args: {
  sheets: ReturnType<typeof google.sheets>;
  spreadsheetId: string;
  sheetName: string;
}) => {
  await args.sheets.spreadsheets.values.clear({
    spreadsheetId: args.spreadsheetId,
    range: `${args.sheetName}!A:ZZZ`,
  });
};

const getExistingKeys = async (args: {
  sheets: ReturnType<typeof google.sheets>;
  spreadsheetId: string;
  sheetName: string;
  keyColumnIndex: number;
}) => {
  const colLetter = columnIndexToLetter(args.keyColumnIndex);
  const res = await args.sheets.spreadsheets.values.get({
    spreadsheetId: args.spreadsheetId,
    range: `${args.sheetName}!${colLetter}2:${colLetter}`,
  });

  const values = res.data.values || [];
  const set = new Set<string>();
  for (const row of values) {
    const v = row?.[0];
    if (v === null || typeof v === "undefined") continue;
    const key = String(v).trim();
    if (!key) continue;
    set.add(key);
  }

  return set;
};

const getSheetIdByName = async (args: {
  sheets: ReturnType<typeof google.sheets>;
  spreadsheetId: string;
  sheetName: string;
}) => {
  const meta = await args.sheets.spreadsheets.get({
    spreadsheetId: args.spreadsheetId,
    includeGridData: false,
  });
  const sheet = (meta.data.sheets || []).find((s) => s.properties?.title === args.sheetName);
  return sheet?.properties?.sheetId ?? null;
};

const getKeyRows = async (args: {
  sheets: ReturnType<typeof google.sheets>;
  spreadsheetId: string;
  sheetName: string;
  keyColumnIndex: number;
}) => {
  const colLetter = columnIndexToLetter(args.keyColumnIndex);
  const res = await args.sheets.spreadsheets.values.get({
    spreadsheetId: args.spreadsheetId,
    range: `${args.sheetName}!${colLetter}2:${colLetter}`,
  });

  const values = res.data.values || [];
  const out: Array<{ key: string; rowNumber: number }> = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i]?.[0];
    if (v === null || typeof v === "undefined") continue;
    const key = String(v).trim();
    if (!key) continue;
    out.push({ key, rowNumber: i + 2 });
  }
  return out;
};

const appendRows = async (args: {
  sheets: ReturnType<typeof google.sheets>;
  spreadsheetId: string;
  sheetName: string;
  rows: unknown[][];
}) => {
  if (args.rows.length === 0) return;

  await args.sheets.spreadsheets.values.append({
    spreadsheetId: args.spreadsheetId,
    range: `${args.sheetName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: args.rows,
    },
  });
};

let inFlightSync: Promise<SyncResult> | null = null;
let rerunRequested = false;

const performSyncBookingsToSheet = async (): Promise<SyncResult> => {
  const columnNames = await getBookingColumnNames();
  if (columnNames.length === 0) {
    throw new Error("No columns found for booking table.");
  }

  const records = await fetchBookingRecords(columnNames);
  const { sheets, spreadsheetId, sheetName } = getSheetsClient();

  const desiredHeader = columnNames;
  const existingHeader = await getSheetHeader({ sheets, spreadsheetId, sheetName });
  const sheetIsEmpty = existingHeader.length === 0 || existingHeader.every((v) => !String(v).trim());
  if (sheetIsEmpty) {
    await setSheetHeader({ sheets, spreadsheetId, sheetName, header: desiredHeader });
  } else {
    const sameHeader =
      existingHeader.length === desiredHeader.length &&
      existingHeader.every((h, idx) => String(h) === String(desiredHeader[idx]));

    if (!sameHeader) {
      await clearSheetValues({ sheets, spreadsheetId, sheetName });
      await setSheetHeader({ sheets, spreadsheetId, sheetName, header: desiredHeader });
    }
  }

  const dedupeColumn = (
    process.env.GOOGLE_SHEET_DEDUP_COLUMN ||
    (columnNames.includes("booking_id") ? "booking_id" : columnNames.includes("id") ? "id" : "")
  ).trim();

  const keyColumnIndexInSheet = dedupeColumn ? columnNames.indexOf(dedupeColumn) : -1;
  const existingKeys =
    keyColumnIndexInSheet >= 0
      ? await getExistingKeys({ sheets, spreadsheetId, sheetName, keyColumnIndex: keyColumnIndexInSheet })
      : null;

  const rowsToAppend: unknown[][] = [];
  let skipped = 0;

  const dbKeys = new Set<string>();

  for (const record of records) {
    const recordKey = dedupeColumn ? String(record[dedupeColumn] ?? "").trim() : "";
    if (recordKey) dbKeys.add(recordKey);
    if (existingKeys && keyColumnIndexInSheet >= 0) {
      const key = recordKey;
      if (key && existingKeys.has(key)) {
        skipped += 1;
        continue;
      }
      if (key) existingKeys.add(key);
    }

    rowsToAppend.push(columnNames.map((col) => normalizeCellValue(record[col])));
  }

  await appendRows({ sheets, spreadsheetId, sheetName, rows: rowsToAppend });

  let deleted = 0;
  if (keyColumnIndexInSheet >= 0 && dedupeColumn) {
    try {
      const sheetId = await getSheetIdByName({ sheets, spreadsheetId, sheetName });
      if (sheetId !== null) {
        const keyRows = await getKeyRows({ sheets, spreadsheetId, sheetName, keyColumnIndex: keyColumnIndexInSheet });
        const rowsToDelete = keyRows
          .filter((r) => r.key && !dbKeys.has(r.key))
          .map((r) => r.rowNumber)
          .sort((a, b) => b - a);

        if (rowsToDelete.length > 0) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: rowsToDelete.map((rowNumber) => ({
                deleteDimension: {
                  range: {
                    sheetId,
                    dimension: "ROWS",
                    startIndex: rowNumber - 1,
                    endIndex: rowNumber,
                  },
                },
              })),
            },
          });
          deleted = rowsToDelete.length;
        }
      }
    } catch (error) {
      console.error("❌ Error deleting missing rows from Google Sheet:", error);
    }
  }

  console.log(
    `✅ Google Sheet sync complete. Appended: ${rowsToAppend.length}, Skipped: ${skipped}, Deleted: ${deleted}.`
  );

  return {
    success: true,
    totalInDb: records.length,
    appended: rowsToAppend.length,
    skipped,
    deleted,
  };
};

export const syncBookingsToSheet = async (): Promise<SyncResult> => {
  if (inFlightSync) {
    rerunRequested = true;
    return inFlightSync;
  }

  inFlightSync = (async () => {
    try {
      return await performSyncBookingsToSheet();
    } catch (error) {
      console.error("❌ Error syncing to Google Sheet:", error);
      return {
        success: false,
        totalInDb: 0,
        appended: 0,
        skipped: 0,
        deleted: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })();

  try {
    return await inFlightSync;
  } finally {
    inFlightSync = null;
    if (rerunRequested) {
      rerunRequested = false;
      void syncBookingsToSheet();
    }
  }
};
