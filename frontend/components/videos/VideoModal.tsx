'use client';

import ReactPlayer from 'react-player';
import { getImageUrl } from '@/hooks/useApi';

export default function VideoModal({ video, onClose }: { video: any; onClose: () => void }) {
  return (
    <div
      className="animate-fade-in fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="animate-scale-in relative w-full max-w-4xl bg-paper-50 rounded-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* playsInline keeps the video inside the modal on iOS, which
            otherwise hijacks playback into its own fullscreen player. */}
        <ReactPlayer
          url={getImageUrl(video.videoPath)}
          width="100%"
          height="400px"
          controls
          playing
          config={{
            file: {
              attributes: {
                playsInline: true,
                preload: 'metadata',
                poster: getImageUrl(video.thumbnailPath),
              },
            },
          }}
        />

        <div className="p-6">
          <h3 className="text-2xl font-semibold mb-3">{video.title}</h3>
          <p className="text-ink-500 mb-4">{video.description}</p>
          <div className="flex items-center justify-between">
            <span className="bg-sea-50 text-sea-700 px-3 py-1 rounded-full text-sm font-medium">
              {video.videoCategory.name}
            </span>
            <button
              onClick={onClose}
              className="text-ink-500 hover:text-ink transition-colors duration-200"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
