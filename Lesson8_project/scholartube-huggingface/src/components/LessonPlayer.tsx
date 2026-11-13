"use client";

import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

interface LessonPlayerProps {
  url: string;
  title: string;
}

export function LessonPlayer({ url, title }: LessonPlayerProps) {
  return (
    <div className="playerFrame" aria-label={title}>
      <ReactPlayer
        src={url}
        controls
        playsInline
        style={{ width: "100%", height: "100%", aspectRatio: "16 / 9" }}
      />
    </div>
  );
}
