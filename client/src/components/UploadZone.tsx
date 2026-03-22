/**
 * UploadZone — Drag-and-drop / click-to-upload area
 * "Precision Lens" design: pulsing dashed border, camera viewfinder motifs
 */

import { useCallback, useRef, useState } from "react";
import { Upload, ImagePlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
  isProcessing: boolean;
  hasPhotos: boolean;
}

export default function UploadZone({ onFiles, isProcessing, hasPhotos }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      onFiles(files);
    },
    [onFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      onFiles(files);
      // Reset input so same files can be re-selected
      e.target.value = "";
    },
    [onFiles]
  );

  // Compact version when photos exist
  if (hasPhotos) {
    return (
      <motion.button
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        disabled={isProcessing}
        className={`
          relative flex items-center gap-3 px-5 py-3 rounded-lg border-2 border-dashed
          transition-all duration-200
          ${isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
          }
          ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
        `}
        whileHover={{ scale: isProcessing ? 1 : 1.01 }}
        whileTap={{ scale: isProcessing ? 1 : 0.99 }}
      >
        <ImagePlus className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-foreground">
          Add more photos
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative group rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-300 ease-out overflow-hidden
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
          ${isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/40"
          }
        `}
      >
        {/* Viewfinder corners */}
        <div className="viewfinder-corner top-left" />
        <div className="viewfinder-corner top-right" />
        <div className="viewfinder-corner bottom-left" />
        <div className="viewfinder-corner bottom-right" />

        <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-6">
          <AnimatePresence mode="wait">
            {isDragging ? (
              <motion.div
                key="dropping"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="text-lg font-semibold text-primary">
                  Drop photos here
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                  <ImagePlus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">
                    Drop photos here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports JPEG, PNG, HEIC, and other image formats with EXIF data
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </div>
    </motion.div>
  );
}
