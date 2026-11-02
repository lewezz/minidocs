import Link from "next/link";

export default function NotFound() {
  return (
    <main className="fallback-page">
      <h1>Page not found</h1>
      <p>Return to your documents to continue.</p>
      <Link className="button button--primary" href="/">Back to documents</Link>
    </main>
  );
}
