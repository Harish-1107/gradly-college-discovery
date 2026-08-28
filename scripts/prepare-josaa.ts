import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

type RawRow = Record<string, unknown>;

type CleanCutoff = {
  year: number;
  round: number;
  instituteName: string;
  instituteType: "NIT" | "IIIT";
  programName: string;
  quota: "HS" | "OS" | "AI";
  seatType: string;
  gender: string;
  openingRank: number;
  closingRank: number;
};

const INPUT_PATH = path.join(
  process.cwd(),
  "data",
  "raw",
  "josaa-2024-round-5.xlsx"
);

const OUTPUT_PATH = path.join(
  process.cwd(),
  "data",
  "processed",
  "josaa-2024-round-5-nit-iiit.json"
);

const SHEET_NAME = "24Round5";
const VALID_QUOTAS = new Set(["HS", "OS", "AI"]);

function asTrimmedString(value: unknown): string {
  return String(value ?? "").trim();
}

function parseRank(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }

  const text = asTrimmedString(value);

  if (!text) {
    return null;
  }

  // Keeps digits only; handles values such as "12,345" or "12345P".
  const digits = text.replace(/[^\d]/g, "");
  const rank = Number(digits);

  if (!Number.isInteger(rank) || rank <= 0) {
    return null;
  }

  return rank;
}

function getInstituteType(
  instituteName: string
): "NIT" | "IIIT" | null {
  const normalized = instituteName.toLowerCase();

  if (normalized.includes("national institute of technology")) {
    return "NIT";
  }

  if (normalized.includes("indian institute of information technology")) {
    return "IIIT";
  }

  return null;
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`Input file not found: ${INPUT_PATH}`);
  }

  const workbook = XLSX.readFile(INPUT_PATH);

  if (!workbook.Sheets[SHEET_NAME]) {
    throw new Error(
      `Sheet "${SHEET_NAME}" not found. Available sheets: ${workbook.SheetNames.join(", ")}`
    );
  }

  const sheet = workbook.Sheets[SHEET_NAME];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
  }) as RawRow[];

  const accepted: CleanCutoff[] = [];

  const report = {
    totalInputRows: rows.length,
    rejectedWrongYearOrRound: 0,
    rejectedInstituteType: 0,
    rejectedQuota: 0,
    rejectedMissingFields: 0,
    rejectedInvalidRanks: 0,
    duplicateRows: 0,
  };

  const seenRows = new Set<string>();

  for (const row of rows) {
    const year = Number(row["Year"]);
    const round = Number(row["Round"]);

    if (year !== 2024 || round !== 5) {
      report.rejectedWrongYearOrRound++;
      continue;
    }

    const instituteName = asTrimmedString(row["Institute"]);
    const programName = asTrimmedString(row["Academic Program Name"]);
    const quota = asTrimmedString(row["Quota"]);
    const seatType = asTrimmedString(row["Seat Type"]);
    const gender = asTrimmedString(row["Gender"]);

    if (!instituteName || !programName || !quota || !seatType || !gender) {
      report.rejectedMissingFields++;
      continue;
    }

    const instituteType = getInstituteType(instituteName);

    if (!instituteType) {
      report.rejectedInstituteType++;
      continue;
    }

    if (!VALID_QUOTAS.has(quota)) {
      report.rejectedQuota++;
      continue;
    }

    const openingRank = parseRank(row["Opening Rank"]);
    const closingRank = parseRank(row["Closing Rank"]);

    if (openingRank === null || closingRank === null) {
      report.rejectedInvalidRanks++;
      continue;
    }

    const uniqueKey = [
      year,
      round,
      instituteName,
      programName,
      quota,
      seatType,
      gender,
    ].join("|");

    if (seenRows.has(uniqueKey)) {
      report.duplicateRows++;
      continue;
    }

    seenRows.add(uniqueKey);

    accepted.push({
      year,
      round,
      instituteName,
      instituteType,
      programName,
      quota: quota as "HS" | "OS" | "AI",
      seatType,
      gender,
      openingRank,
      closingRank,
    });
  }

  const institutes = [
    ...new Set(accepted.map((row) => row.instituteName)),
  ].sort();

  const nitCount = new Set(
    accepted
      .filter((row) => row.instituteType === "NIT")
      .map((row) => row.instituteName)
  ).size;

  const iiitCount = new Set(
    accepted
      .filter((row) => row.instituteType === "IIIT")
      .map((row) => row.instituteName)
  ).size;

  const programs = [
    ...new Set(accepted.map((row) => row.programName)),
  ].sort();

  const output = {
    metadata: {
      source: "JoSAA 2024 Round 5 Excel dataset",
      scope: "NIT and IIIT institutes only; HS, OS, and AI quota rows only",
      processedAt: new Date().toISOString(),
      totalCleanRows: accepted.length,
      uniqueInstitutes: institutes.length,
      uniquePrograms: programs.length,
    },
    report,
    cutoffs: accepted,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");

  console.log("\n✅ JoSAA data preparation complete");
  console.log("-----------------------------------");
  console.log("Input rows:", report.totalInputRows);
  console.log("Accepted rows:", accepted.length);
  console.log("Unique institutes:", institutes.length);
  console.log("  NITs:", nitCount);
  console.log("  IIITs:", iiitCount);
  console.log("Unique programs:", programs.length);

  console.log("\nRejected rows:");
  console.log("  Wrong year/round:", report.rejectedWrongYearOrRound);
  console.log("  Non-NIT/IIIT institute:", report.rejectedInstituteType);
  console.log("  Unsupported quota:", report.rejectedQuota);
  console.log("  Missing required field:", report.rejectedMissingFields);
  console.log("  Invalid rank:", report.rejectedInvalidRanks);
  console.log("  Duplicate row:", report.duplicateRows);

  console.log(`\nOutput file: ${OUTPUT_PATH}`);
}

try {
  main();
} catch (error) {
  console.error("\n❌ Failed to prepare JoSAA data");
  console.error(error);
  process.exit(1);
}