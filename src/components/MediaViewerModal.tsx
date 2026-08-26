import React from 'react';
import { X, Download } from 'lucide-react';

interface MediaViewerModalProps {
  media: { url: string; type: 'image' | 'video' } | null;
  onClose: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({ media, onClose }) => {
  if (!media) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      {/* Top Bar */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <a
          href={media.url}
          download="ettl-media"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Download Media"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div
        className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center relative select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {media.type === 'video' ? (
          <video
            src={media.url}
            controls
            autoPlay
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
          />
        ) : (
          <img
            src={media.url}
            alt="Preview"
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
          />
        )}
      </div>
    </div>
  );
};
