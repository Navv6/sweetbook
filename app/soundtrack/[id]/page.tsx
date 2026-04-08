"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { useProjectStore } from "@/store/useProjectStore";

function SoundtrackContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const project = useProjectStore((state) => state.projects[params.id]);

  // 폰으로 QR 스캔 시 Zustand 스토어가 없을 수 있어 → URL 파라미터로 fallback
  const titleFromUrl = searchParams.get("t") ?? null;
  const displayTitle = project?.title ?? titleFromUrl ?? "포토북 사운드트랙";

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}/music`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project: project ?? {
              id: params.id,
              title: displayTitle,
              generatedSections: [],
            },
          }),
        });
        const data = (await response.json()) as {
          audioUrl: string | null;
          isMock: boolean;
        };
        setAudioUrl(data.audioUrl);
      } catch {
        setAudioUrl(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchMusic();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

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
          {"SweetBook Soundtrack"}
        </p>

        {/* 음표 아이콘 */}
        <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "4rem" }}>
          {"♪"}
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
                {"이 포토북을 위한 음악을 생성하고 있습니다…"}
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
              {"브라우저가 audio 태그를 지원하지 않습니다."}
            </audio>
          ) : (
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {"REPLICATE_API_TOKEN을 설정하면 이 포토북만의 AI 음악이 생성됩니다."}
            </p>
          )}
        </div>

        <p
          className="text-[11px] uppercase tracking-[0.25em] mt-8"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          {"Powered by SweetBook Studio"}
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
