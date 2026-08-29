import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  const savedInstitutes = await prisma.savedInstitute.findMany({
    where: {
      userId: user.id,
    },
    include: {
      institute: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ savedInstitutes });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to save an institute." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const instituteId =
      typeof body.instituteId === "string" ? body.instituteId : "";

    if (!instituteId) {
      return NextResponse.json(
        { error: "Institute ID is required." },
        { status: 400 }
      );
    }

    const institute = await prisma.institute.findUnique({
      where: { id: instituteId },
      select: { id: true },
    });

    if (!institute) {
      return NextResponse.json(
        { error: "Institute not found." },
        { status: 404 }
      );
    }

    const savedInstitute = await prisma.savedInstitute.upsert({
      where: {
        userId_instituteId: {
          userId: user.id,
          instituteId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        instituteId,
      },
      include: {
        institute: true,
      },
    });

    return NextResponse.json({ savedInstitute }, { status: 201 });
  } catch (error) {
    console.error("Save institute error:", error);

    return NextResponse.json(
      { error: "Unable to save the institute. Please try again." },
      { status: 500 }
    );
  }
}