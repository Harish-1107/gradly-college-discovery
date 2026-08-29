"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

export function AuthNav() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      setUser(null);
      router.push("/");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isLoading) {
    return (
      <div className="h-9 w-40 animate-pulse rounded-full bg-white/10" />
    );
  }

  if (!user) {
    return (
      <>
        <Link
          href="/login"
          className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
        >
          Sign in
        </Link>

        <Link
          href="/signup"
          className="rounded-full bg-indigo-500 px-4 py-2 font-medium text-white transition hover:bg-indigo-400"
        >
          Create account
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/saved"
        className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
      >
        Saved
      </Link>

      <span className="hidden rounded-full border border-white/10 px-4 py-2 text-slate-200 md:inline-flex">
        {user.name}
      </span>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>
    </>
  );
}