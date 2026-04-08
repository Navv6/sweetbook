"use client";

import { QRCodeSVG } from "qrcode.react";

type SoundtrackQRProps = {
  projectId: string;
  projectTitle: string;
  size?: number;
};

export function SoundtrackQR({
  projectId,
  projectTitle,
  size = 120,
}: SoundtrackQRProps) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://sweetbook.vercel.app";
  const url = `${baseUrl}/soundtrack/${projectId}?t=${encodeURIComponent(projectTitle)}`;

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="rounded-lg bg-white p-2">
        <QRCodeSVG value={url} size={size} />
      </div>
      <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
        {"이 책의 사운드트랙"}
      </p>
      <p
        className="max-w-[160px] break-all text-center text-[10px] leading-relaxed"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        {url}
      </p>
      <p
        className="text-[10px]"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {projectTitle}
      </p>
    </div>
  );
}
