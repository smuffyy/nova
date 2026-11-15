import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

export type ExtractResult = {
  text: string;
  /** Structured rows for CSV/Excel — used for row-aware chunking */
  rows?: Record<string, string>[];
  sheetName?: string;
  docType: "pdf" | "docx" | "txt" | "md" | "csv" | "xlsx" | "other";
};

function detectDocType(filename: string, mimeType: string): ExtractResult["docType"] {
  const ext = path.extname(filename).toLowerCase();
  if (mimeType.includes("pdf") || ext === ".pdf") return "pdf";
  if (mimeType.includes("wordprocessingml") || ext === ".docx") return "docx";
  if (ext === ".csv" || mimeType === "text/csv") return "csv";
  if (
    ext === ".xlsx" ||
    ext === ".xls" ||
    mimeType.includes("spreadsheet")
  )
    return "xlsx";
  if (ext === ".md" || mimeType === "text/markdown") return "md";
  if (ext === ".txt" || mimeType.startsWith("text/")) return "txt";
  return "other";
}

function sheetToRows(sheet: XLSX.WorkSheet): Record<string, string>[] {
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  return json.map((row) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      out[String(k)] = v == null ? "" : String(v).trim();
    }
    return out;
  });
}

function rowsToText(rows: Record<string, string>[], sheetName: string): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [`Sheet: ${sheetName}`, `Columns: ${headers.join(", ")}`, ""];
  for (const row of rows.slice(0, 500)) {
    lines.push(headers.map((h) => `${h}=${row[h] || ""}`).join(" | "));
  }
  return lines.join("\n");
}

export async function extractDocument(
  filePath: string,
  mimeType: string,
  filename: string
): Promise<ExtractResult> {
  const ext = path.extname(filename).toLowerCase();
  const buffer = fs.readFileSync(filePath);
  const docType = detectDocType(filename, mimeType);

  if (docType === "pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return { text: result.text || "", docType };
  }

  if (docType === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value || "", docType };
  }

  if (docType === "xlsx" || ext === ".xls") {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0] || "Sheet1";
    const sheet = workbook.Sheets[sheetName];
    const rows = sheetToRows(sheet);
    return {
      text: rowsToText(rows, sheetName),
      rows,
      sheetName,
      docType: "xlsx",
    };
  }

  const text = buffer.toString("utf8");
  if (docType === "csv") {
    const workbook = XLSX.read(text, { type: "string" });
    const sheetName = workbook.SheetNames[0] || "CSV";
    const sheet = workbook.Sheets[sheetName];
    const rows = sheetToRows(sheet);
    return {
      text: rowsToText(rows, sheetName),
      rows,
      sheetName,
      docType: "csv",
    };
  }

  return { text, docType };
}

/** @deprecated use extractDocument */
export async function extractText(
  filePath: string,
  mimeType: string,
  filename: string
): Promise<string> {
  const doc = await extractDocument(filePath, mimeType, filename);
  return doc.text;
}
