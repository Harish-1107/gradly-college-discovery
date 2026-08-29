"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthNav } from "../../components/AuthNav";

type College = {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
  state: string;
  rating: number | null;
  nirfRank: number | null;
  nirfBand: string | null;
};

type ApiResponse = {
  data?: College[];
  error?: {
    message: string;
  };
};

export default function Home() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadColleges() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "12",
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (type !== "ALL") {
          params.set("type", type);
        }

        const response = await fetch(`/api/colleges?${params.toString()}`, {
          signal: controller.signal,
        });

        const payload: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error?.message || "Unable to load colleges."
          );
        }

        setColleges(payload.data || []);
      } catch (requestError) {
        if (requestError instanceof DOMException) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load colleges."
        );
      } finally {
        setLoading(false);
      }
    }

    const timeout = window.setTimeout(loadColleges, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [search, type]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 font-bold shadow-lg shadow-indigo-500/30">
              G
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Gradly
            </span>
          </Link>

          <div className="flex items-center gap-2 text-sm text-slate-300">
  <Link
    href="/predict"
    className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
  >
    JEE Predictor
  </Link>

  <AuthNav />

  <span className="hidden rounded-full border border-white/10 px-4 py-2 sm:inline-flex">
    2024 data
  </span>
</div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="mx-auto max-w-7xl px-6 pb-14 pt-20 lg:px-8 lg:pb-20 lg:pt-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-2 text-sm text-indigo-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Explore colleges with confidence
            </div>

            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
              Find the college that fits your{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-cyan-200 to-white bg-clip-text text-transparent">
                ambition.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Search NITs and IIITs, understand their courses and cutoffs, and
              get a clear JEE Main prediction based on real counselling data.
            </p>
          </div>

          <div className="mt-10 grid gap-3 rounded-3xl border border-white/10 bg-white/[0.07] p-3 shadow-2xl shadow-black/20 backdrop-blur sm:grid-cols-[1fr_190px]">
            <label className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-slate-900">
              <svg
                aria-hidden="true"
                className="h-5 w-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                  strokeLinecap="round"
                />
              </svg>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by college, city, or state..."
                className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
              />
            </label>

            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="rounded-2xl border-0 bg-slate-800 px-5 py-4 text-sm text-white outline-none ring-indigo-400 transition focus:ring-2"
            >
              <option value="ALL">All institutes</option>
              <option value="NIT">NITs</option>
              <option value="IIIT">IIITs</option>
            </select>
          </div>
        </div>
      </section>

      <section className="bg-slate-100 text-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                The explorer
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Discover your options
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              {loading ? "Loading colleges..." : `${colleges.length} results shown`}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-3xl bg-white"
                />
              ))}
            </div>
          ) : colleges.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <h3 className="text-lg font-semibold">No colleges found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a different name, city, state, or institute type.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {colleges.map((college) => (
                <Link
                  key={college.id}
                  href={`/colleges/${college.slug}`}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-bold text-indigo-600">
                      {college.name.charAt(0)}
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {college.type}
                    </span>
                  </div>

                  <h3 className="mt-6 line-clamp-2 text-xl font-semibold leading-7 tracking-tight group-hover:text-indigo-600">
                    {college.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {college.city}, {college.state}
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Rating
                      </p>
                      <p className="mt-1 font-semibold">
                        {college.rating ?? "Not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        NIRF
                      </p>
                      <p className="mt-1 font-semibold">
                        {college.nirfRank
                          ? `#${college.nirfRank}`
                          : college.nirfBand || "Band data"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center text-sm font-semibold text-indigo-600">
                    View details
                    <span className="ml-2 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:grid-cols-3 lg:px-8">
          <div>
            <p className="text-3xl font-semibold text-indigo-600">55</p>
            <p className="mt-2 text-sm text-slate-500">NITs and IIITs covered</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-indigo-600">6,641</p>
            <p className="mt-2 text-sm text-slate-500">JoSAA cutoff records</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-indigo-600">2024</p>
            <p className="mt-2 text-sm text-slate-500">Final-round data year</p>
          </div>
        </div>
      </section>
    </main>
  );
}