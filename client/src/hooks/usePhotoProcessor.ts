/**
 * usePhotoProcessor — manages the full lifecycle of photo processing
 * Upload → EXIF read → GPS reverse geocode → Canvas stamp → Ready to download
 */

import { useCallback, useRef, useState } from "react";
import {
  DEFAULT_STAMP_OPTIONS,
  downloadAllAsZip,
  downloadSingle,
  ProcessedPhoto,
  readExifData,
  reverseGeocode,
  stampPhoto,
  StampOptions,
} from "@/lib/photoProcessor";

export function usePhotoProcessor() {
  const [photos, setPhotos] = useState<ProcessedPhoto[]>([]);
  const [stampOptions, setStampOptions] = useState<StampOptions>(DEFAULT_STAMP_OPTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const idCounter = useRef(0);

  const updatePhoto = useCallback(
    (id: string, updates: Partial<ProcessedPhoto>) => {
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    []
  );

  const processPhoto = useCallback(
    async (photo: ProcessedPhoto, options: StampOptions) => {
      try {
        // Step 1: Read EXIF
        updatePhoto(photo.id, { status: "reading" });
        const metadata = await readExifData(photo.originalFile);

        // Step 2: Reverse geocode if GPS available
        if (metadata.latitude != null && metadata.longitude != null) {
          updatePhoto(photo.id, { status: "geocoding", metadata });
          const locationName = await reverseGeocode(
            metadata.latitude,
            metadata.longitude
          );
          metadata.locationName = locationName;
        }

        updatePhoto(photo.id, { metadata });

        // Step 3: Stamp the photo
        updatePhoto(photo.id, { status: "stamping" });
        const processedBlob = await stampPhoto(
          photo.originalFile,
          metadata,
          options
        );
        const processedUrl = URL.createObjectURL(processedBlob);

        updatePhoto(photo.id, {
          status: "done",
          processedBlob,
          processedUrl,
          metadata,
        });
      } catch (err) {
        updatePhoto(photo.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Processing failed",
        });
      }
    },
    [updatePhoto]
  );

  const addPhotos = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) return;

      const newPhotos: ProcessedPhoto[] = imageFiles.map((file) => {
        idCounter.current += 1;
        return {
          id: `photo-${idCounter.current}-${Date.now()}`,
          originalFile: file,
          originalUrl: URL.createObjectURL(file),
          processedUrl: null,
          processedBlob: null,
          metadata: {
            dateTime: null,
            latitude: null,
            longitude: null,
            locationName: null,
            cameraModel: null,
          },
          status: "pending" as const,
        };
      });

      setPhotos((prev) => [...prev, ...newPhotos]);
      setIsProcessing(true);

      // Process sequentially to respect Nominatim rate limits
      for (const photo of newPhotos) {
        await processPhoto(photo, stampOptions);
      }

      setIsProcessing(false);
    },
    [processPhoto, stampOptions]
  );

  const reprocessAll = useCallback(async () => {
    setIsProcessing(true);
    // Reset all photos to pending
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        status: "pending" as const,
        processedUrl: p.processedUrl
          ? (URL.revokeObjectURL(p.processedUrl), null)
          : null,
        processedBlob: null,
      }))
    );

    // Re-read the current photos list
    const currentPhotos = await new Promise<ProcessedPhoto[]>((resolve) => {
      setPhotos((prev) => {
        resolve(prev);
        return prev;
      });
    });

    for (const photo of currentPhotos) {
      await processPhoto(photo, stampOptions);
    }

    setIsProcessing(false);
  }, [processPhoto, stampOptions]);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.originalUrl);
        if (photo.processedUrl) URL.revokeObjectURL(photo.processedUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    photos.forEach((p) => {
      URL.revokeObjectURL(p.originalUrl);
      if (p.processedUrl) URL.revokeObjectURL(p.processedUrl);
    });
    setPhotos([]);
  }, [photos]);

  const handleDownloadAll = useCallback(async () => {
    setIsDownloading(true);
    try {
      await downloadAllAsZip(photos);
    } finally {
      setIsDownloading(false);
    }
  }, [photos]);

  const handleDownloadSingle = useCallback(
    (id: string) => {
      const photo = photos.find((p) => p.id === id);
      if (photo) downloadSingle(photo);
    },
    [photos]
  );

  const doneCount = photos.filter((p) => p.status === "done").length;
  const errorCount = photos.filter((p) => p.status === "error").length;
  const totalCount = photos.length;

  return {
    photos,
    stampOptions,
    setStampOptions,
    isProcessing,
    isDownloading,
    addPhotos,
    reprocessAll,
    removePhoto,
    clearAll,
    handleDownloadAll,
    handleDownloadSingle,
    doneCount,
    errorCount,
    totalCount,
  };
}
