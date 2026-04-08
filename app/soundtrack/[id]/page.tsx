"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { useProjectStore } from "@/store/useProjectStore";

export default function SoundtrackPage() {
  const params = useParams<{ id: string }>();
  const project = useProjectStore((state) => state.projects[params.id]);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!project) {
      setLoading(false);
      return;
    }

    const fetchMusic = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}/music`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project }),
        });
        const data = (await response.json()) as { audioUrl: string | null; isMock: boolean };
        setAudioUrl(data.audioUrl);
      } catch {
        setAudioUrl(null);
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
        {/* 레이블 */}
        <p
          className="text-xs uppercase tracking-[0.3em]"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {"SweetBook Soundtrack"}
        </p>

        {/* 책 제목 */}
        <h1
          className="text-4xl font-semibold leading-tight"
          style={{ color: "rgba(255,255,255,0.95)" }}
        >
          {project?.title ?? "포토북 사운드트랙"}
        </h1>

        {/* 오디오 영역 */}
        <div className="w-full">
          {loading ? (
            <p
              className="text-sm"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {"음악을 생성하고 있습니다…"}
            </p>
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
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {"이 포토북을 위한 음악을 준비하고 있습니다"}
            </p>
          )}
        </div>

        {/* 하단 브랜딩 */}
        <p
          className="text-[11px] uppercase tracking-[0.25em] mt-8"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          {"SweetBook Studio"}
        </p>
      </div>
    </main>
  );
}
