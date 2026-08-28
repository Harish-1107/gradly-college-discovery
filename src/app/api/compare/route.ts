import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MIN_COLLEGES_TO_COMPARE = 2;
const MAX_COLLEGES_TO_COMPARE = 3;
const MAX_ID_LENGTH = 100;

function parseCollegeIds(idsParam: string | null) {
  if (!idsParam) {
    return {
      error:
        "Provide college IDs using the query parameter, for example: ?ids=id-one,id-two",
      ids: [] as string[],
    };
  }

  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return {
      error: "Provide at least two college IDs to compare.",
      ids: [] as string[],
    };
  }

  const hasInvalidId = ids.some(
    (id) => id.length === 0 || id.length > MAX_ID_LENGTH
  );

  if (hasInvalidId) {
    return {
      error: "Each college ID must be a non-empty value up to 100 characters.",
      ids: [] as string[],
    };
  }

  const uniqueIds = [...new Set(ids)];

  if (uniqueIds.length !== ids.length) {
    return {
      error: "College IDs must be unique.",
      ids: [] as string[],
    };
  }

  if (
    uniqueIds.length < MIN_COLLEGES_TO_COMPARE ||
    uniqueIds.length > MAX_COLLEGES_TO_COMPARE
  ) {
    return {
      error: `Select between ${MIN_COLLEGES_TO_COMPARE} and ${MAX_COLLEGES_TO_COMPARE} colleges to compare.`,
      ids: [] as string[],
    };
  }

  return {
    error: null,
    ids: uniqueIds,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { error, ids } = parseCollegeIds(searchParams.get("ids"));

  if (error) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_COMPARE_IDS",
          message: error,
        },
      },
      { status: 400 }
    );
  }

  try {
    const colleges = await prisma.institute.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        city: true,
        state: true,
        feesPerYear: true,
        rating: true,
        overview: true,
        nirfRank: true,
        nirfScore: true,
        nirfBand: true,
        goScore: true,
        courses: {
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
            cutoffs: {
              where: {
                year: 2024,
                round: 5,
              },
              orderBy: {
                closingRank: "asc",
              },
              select: {
                openingRank: true,
                closingRank: true,
                quota: true,
                category: true,
                gender: true,
                year: true,
                round: true,
              },
            },
          },
        },
        reviews: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            reviewerName: true,
            reviewerCourse: true,
            graduationYear: true,
            rating: true,
            title: true,
            body: true,
            isSample: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            courses: true,
            reviews: true,
          },
        },
      },
    });

    if (colleges.length !== ids.length) {
      const foundIds = new Set(colleges.map((college) => college.id));
      const missingIds = ids.filter((id) => !foundIds.has(id));

      return NextResponse.json(
        {
          error: {
            code: "COLLEGES_NOT_FOUND",
            message: "One or more selected colleges could not be found.",
            missingIds,
          },
        },
        { status: 404 }
      );
    }

    const collegesById = new Map(
      colleges.map((college) => [college.id, college])
    );

    const orderedColleges = ids.map((id) => collegesById.get(id)!);

    const normalizedColleges = orderedColleges.map((college) => {
      const courses = college.courses.map((course) => {
        const openGenderNeutralCutoffs = course.cutoffs.filter(
          (cutoff) =>
            cutoff.category === "OPEN" &&
            cutoff.gender === "Gender-Neutral"
        );

        const bestOpenGenderNeutralClosingRank =
          openGenderNeutralCutoffs.length > 0
            ? Math.min(
                ...openGenderNeutralCutoffs.map(
                  (cutoff) => cutoff.closingRank
                )
              )
            : null;

        return {
          id: course.id,
          name: course.name,
          cutoffSummary: {
            bestOpenGenderNeutralClosingRank,
            totalCutoffRecords: course.cutoffs.length,
          },
          cutoffs: course.cutoffs,
        };
      });

      const averageReviewRating =
        college.reviews.length > 0
          ? Number(
              (
                college.reviews.reduce(
                  (total, review) => total + review.rating,
                  0
                ) / college.reviews.length
              ).toFixed(1)
            )
          : null;

      return {
        id: college.id,
        slug: college.slug,
        name: college.name,
        type: college.type,
        location: {
          city: college.city,
          state: college.state,
        },
        scores: {
          platformRating: college.rating,
          goScore: college.goScore,
          nirfRank: college.nirfRank,
          nirfScore: college.nirfScore,
          nirfBand: college.nirfBand,
        },
        fees: {
          perYear: college.feesPerYear,
        },
        overview: college.overview,
        statistics: {
          courseCount: college._count.courses,
          reviewCount: college._count.reviews,
          averageReviewRating,
        },
        courses,
        reviews: college.reviews,
      };
    });

    return NextResponse.json({
      data: {
        selectedCollegeIds: ids,
        count: normalizedColleges.length,
        cutoffData: {
          year: 2024,
          round: 5,
          note: "Cutoff summaries use the best available OPEN, Gender-Neutral closing rank.",
        },
        colleges: normalizedColleges,
      },
    });
  } catch (error) {
    console.error("Failed to compare colleges:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to compare colleges at this time.",
        },
      },
      { status: 500 }
    );
  }
}