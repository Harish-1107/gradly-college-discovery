import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().max(100).optional(),
  type: z.enum(["NIT", "IIIT"]).optional(),
  state: z.string().trim().max(100).optional(),
});

export async function GET(request: NextRequest) {
  const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());

  const parsedQuery = querySchema.safeParse(rawQuery);

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_QUERY",
          message: "One or more search parameters are invalid.",
          details: parsedQuery.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const { page, limit, search, type, state } = parsedQuery.data;

  const where = {
    ...(search
      ? {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(type ? { type } : {}),
    ...(state
      ? {
          state: {
            equals: state,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  try {
    const [colleges, total] = await Promise.all([
      prisma.institute.findMany({
        where,
        orderBy: [
          { nirfRank: "asc" },
          { name: "asc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          city: true,
          state: true,
          feesPerYear: true,
          rating: true,
          nirfRank: true,
          nirfBand: true,
          goScore: true,
        },
      }),
      prisma.institute.count({ where }),
    ]);

    return NextResponse.json({
      data: colleges,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Failed to fetch colleges:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to fetch colleges at this time.",
        },
      },
      { status: 500 }
    );
  }
}