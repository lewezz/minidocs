"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="fallback-page">
      <h1>Unable to load documents</h1>
      <p>An error occurred while loading this page. Please try again.</p>
      <button type="button" className="button button--primary" onClick={reset}>Try again</button>
      <Link href="/">Back to documents</Link>
    </main>
  );
}
