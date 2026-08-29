"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SaveInstituteButton } from "../../../components/SaveInstituteButton";

type Institute = {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
  state: string;
  rating: number | null;
  nirfRank: number | null;
};

type SavedInstitute = {
  id: string;
  institute: Institute;
};

export default function SavedPage() {
  const [savedInstitutes, setSavedInstitutes] = useState<SavedInstitute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSavedInstitutes() {
      try {
        const response = await fetch("/api/saved-institutes");

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Unable to load saved institutes.");
          return;
        }

        setSavedInstitutes(data.savedInstitutes);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadSavedInstitutes();
  }, []);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm text-zinc-600">Loading saved institutes...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Your shortlist</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            Saved institutes
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Keep track of institutes you want to consider.
          </p>
        </div>

        <Link
          href="/"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:border-blue-300 hover:text-blue-700"
        >
          Explore institutes
        </Link>
      </div>

      {savedInstitutes.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-zinc-900">
            No saved institutes yet
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Explore colleges and save the ones you want to revisit.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Browse institutes
          </Link>
        </section>
      ) : (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedInstitutes.map(({ id, institute }) => (
            <article
              key={id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                {institute.type}
              </p>

              <h2 className="mt-2 text-lg font-semibold text-zinc-900">
                {institute.name}
              </h2>

              <p className="mt-2 text-sm text-zinc-600">
                {institute.city}, {institute.state}
              </p>

              <div className="mt-4 flex gap-4 text-sm text-zinc-700">
                <span>Rating: {institute.rating ?? "—"}</span>
                <span>NIRF: {institute.nirfRank ?? "—"}</span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href={`/college/${institute.slug}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  View details
                </Link>

                <SaveInstituteButton
                  instituteId={institute.id}
                  initialSaved
                />
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}