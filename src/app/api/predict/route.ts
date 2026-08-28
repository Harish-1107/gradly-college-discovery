import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_CATEGORIES = [
  "OPEN",
  "EWS",
  "OBC-NCL",
  "SC",
  "ST",
] as const;

const VALID_GENDERS = [
  "Gender-Neutral",
  "Female-only (including Supernumerary)",
] as const;

const VALID_QUOTAS = [
  "HS",
  "OS",
  "AI",
] as const;

type Category = (typeof VALID_CATEGORIES)[number];
type Gender = (typeof VALID_GENDERS)[number];
type Quota = (typeof VALID_QUOTAS)[number];

type PredictorRequest = {
  exam?: string;
  rank?: unknown;
  category?: string;
  gender?: string;
  quota?: string;
};

function isValidOption<T extends readonly string[]>(
  value: string,
  options: T
): value is T[number] {
  return options.includes(value);
}

function getPredictionBucket(
  rank: number,
  closingRank: number
): "LIKELY" | "TARGET" | "AMBITIOUS" | null {
  /*
    Lower JEE rank is better.

    Rank <= 85% of last year's closing rank:
    clearly safer than the historical boundary → LIKELY

    Rank <= last year's closing rank:
    within the previous cutoff → TARGET

    Rank <= 120% of last year's closing rank:
    slightly outside the historical cutoff → AMBITIOUS

    Anything beyond this is excluded to avoid low-quality suggestions.
  */
  if (rank <= closingRank * 0.85) {
    return "LIKELY";
  }

  if (rank <= closingRank) {
    return "TARGET";
  }

  if (rank <= closingRank * 1.2) {
    return "AMBITIOUS";
  }

  return null;
}

function getChanceLabel(bucket: "LIKELY" | "TARGET" | "AMBITIOUS") {
  switch (bucket) {
    case "LIKELY":
      return "Likely";
    case "TARGET":
      return "Target";
    case "AMBITIOUS":
      return "Ambitious";
  }
}

function getReason(
  bucket: "LIKELY" | "TARGET" | "AMBITIOUS",
  rank: number,
  closingRank: number
) {
  const difference = closingRank - rank;

  switch (bucket) {
    case "LIKELY":
      return `Your rank is ${Math.abs(
        difference
      ).toLocaleString("en-IN")} places stronger than the previous closing rank.`;

    case "TARGET":
      return `Your rank is within the previous closing-rank range, but close to the cutoff.`;

    case "AMBITIOUS":
      return `Your rank is ${Math.abs(
        difference
      ).toLocaleString(
        "en-IN"
      )} places beyond the previous closing rank, so this is a stretch option.`;
  }
}

export async function POST(request: NextRequest) {
  let body: PredictorRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "Request body must contain valid JSON.",
        },
      },
      { status: 400 }
    );
  }

  const exam = body.exam?.trim().toUpperCase();
  const category = body.category?.trim().toUpperCase();
  const gender = body.gender?.trim();
  const quota = body.quota?.trim().toUpperCase();
  const rank = Number(body.rank);

  if (exam !== "JEE_MAIN") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_EXAM",
          message: "Only JEE_MAIN predictions are currently supported.",
        },
      },
      { status: 400 }
    );
  }

  if (!Number.isInteger(rank) || rank < 1 || rank > 2_000_000) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_RANK",
          message: "Rank must be a whole number between 1 and 2,000,000.",
        },
      },
      { status: 400 }
    );
  }

  if (!category || !isValidOption(category, VALID_CATEGORIES)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_CATEGORY",
          message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}.`,
        },
      },
      { status: 400 }
    );
  }

  if (!gender || !isValidOption(gender, VALID_GENDERS)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_GENDER",
          message: `Gender must be one of: ${VALID_GENDERS.join(", ")}.`,
        },
      },
      { status: 400 }
    );
  }

  if (!quota || !isValidOption(quota, VALID_QUOTAS)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_QUOTA",
          message: `Quota must be one of: ${VALID_QUOTAS.join(", ")}.`,
        },
      },
      { status: 400 }
    );
  }

  try {
    const cutoffs = await prisma.cutoff.findMany({
      where: {
        year: 2024,
        round: 5,
        category,
        gender,
        quota,
      },
      select: {
        openingRank: true,
        closingRank: true,
        quota: true,
        category: true,
        gender: true,
        year: true,
        round: true,
        course: {
          select: {
            id: true,
            name: true,
            institute: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
                city: true,
                state: true,
                rating: true,
                nirfRank: true,
              },
            },
          },
        },
      },
    });

    const predictions = cutoffs
      .map((cutoff) => {
        const bucket = getPredictionBucket(rank, cutoff.closingRank);

        if (!bucket) {
          return null;
        }

        return {
          college: cutoff.course.institute,
          course: {
            id: cutoff.course.id,
            name: cutoff.course.name,
          },
          chance: bucket,
          chanceLabel: getChanceLabel(bucket),
          reason: getReason(bucket, rank, cutoff.closingRank),
          previousCutoff: {
            openingRank: cutoff.openingRank,
            closingRank: cutoff.closingRank,
            year: cutoff.year,
            round: cutoff.round,
            category: cutoff.category,
            gender: cutoff.gender,
            quota: cutoff.quota,
          },
        };
      })
      .filter(
        (
          prediction
        ): prediction is NonNullable<typeof prediction> => prediction !== null
      )
      .sort((a, b) => {
        const chanceOrder = {
          LIKELY: 0,
          TARGET: 1,
          AMBITIOUS: 2,
        };

        const chanceDifference =
          chanceOrder[a.chance] - chanceOrder[b.chance];

        if (chanceDifference !== 0) {
          return chanceDifference;
        }

        return (
          a.previousCutoff.closingRank - b.previousCutoff.closingRank
        );
      });

    const groupedPredictions = {
      likely: predictions.filter(
        (prediction) => prediction.chance === "LIKELY"
      ),
      target: predictions.filter(
        (prediction) => prediction.chance === "TARGET"
      ),
      ambitious: predictions.filter(
        (prediction) => prediction.chance === "AMBITIOUS"
      ),
    };

    return NextResponse.json({
      data: {
        input: {
          exam,
          rank,
          category,
          gender,
          quota,
        },
        dataSource: {
          name: "JoSAA cutoff records",
          year: 2024,
          round: 5,
          note: "Predictions use historical final-round cutoffs as guidance, not a guarantee of admission.",
        },
        totalMatches: predictions.length,
        predictions: groupedPredictions,
      },
    });
  } catch (error) {
    console.error("Failed to generate predictor results:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to generate predictions at this time.",
        },
      },
      { status: 500 }
    );
  }
}