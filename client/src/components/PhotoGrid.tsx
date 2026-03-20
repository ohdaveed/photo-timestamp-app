/**
 * PhotoGrid — Responsive grid of PhotoCards with batch action bar
 */

import { ProcessedPhoto } from "@/lib/photoProcessor";
import PhotoCard from "./PhotoCard";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Trash2, Loader2, Package } from "lucide-react";

interface PhotoGridProps {
  photos: ProcessedPhoto[];
  onRemove: (id: string) => void;
  onDownload: (id: string) => void;
  onDownloadAll: () => void;
  onClearAll: () => void;
  isProcessing: boolean;
  isDownloading: boolean;
  doneCount: number;
  totalCount: number;
}

export default function PhotoGrid({
  photos,
  onRemove,
  onDownload,
  onDownloadAll,
  onClearAll,
  isProcessing,
  isDownloading,
  doneCount,
  totalCount,
}: PhotoGridProps) {
  if (photos.length === 0) return null;

  return (
    <div className="space-y-5">
      {/* Action bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        {/* Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <Package className="w-4 h-4 text-primary" />
            )}
            <span className="text-sm font-medium text-foreground">
              {isProcessing
                ? `Processing... (${doneCount}/${totalCount})`
                : `${doneCount} of ${totalCount} photos ready`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="hidden sm:block w-32 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Batch actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDownloadAll}
            disabled={doneCount === 0 || isDownloading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Zipping...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download All ({doneCount})
              </>
            )}
          </button>

          <button
            onClick={onClearAll}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {photos.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={i}
              onRemove={onRemove}
              onDownload={onDownload}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
