'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { CloudinaryVideo } from '@/types';
import { getVideoUrl, getVideoPosterUrl } from '@/services/cloudinaryService';

interface Props {
  video: CloudinaryVideo;
}

export default function VideoPreview({ video }: Props) {
  const [playing, setPlaying] = useState(false);
  const posterUrl = getVideoPosterUrl(video.publicId);
  const videoUrl  = getVideoUrl(video.publicId);

  if (playing) {
    return (
      <div className="video-preview video-preview--playing">
        <video
          src={videoUrl}
          autoPlay
          controls
          playsInline
          className="video-preview__player"
          onEnded={() => setPlaying(false)}
        />
      </div>
    );
  }

  return (
    <button
      className="video-preview"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${video.title ?? 'Product video'}`}
    >
      <div className="video-preview__poster">
        <Image
          src={posterUrl}
          alt={video.title ?? 'Video thumbnail'}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="video-preview__play-btn" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="24" fill="rgba(0,0,0,0.55)" />
          <polygon points="19,14 38,24 19,34" fill="white" />
        </svg>
      </div>
      {video.title && (
        <span className="video-preview__title">{video.title}</span>
      )}
    </button>
  );
}
