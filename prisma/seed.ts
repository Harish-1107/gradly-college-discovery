import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type CutoffRow = {
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

type SeedData = {
  metadata: {
    totalCleanRows: number;
    uniqueInstitutes: number;
    uniquePrograms: number;
  };
  cutoffs: CutoffRow[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getLocation(instituteName: string): {
  city: string;
  state: string;
} {
  const locations: Record<string, { city: string; state: string }> = {
    "National Institute of Technology, Tiruchirappalli": {
      city: "Tiruchirappalli",
      state: "Tamil Nadu",
    },
    "National Institute of Technology Karnataka, Surathkal": {
      city: "Surathkal",
      state: "Karnataka",
    },
    "National Institute of Technology, Warangal": {
      city: "Warangal",
      state: "Telangana",
    },
    "National Institute of Technology, Rourkela": {
      city: "Rourkela",
      state: "Odisha",
    },
    "Indian Institute of Information Technology, Allahabad": {
      city: "Prayagraj",
      state: "Uttar Pradesh",
    },
  };

  return (
    locations[instituteName] ?? {
      city: "India",
      state: "India",
    }
  );
}

function getOverview(instituteName: string, type: "NIT" | "IIIT"): string {
  return `${instituteName} is a ${type} institute included in this College Discovery MVP. This profile combines JoSAA 2024 Round 5 course and cutoff data with institution-level information.`;
}

async function main() {
  const dataPath = path.join(
    process.cwd(),
    "data",
    "processed",
    "josaa-2024-round-5-nit-iiit.json"
  );

  if (!fs.existsSync(dataPath)) {
    throw new Error(`Processed data file not found: ${dataPath}`);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as SeedData;

  console.log("🌱 Starting database seed...");
  console.log(`📄 Reading ${data.cutoffs.length} cutoff rows`);

  const instituteNames = [
    ...new Set(data.cutoffs.map((row) => row.instituteName)),
  ];

  const programNames = [
    ...new Set(data.cutoffs.map((row) => row.programName)),
  ];

  const instituteIds = new Map<string, string>();
  const courseIds = new Map<string, string>();

  console.log(`🏫 Seeding ${instituteNames.length} institutes...`);

  for (const instituteName of instituteNames) {
    const sampleRow = data.cutoffs.find(
      (row) => row.instituteName === instituteName
    );

    if (!sampleRow) {
      continue;
    }

    const location = getLocation(instituteName);

    const institute = await prisma.institute.upsert({
      where: {
        name: instituteName,
      },
      update: {
        type: sampleRow.instituteType,
        city: location.city,
        state: location.state,
        overview: getOverview(instituteName, sampleRow.instituteType),
      },
      create: {
        name: instituteName,
        slug: slugify(instituteName),
        type: sampleRow.instituteType,
        city: location.city,
        state: location.state,
        overview: getOverview(instituteName, sampleRow.instituteType),
      },
    });

    instituteIds.set(instituteName, institute.id);
  }

  console.log(`📚 Seeding ${programNames.length} courses...`);

  for (const instituteName of instituteNames) {
    const instituteId = instituteIds.get(instituteName);

    if (!instituteId) {
      continue;
    }

    const institutePrograms = [
      ...new Set(
        data.cutoffs
          .filter((row) => row.instituteName === instituteName)
          .map((row) => row.programName)
      ),
    ];

    for (const programName of institutePrograms) {
      const course = await prisma.course.upsert({
        where: {
          instituteId_name: {
            instituteId,
            name: programName,
          },
        },
        update: {},
        create: {
          instituteId,
          name: programName,
        },
      });

      courseIds.set(`${instituteName}::${programName}`, course.id);
    }
  }

  console.log("📈 Seeding cutoff records...");

  const batchSize = 500;
  let inserted = 0;

  for (let start = 0; start < data.cutoffs.length; start += batchSize) {
    const batch = data.cutoffs.slice(start, start + batchSize);

    const cutoffRecords = [];

    for (const row of batch) {
      const instituteId = instituteIds.get(row.instituteName);
      const courseId = courseIds.get(
        `${row.instituteName}::${row.programName}`
      );

      if (!instituteId || !courseId) {
        console.warn(
          `Skipping row with missing relationship: ${row.instituteName} / ${row.programName}`
        );
        continue;
      }

      cutoffRecords.push({
        instituteId,
        courseId,
        quota: row.quota,
        category: row.seatType,
        gender: row.gender,
        year: row.year,
        round: row.round,
        openingRank: row.openingRank,
        closingRank: row.closingRank,
      });
    }

    if (cutoffRecords.length > 0) {
      await prisma.cutoff.createMany({
        data: cutoffRecords,
        skipDuplicates: true,
      });

      inserted += cutoffRecords.length;
      console.log(`  ✓ Processed ${inserted} / ${data.cutoffs.length}`);
    }
  }

  console.log("\n✅ Database seed completed");
  console.log(`Institutes: ${instituteIds.size}`);
  console.log(`Courses: ${courseIds.size}`);
  console.log(`Cutoff rows processed: ${inserted}`);

  await prisma.institute.update({
    where: { slug: 'nit-trichy' },
    data: {
      feesPerYear: 180000,
      nirfRank: 9,
      nirfScore: 66.88,
      goScore: 80.0,
    },
  });

  await prisma.institute.update({
    where: { slug: 'nit-warangal' },
    data: {
      feesPerYear: 160000,
      nirfRank: 21,
      nirfScore: 61.72,
      goScore: 75.28,
    },
  });

  await prisma.institute.update({
    where: { slug: 'nit-surathkal' },
    data: {
      feesPerYear: 170000,
      nirfRank: 17,
      nirfScore: 64.27,
      goScore: 78.44,
    },
  });
}


main()
  .catch((error) => {
    console.error("\n❌ Database seed failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

