"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SaveInstituteButtonProps = {
  instituteId: string;
  initialSaved?: boolean;
};

export function SaveInstituteButton({
  instituteId,
  initialSaved = false,
}: SaveInstituteButtonProps) {
  const router = useRouter();

  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
    setIsLoading(true);

    try {
      if (isSaved) {
        const response = await fetch(
          `/api/saved-institutes/${instituteId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const data = await response.json();
          setError(data.error ?? "Unable to remove institute.");
          return;
        }

        setIsSaved(false);
        router.refresh();
        return;
      }

      const response = await fetch("/api/saved-institutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ instituteId }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        setError(data.error ?? "Unable to save institute.");
        return;
      }

      setIsSaved(true);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={
          isSaved
            ? "rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            : "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {isLoading
          ? "Please wait..."
          : isSaved
            ? "Saved"
            : "Save institute"}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}