"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type College = {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
  state: string;
  rating: number | null;
  nirfRank: number | null;
};

type Prediction = {
  college: College;
  course: {
    id: string;
    name: string;
  };
  chance: "LIKELY" | "TARGET" | "AMBITIOUS";
  chanceLabel: string;
  reason: string;
  previousCutoff: {
    openingRank: number;
    closingRank: number;
    year: number;
    round: number;
    category: string;
    gender: string;
    quota: string;
  };
};

type PredictorResponse = {
  data?: {
    input: {
      exam: string;
      rank: number;
      category: string;
      gender: string;
      quota: string;
    };
    dataSource: {
      name: string;
      year: number;
      round: number;
      note: string;
    };
    totalMatches: number;
    predictions: {
      likely: Prediction[];
      target: Prediction[];
      ambitious: Prediction[];
    };
  };
  error?: {
    code: string;
    message: string;
  };
};

type FormValues = {
  rank: string;
  category: string;
  gender: string;
  quota: string;
};

const initialForm: FormValues = {
  rank: "",
  category: "OPEN",
  gender: "Gender-Neutral",
  quota: "OS",
};

function formatRank(rank: number) {
  return rank.toLocaleString("en-IN");
}


function ResultSection({
  title,
  description,
  predictions,
  tone,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  predictions: Prediction[];
  tone: "emerald" | "blue" | "amber";
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const colors = {
    emerald: {
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      dot: "bg-emerald-500",
      border: "border-emerald-100",
      hover: "hover:border-emerald-200",
    },
    blue: {
      badge: "bg-blue-50 text-blue-700 ring-blue-200",
      dot: "bg-blue-500",
      border: "border-blue-100",
      hover: "hover:border-blue-200",
    },
    amber: {
      badge: "bg-amber-50 text-amber-700 ring-amber-200",
      dot: "bg-amber-500",
      border: "border-amber-100",
      hover: "hover:border-amber-200",
    },
  }[tone];

  if (predictions.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm transition ${colors.border} ${colors.hover}`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />

            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${colors.badge}`}
            >
              {predictions.length} option
              {predictions.length === 1 ? "" : "s"}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>

        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-semibold text-slate-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ⌄
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 grid gap-4">
          {predictions.map((prediction) => (
            <article
              key={`${prediction.college.id}-${prediction.course.id}-${prediction.previousCutoff.quota}-${prediction.previousCutoff.category}`}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${colors.border}`}
            >
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {prediction.college.type}
                    </span>

                    <span className="text-sm text-slate-500">
                      {prediction.college.city}, {prediction.college.state}
                    </span>
                  </div>

                  <Link
                    href={`/colleges/${prediction.college.slug}`}
                    className="mt-3 block text-lg font-semibold tracking-tight transition hover:text-indigo-600"
                  >
                    {prediction.college.name}
                  </Link>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {prediction.course.name}
                  </p>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    {prediction.reason}
                  </p>
                </div>

                <div className="grid min-w-[170px] grid-cols-2 gap-3 sm:block">
                  <div className="rounded-xl bg-slate-50 p-3 sm:mb-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Closing rank
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatRank(prediction.previousCutoff.closingRank)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Previous range
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatRank(prediction.previousCutoff.openingRank)}–
                      {formatRank(prediction.previousCutoff.closingRank)}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}                  

export default function PredictorPage() {
  const [form, setForm] = useState<FormValues>(initialForm);
  const [result, setResult] = useState<PredictorResponse["data"] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof FormValues, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const rank = Number(form.rank);

    if (!Number.isInteger(rank) || rank < 1 || rank > 2_000_000) {
      setResult(null);
      setError("Enter a whole JEE Main rank between 1 and 2,000,000.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exam: "JEE_MAIN",
          rank,
          category: form.category,
          gender: form.gender,
          quota: form.quota,
        }),
      });

      const payload: PredictorResponse = await response.json();

      if (!response.ok || !payload.data) {
        throw new Error(
          payload.error?.message || "Unable to generate predictions."
        );
      }

      setResult(payload.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to generate predictions."
      );
    } finally {
      setLoading(false);
    }
  }

  const totalResults = result?.totalMatches ?? 0;

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
            href="/"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600"
          >
            Explore colleges
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute left-1/2 top-0 -z-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-400/10 px-4 py-2 text-sm text-indigo-100">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Historical JoSAA cutoff guidance
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
              Turn your rank into a{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-cyan-200 to-white bg-clip-text text-transparent">
                practical shortlist.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Use your JEE Main rank, category, gender pool, and quota to find
              NIT and IIIT courses matched against real JoSAA 2024 final-round
              cutoffs.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Your profile
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Enter your counselling details
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              All fields are required for an accurate match.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <label className="block xl:col-span-1">
              <span className="text-sm font-semibold text-slate-700">
                JEE Main rank
              </span>
              <input
                type="number"
                min="1"
                max="2000000"
                inputMode="numeric"
                value={form.rank}
                onChange={(event) => updateField("rank", event.target.value)}
                placeholder="e.g. 25000"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Category
              </span>
              <select
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="OPEN">OPEN</option>
                <option value="EWS">EWS</option>
                <option value="OBC-NCL">OBC-NCL</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Seat pool
              </span>
              <select
                value={form.gender}
                onChange={(event) => updateField("gender", event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="Gender-Neutral">Gender-Neutral</option>
                <option value="Female-only (including Supernumerary)">
  Female-only
</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Quota
              </span>
              <select
                value={form.quota}
                onChange={(event) => updateField("quota", event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="OS">Other State (OS)</option>
                <option value="HS">Home State (HS)</option>
                <option value="AI">All India (AI)</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Building shortlist..." : "Get predictions"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        {loading && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              Comparing your profile against historical cutoff records…
            </div>
          </section>
        )}

        {result && !loading && (
          <section className="mt-8">
            <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-lg sm:flex sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
                  Your shortlist
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {totalResults > 0
                    ? `${totalResults} matched course${totalResults === 1 ? "" : "s"}`
                    : "No close matches found"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Rank {formatRank(result.input.rank)} · {result.input.category} ·{" "}
                  {result.input.gender} · {result.input.quota}
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-200 sm:mt-0">
                {result.dataSource.year} Round {result.dataSource.round}
              </div>
            </div>

            {totalResults === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <h3 className="text-lg font-semibold">
                  No courses fell within the current recommendation range
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  Try another quota when applicable, verify your category and
                  seat-pool selection, or use the explorer to research colleges
                  outside the suggested range.
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Explore all colleges
                </Link>
              </div>
            ) : (
              <>
                <ResultSection
                  title="Likely"
                  description="Your rank is safely stronger than the historical closing rank."
                  predictions={result.predictions.likely}
                  tone="emerald"
                  defaultOpen
                />
                <ResultSection
                  title="Target"
                  description="Your rank falls within the historical cutoff range."
                  predictions={result.predictions.target}
                  tone="blue"
                />
                <ResultSection
                  title="Ambitious"
                  description="Your rank is close to, but slightly beyond, the historical cutoff."
                  predictions={result.predictions.ambitious}
                  tone="amber"
                />

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">
                  <span className="font-semibold text-slate-900">Important:</span>{" "}
                  {result.dataSource.note}
                </div>
              </>
            )}
          </section>
        )}

        {!result && !loading && !error && (
          <section className="mt-8 grid gap-5 md:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-indigo-600">1. Enter rank</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Provide your JEE Main rank and counselling-specific details.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-indigo-600">2. Match data</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Gradly compares your profile with JoSAA 2024 Round 5 cutoff records.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-indigo-600">3. Decide clearly</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Review Likely, Target, and Ambitious options—not six confusing rounds.
              </p>
            </article>
          </section>
        )}
      </div>
    </main>
  );
}