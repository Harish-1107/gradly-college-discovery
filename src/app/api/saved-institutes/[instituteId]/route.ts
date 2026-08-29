import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

type RouteContext = {
  params: Promise<{
    instituteId: string;
  }>;
};

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to remove an institute." },
        { status: 401 }
      );
    }

    const { instituteId } = await params;

    if (!instituteId) {
      return NextResponse.json(
        { error: "Institute ID is required." },
        { status: 400 }
      );
    }

    await prisma.savedInstitute.deleteMany({
      where: {
        userId: user.id,
        instituteId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove saved institute error:", error);

    return NextResponse.json(
      { error: "Unable to remove the institute. Please try again." },
      { status: 500 }
    );
  }
}