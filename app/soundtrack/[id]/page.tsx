"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { useProjectStore } from "@/store/useProjectStore";

function SoundtrackContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const project = useProjectStore((state) => state.projects[params.id]);

  const titleFromUrl = searchParams.get("t") ?? null;
  const displayTitle = project?.title ?? titleFromUrl ?? "포토북 사운드트랙";

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}/music`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project: project ?? { id: params.id },
          }),
        });
        const data = (await response.json()) as {
          audioUrl?: string | null;
          message?: string;
        };

        if (!response.ok) {
          setAudioUrl(null);
          setMessage(data.message ?? "사운드트랙을 지금 사용할 수 없습니다.");
          return;
        }

        setAudioUrl(data.audioUrl ?? null);
        setMessage(data.audioUrl ? null : "사운드트랙을 지금 사용할 수 없습니다.");
      } catch {
        setAudioUrl(null);
        setMessage("사운드트랙을 지금 사용할 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    void fetchMusic();
  }, [params.id, project]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-6 py-16">
      <div className="flex w-full max-w-lg flex-col items-center gap-10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          사운드트랙
        </p>

        <div className="text-[4rem] text-white/15">♪</div>

        <h1 className="text-3xl font-semibold leading-tight text-white/95">
          {displayTitle}
        </h1>

        <div className="w-full">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-white/40" />
              </div>
              <p className="text-sm text-white/40">
                사운드트랙을 생성하고 있습니다.
              </p>
            </div>
          ) : audioUrl ? (
            <audio
              controls
              autoPlay
              className="w-full rounded-lg"
              src={audioUrl}
            >
              오디오 재생을 지원하지 않는 브라우저입니다.
            </audio>
          ) : (
            <p className="text-sm leading-relaxed text-white/40">
              {message ?? "이 프로젝트에는 아직 사운드트랙이 설정되지 않았습니다."}
            </p>
          )}
        </div>

        <p className="mt-8 text-[11px] uppercase tracking-[0.25em] text-white/20">
          SweetBook Studio 제공
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
