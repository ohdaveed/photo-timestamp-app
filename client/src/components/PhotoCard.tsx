/**
 * PhotoCard — Individual photo preview with viewfinder corners,
 * processing status, metadata chips, and download button.
 * "Precision Lens" design system.
 */

import { ProcessedPhoto } from "@/lib/photoProcessor";
import { motion } from "framer-motion";
import {
  Download,
  X,
  MapPin,
  Clock,
  Camera,
  AlertCircle,
  Loader2,
  Check,
  Eye,
} from "lucide-react";
import { useState } from "react";

interface PhotoCardProps {
  photo: ProcessedPhoto;
  index: number;
  onRemove: (id: string) => void;
  onDownload: (id: string) => void;
}

export default function PhotoCard({
  photo,
  index,
  onRemove,
  onDownload,
}: PhotoCardProps) {
  const [showProcessed, setShowProcessed] = useState(true);
  const isDone = photo.status === "done";
  const isError = photo.status === "error";
  const isWorking =
    photo.status === "converting" ||
    photo.status === "reading" ||
    photo.status === "geocoding" ||
    photo.status === "stamping";

  const displayUrl = isDone && showProcessed && photo.processedUrl
    ? photo.processedUrl
    : photo.originalUrl;

  const statusLabel = {
    pending: "Waiting...",
    converting: "Decoding HEIC...",
    reading: "Reading EXIF...",
    geocoding: "Finding location...",
    stamping: "Adding timestamp...",
    done: "Ready",
    error: photo.error || "Error",
  }[photo.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className={`
        relative group bg-card rounded-lg border overflow-hidden shadow-sm
        hover:shadow-md transition-shadow duration-200
        ${isDone ? "viewfinder-done" : ""}
      `}
    >
      {/* Viewfinder corners */}
      <div className="viewfinder-corner top-left" />
      <div className="viewfinder-corner top-right" />
      <div className="viewfinder-corner bottom-left" />
      <div className="viewfinder-corner bottom-right" />

      {/* Image preview */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={displayUrl}
          alt={photo.originalFile.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Processing overlay */}
        {isWorking && (
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <span className="text-xs font-mono text-white/90">{statusLabel}</span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {isError && (
          <div className="absolute inset-0 bg-destructive/20 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <span className="text-xs font-mono text-destructive">{statusLabel}</span>
            </div>
          </div>
        )}

        {/* Done badge */}
        {isDone && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg"
          >
            <Check className="w-3.5 h-3.5 text-primary-foreground" />
          </motion.div>
        )}

        {/* Remove button */}
        <button
          onClick={() => onRemove(photo.id)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-foreground/60 hover:bg-foreground/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>

        {/* Toggle original/processed */}
        {isDone && photo.processedUrl && (
          <button
            onClick={() => setShowProcessed(!showProcessed)}
            className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-foreground/60 hover:bg-foreground/80 text-white text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Eye className="w-3 h-3" />
            {showProcessed ? "Original" : "Stamped"}
          </button>
        )}
      </div>

      {/* Info section */}
      <div className="p-3 space-y-2">
        {/* Filename */}
        <p className="text-xs font-medium text-foreground truncate" title={photo.originalFile.name}>
          {photo.originalFile.name}
        </p>

        {/* Metadata chips */}
        <div className="flex flex-wrap gap-1.5">
          {photo.metadata.dateTime && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[10px] font-mono text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              {photo.metadata.dateTime.toLocaleDateString()}
            </span>
          )}
          {photo.metadata.locationName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[10px] font-mono text-muted-foreground max-w-[160px]" title={photo.metadata.locationName}>
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{photo.metadata.locationName}</span>
            </span>
          )}
          {photo.metadata.latitude != null && photo.metadata.longitude != null && !photo.metadata.locationName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[10px] font-mono text-muted-foreground">
              <MapPin className="w-2.5 h-2.5" />
              {photo.metadata.latitude.toFixed(2)}°, {photo.metadata.longitude.toFixed(2)}°
            </span>
          )}
          {photo.metadata.cameraModel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[10px] font-mono text-muted-foreground">
              <Camera className="w-2.5 h-2.5" />
              {photo.metadata.cameraModel}
            </span>
          )}
          {!photo.metadata.dateTime && !photo.metadata.locationName && isDone && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-[10px] font-mono text-destructive">
              <AlertCircle className="w-2.5 h-2.5" />
              No EXIF data found
            </span>
          )}
        </div>

        {/* Download button */}
        {isDone && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onDownload(photo.id)}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors duration-200"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
