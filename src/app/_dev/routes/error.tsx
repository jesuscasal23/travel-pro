"use client";

// Architecture visualization only: show a targeted recovery path for visualizer-only runtime errors.
export default function RoutesDevError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-16 text-slate-950">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
          Development Only
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Architecture Map</h1>
        <p className="mt-3 text-sm text-slate-700">
          The route visualizer hit a client-side runtime error. With `next-route-visualizer` and
          `reactflow`, this is usually a dev hot-reload issue rather than a graph generation
          problem.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          First try a hard refresh. If it keeps happening, restart the dev server with{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run dev:webpack</code> and open{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">/_dev/routes</code> again.
        </p>
        {error.message ? (
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
            {error.message}
          </pre>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Try again
          </button>
          <a
            href="/_dev/routes"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Reload route
          </a>
        </div>
      </div>
    </main>
  );
}
