// CSV parsing and record helpers for the visualization fallback workflow.
export type CsvRecord = Record<string, string>;

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '"') {
      const nextChar = text[index + 1];
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[index + 1] === "\n") {
        index += 1;
      }

      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += char;
  }

  currentRow.push(currentField);
  rows.push(currentRow);
  return rows;
}

export function parseCsvTextToRecords(rawText: string): CsvRecord[] {
  const rows = parseCsvRows(rawText);
  const headers = rows.shift()?.map((value) => value.trim()) ?? [];

  if (headers.length === 0) {
    return [];
  }

  return rows
    .filter((row) => row.some((value) => value.trim() !== ""))
    .map((row) => {
      const record: CsvRecord = {};
      headers.forEach((header, index) => {
        record[header] = row[index] ?? "";
      });
      return record;
    });
}

export async function parseCsvFile(file: File): Promise<CsvRecord[]> {
  const rawText = await file.text();
  return parseCsvTextToRecords(rawText);
}
