import { useState } from 'react';
import { ZoomIn, ZoomOut, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ImageZoomModalProps {
  src: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageZoomModal({ src, alt, open, onOpenChange }: ImageZoomModalProps) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.5, 0.5));

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Close if clicking outside the image
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  // Reset zoom when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setZoom(1);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[90vw] max-h-[90vh] p-0 bg-black/90 border-none [&>button]:hidden"
        onClick={handleBackdropClick}
      >
        <div className="relative flex items-center justify-center min-h-[50vh]">
          {/* Controls */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Image */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[80vh] object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
