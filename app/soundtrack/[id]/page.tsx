"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { useProjectStore } from "@/store/useProjectStore";

function SoundtrackContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const project = useProjectStore((state) => state.projects[params.id]);

  const titleFromUrl = searchParams.get("t") ?? null;
  const displayTitle = project?.title ?? titleFromUrl ?? "Photo Book Soundtrack";

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!project) {
      setAudioUrl(null);
      setMessage("Soundtrack is not configured for this project yet.");
      setLoading(false);
      return;
    }

    const fetchMusic = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}/music`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project,
          }),
        });
        const data = (await response.json()) as {
          audioUrl?: string | null;
          message?: string;
        };

        if (!response.ok) {
          setAudioUrl(null);
          setMessage(data.message ?? "Soundtrack is not available right now.");
          return;
        }

        setAudioUrl(data.audioUrl ?? null);
        setMessage(data.audioUrl ? null : "Soundtrack is not available right now.");
      } catch {
        setAudioUrl(null);
        setMessage("Soundtrack is not available right now.");
      } finally {
        setLoading(false);
      }
    };

    void fetchMusic();
  }, [params.id, project]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{
        background:
          "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-10 text-center max-w-lg w-full">
        <p
          className="text-xs uppercase tracking-[0.3em]"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          SweetBook Soundtrack
        </p>

        <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "4rem" }}>
          ♪
        </div>

        <h1
          className="text-3xl font-semibold leading-tight"
          style={{ color: "rgba(255,255,255,0.95)" }}
        >
          {displayTitle}
        </h1>

        <div className="w-full">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div
                className="h-1 w-48 overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <div
                  className="h-full w-1/2 rounded-full animate-pulse"
                  style={{ background: "rgba(255,255,255,0.4)" }}
                />
              </div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                Generating a lightweight soundtrack for the book.
              </p>
            </div>
          ) : audioUrl ? (
            <audio
              controls
              autoPlay
              className="w-full"
              style={{ borderRadius: "8px" }}
              src={audioUrl}
            >
              Your browser does not support audio playback.
            </audio>
          ) : (
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {message ?? "Soundtrack is not configured for this project yet."}
            </p>
          )}
        </div>

        <p
          className="text-[11px] uppercase tracking-[0.25em] mt-8"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          Powered by SweetBook Studio
        </p>
      </div>
    </main>
  );
}

export default function SoundtrackPage() {
  return (
    <Suspense>
      <SoundtrackContent />
    </Suspense>
  );
}
