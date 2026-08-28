import * as XLSX from "xlsx";
import path from "path";

const filePath = path.join(
  process.cwd(),
  "data",
  "raw",
  "josaa-2024-round-5.xlsx"
);

const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets["24Round5"];

const rows = XLSX.utils.sheet_to_json(sheet, {
  defval: null,
}) as Record<string, unknown>[];

const nitRows = rows.filter((row) =>
  String(row["Institute"] ?? "")
    .toLowerCase()
    .includes("national institute of technology")
);

const iiitRows = rows.filter((row) =>
  String(row["Institute"] ?? "")
    .toLowerCase()
    .includes("indian institute of information technology")
);

const nitInstitutes = [
  ...new Set(nitRows.map((row) => String(row["Institute"]))),
].sort();

const iiitInstitutes = [
  ...new Set(iiitRows.map((row) => String(row["Institute"]))),
].sort();

console.log("NIT rows:", nitRows.length);
console.log("Unique NITs:", nitInstitutes.length);
console.log("\nNIT names:");
console.log(nitInstitutes);

console.log("\nIIIT rows:", iiitRows.length);
console.log("Unique IIITs:", iiitInstitutes.length);
console.log("\nIIIT names:");
console.log(iiitInstitutes);