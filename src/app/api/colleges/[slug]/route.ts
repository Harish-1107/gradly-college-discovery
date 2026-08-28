import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { slug } = await params;

  if (!slug || slug.length > 200) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_SLUG",
          message: "The college identifier is invalid.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const college = await prisma.institute.findUnique({
      where: {
        slug,
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
        createdAt: true,
        updatedAt: true,
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
                quota: true,
                category: true,
                gender: true,
                openingRank: true,
                closingRank: true,
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
      },
    });

    if (!college) {
      return NextResponse.json(
        {
          error: {
            code: "COLLEGE_NOT_FOUND",
            message: "No college was found for this identifier.",
          },
        },
        { status: 404 }
      );
    }

    const courseSummaries = college.courses.map((course) => {
      const baselineQuota = college.type === "NIT" ? "OS" : "AI";

const baselineCutoffs = course.cutoffs.filter(
  (cutoff) =>
    cutoff.category === "OPEN" &&
    cutoff.gender === "Gender-Neutral" &&
    cutoff.quota === baselineQuota
);

      const bestOpenClosingRank =
        baselineCutoffs.length > 0
          ? Math.min(
              ...baselineCutoffs.map(
                (cutoff) => cutoff.closingRank
              )
            )
          : null;

      return {
        id: course.id,
        name: course.name,
        cutoffs: course.cutoffs,
        summary: {
          baselineOpenGenderNeutralClosingRank: bestOpenClosingRank,
  baselineQuota,
  totalCutoffRecords: course.cutoffs.length,
        },
      };
    });

    return NextResponse.json({
      data: {
        ...college,
        courses: courseSummaries,
      },
    });
  } catch (error) {
    console.error(`Failed to fetch college "${slug}":`, error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to fetch college details at this time.",
        },
      },
      { status: 500 }
    );
  }
}