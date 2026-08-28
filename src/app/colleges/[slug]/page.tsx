"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Cutoff = {
  openingRank: number;
  closingRank: number;
  quota: string;
  category: string;
  gender: string;
  year: number;
  round: number;
};

type Course = {
  id: string;
  name: string;
  cutoffs: Cutoff[];
  summary: {
    baselineOpenGenderNeutralClosingRank: number | null;
    baselineQuota: "HS" | "OS" | "AI";
    totalCutoffRecords: number;
  };
};

type Review = {
  id: string;
  reviewerName: string;
  reviewerCourse: string | null;
  graduationYear: number | null;
  rating: number;
  title: string;
  body: string;
  isSample: boolean;
  createdAt: string;
};

type College = {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
  state: string;
  feesPerYear: number | null;
  rating: number | null;
  overview: string | null;
  nirfRank: number | null;
  nirfScore: number | null;
  nirfBand: string | null;
  goScore: number | null;
  createdAt: string;
  updatedAt: string;
  courses: Course[];
  reviews: Review[];
};

type ApiResponse = {
  data?: College;
  error?: {
    code: string;
    message: string;
  };
};

function formatRank(rank: number | null) {
  if (rank === null) {
    return "Not available";
  }

  return rank.toLocaleString("en-IN");
}

function formatScore(score: number | null) {
  if (score === null) {
    return "Not available";
  }

  return `${score.toFixed(1)} / 100`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function CollegeDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCourses, setExpandedCourses] = useState(false);

  useEffect(() => {
    if (!slug) {
      return;
    }

    const controller = new AbortController();

    async function loadCollege() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/colleges/${slug}`, {
          signal: controller.signal,
        });

        const payload: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error?.message || "Unable to load college details."
          );
        }

        if (!payload.data) {
          throw new Error("College data was not returned.");
        }

        setCollege(payload.data);
      } catch (requestError) {
        if (requestError instanceof DOMException) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load college details."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCollege();

    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-10 h-72 animate-pulse rounded-3xl bg-slate-200" />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
          <div className="mt-8 h-96 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
            Unable to load
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            College details are unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error || "This college could not be found."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Return to explorer
          </Link>
        </div>
      </main>
    );
  }
  if (!college) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          College data is being prepared.
        </p>
      </div>
    </main>
  );
}
  const visibleCourses = expandedCourses
    ? college.courses
    : college.courses.slice(0, 8);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/20">
              G
            </span>
            <span className="text-lg font-semibold tracking-tight">Gradly</span>
          </Link>

          <Link
            href="/predict"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            JEE Predictor
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
        >
          <span aria-hidden="true">←</span>
          Back to college explorer
        </Link>

        <section className="mt-6 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-slate-950/15">
          <div className="relative px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-indigo-300/30 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                    {college.type}
                  </span>
                  <span className="text-sm text-slate-300">
                    {college.city}, {college.state}
                  </span>
                </div>

                <div className="mt-6 flex items-start gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/10 text-lg font-bold text-cyan-100 ring-1 ring-white/15">
                    {getInitials(college.name)}
                  </div>

                  <div>
                    <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
                      {college.name}
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                      {college.overview ||
                        "Explore courses, NIRF indicators, and JoSAA cutoff data for this institute."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[290px]">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-300">
                    Platform rating
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {college.rating ?? "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-300">
                    NIRF ranking
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {college.nirfRank
                      ? `#${college.nirfRank}`
                      : college.nirfBand || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">NIRF score</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {formatScore(college.nirfScore)}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              National Institutional Ranking Framework engineering indicator.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Graduation outcomes
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {formatScore(college.goScore)}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              NIRF’s graduation-outcome measure, used as a transparent degree-value signal.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Programs available
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {college.courses.length}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Programs with 2024 JoSAA final-round cutoff records.
            </p>
          </article>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  Academic programs
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Courses and cutoff insights
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Baseline shown: OPEN, Gender-Neutral cutoff. NITs use Other State
(OS); IIITs use All India (AI). Use the Predictor for your exact
category, quota, and seat-pool guidance.
                </p>
              </div>

              <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                {college.courses.length} programs
              </span>
            </div>

            {college.courses.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h3 className="font-semibold">No course data available</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Cutoff records have not been added for this institute yet.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="hidden grid-cols-[minmax(0,1fr)_170px_120px] gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
                    <span>Program</span>
                    <span>Baseline cutoff</span>
                    <span className="text-right">Records</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {visibleCourses.map((course) => (
                      <div
                        key={course.id}
                        className="grid gap-3 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_170px_120px] sm:items-center"
                      >
                        <p className="font-medium leading-6 text-slate-800">
                          {course.name}
                        </p>

                       <div>
  <p className="text-xs text-slate-400 sm:hidden">
    OPEN · Gender-Neutral · {course.summary.baselineQuota}
  </p>

  <p className="mt-1 font-semibold text-indigo-600 sm:mt-0">
    {course.summary.baselineOpenGenderNeutralClosingRank
      ? formatRank(
          course.summary
            .baselineOpenGenderNeutralClosingRank
        )
      : "Not available"}
  </p>

  <p className="mt-1 text-xs font-medium text-slate-500">
    OPEN · Gender-Neutral · {course.summary.baselineQuota}
  </p>
</div>

                        <div className="sm:text-right">
                          <p className="text-xs text-slate-400 sm:hidden">
                            Cutoff records
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-600 sm:mt-0">
                            {course.summary.totalCutoffRecords}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {college.courses.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setExpandedCourses((current) => !current)}
                    className="mt-6 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {expandedCourses
                      ? "Show fewer programs"
                      : `Show all ${college.courses.length} programs`}
                  </button>
                )}
              </>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl bg-indigo-600 p-6 text-white shadow-lg shadow-indigo-600/20">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-100">
                JEE Main predictor
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                See where your rank could take you.
              </h2>
              <p className="mt-3 text-sm leading-6 text-indigo-100">
                Match your rank, category, gender pool, and quota against
                historical JoSAA cutoff data.
              </p>

              <Link
                href="/predict"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
              >
                Try the predictor
                <span className="ml-2">→</span>
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Data note
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Cutoffs reflect JoSAA 2024 Round 5. They are useful historical
                guidance, not an admission guarantee.
              </p>
            </div>
          </aside>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Student reviews
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Experiences from students
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              {college.reviews.length} review
              {college.reviews.length === 1 ? "" : "s"}
            </p>
          </div>

          {college.reviews.length === 0 ? (
            <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                ✦
              </div>
              <h3 className="mt-4 font-semibold">No reviews yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                This MVP keeps reviews read-only and shows a clear empty state
                until verified student-review data is available.
              </p>
            </div>
          ) : (
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              {college.reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{review.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {review.reviewerName}
                        {review.reviewerCourse
                          ? ` · ${review.reviewerCourse}`
                          : ""}
                        {review.graduationYear
                          ? ` · Class of ${review.graduationYear}`
                          : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                      ★ {review.rating.toFixed(1)}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {review.body}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}