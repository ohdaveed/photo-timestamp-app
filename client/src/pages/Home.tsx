/**
 * Home Page — "Precision Lens" Photo Timestamp Overlay
 * 
 * Design: Clean technical photography tool aesthetic
 * - DM Sans + JetBrains Mono typography
 * - Teal action color on white base
 * - Camera viewfinder motifs
 * - Photo-first layout with receding UI
 */

import UploadZone from "@/components/UploadZone";
import PhotoGrid from "@/components/PhotoGrid";
import StampSettings from "@/components/StampSettings";
import { usePhotoProcessor } from "@/hooks/usePhotoProcessor";
import { motion } from "framer-motion";
import { Camera, Shield, Zap, MapPin } from "lucide-react";

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663413541485/GP5xNfQSgz4WCJZTUfbtgr/hero-camera-lens-9L9t4qkYMXBBBHdBMxsrDi.webp";
const EMPTY_STATE_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663413541485/GP5xNfQSgz4WCJZTUfbtgr/empty-state-illustration-iqYHZxUE4rD2NYSRoDgqa5.webp";

export default function Home() {
  const {
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
  } = usePhotoProcessor();

  const hasPhotos = photos.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Camera className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight tracking-tight">
                Photo Timestamp
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground leading-tight">
                EXIF Metadata Overlay Tool
              </p>
            </div>
          </div>

          {hasPhotos && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-[11px] font-mono text-muted-foreground">
              <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? "bg-amber-500 animate-pulse" : doneCount === totalCount ? "bg-emerald-500" : "bg-primary"}`} />
              {isProcessing
                ? `Processing ${doneCount}/${totalCount}`
                : `${doneCount} ready${errorCount > 0 ? ` · ${errorCount} errors` : ""}`}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero section — only shown when no photos */}
        {!hasPhotos && (
          <section className="relative overflow-hidden border-b">
            {/* Background image with overlay */}
            <div className="absolute inset-0">
              <img
                src={HERO_IMAGE}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
            </div>

            <div className="relative container py-14 sm:py-20 lg:py-24">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-2xl"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-5">
                  <Shield className="w-3 h-3" />
                  100% Client-Side Processing
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-[1.1]">
                  Stamp your photos
                  <br />
                  <span className="text-primary">with time & place</span>
                </h2>

                <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
                  Upload photos, automatically read EXIF metadata and GPS coordinates, 
                  and overlay formatted timestamps. Download all processed images instantly.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2.5 mt-6">
                  {[
                    { icon: Zap, label: "Instant Processing" },
                    { icon: MapPin, label: "GPS Location Lookup" },
                    { icon: Shield, label: "No Server Upload" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/80 backdrop-blur-sm border text-xs font-medium text-foreground shadow-sm"
                    >
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      {label}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Main workspace */}
        <section className="container py-8 space-y-6">
          {/* Upload zone */}
          <UploadZone
            onFiles={addPhotos}
            isProcessing={isProcessing}
            hasPhotos={hasPhotos}
          />

          {/* Settings — shown when photos exist */}
          {hasPhotos && (
            <StampSettings
              options={stampOptions}
              onChange={setStampOptions}
              onReprocess={reprocessAll}
              hasPhotos={hasPhotos}
              isProcessing={isProcessing}
            />
          )}

          {/* Empty state illustration */}
          {!hasPhotos && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col items-center py-6"
            >
              <img
                src={EMPTY_STATE_IMAGE}
                alt="Camera aperture illustration"
                className="w-36 h-36 opacity-15"
              />
              <p className="mt-3 text-sm text-muted-foreground font-mono">
                Upload photos to get started
              </p>
            </motion.div>
          )}

          {/* How it works — shown only in empty state */}
          {!hasPhotos && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="max-w-3xl mx-auto"
            >
              <h3 className="text-center text-xs font-mono text-muted-foreground uppercase tracking-widest mb-6">
                How It Works
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    step: "01",
                    title: "Upload Photos",
                    desc: "Drag & drop or click to select multiple photos from your device.",
                  },
                  {
                    step: "02",
                    title: "Auto-Process",
                    desc: "EXIF metadata and GPS coordinates are read, then timestamps are overlaid.",
                  },
                  {
                    step: "03",
                    title: "Download All",
                    desc: "Download individual photos or all at once as a ZIP file.",
                  },
                ].map(({ step, title, desc }) => (
                  <div
                    key={step}
                    className="relative p-5 rounded-xl border bg-card hover:shadow-sm transition-shadow duration-200"
                  >
                    <span className="text-3xl font-bold text-primary/15 font-mono absolute top-3 right-4">
                      {step}
                    </span>
                    <h4 className="text-sm font-semibold text-foreground mb-1.5">
                      {title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Photo grid */}
          <PhotoGrid
            photos={photos}
            onRemove={removePhoto}
            onDownload={handleDownloadSingle}
            onDownloadAll={handleDownloadAll}
            onClearAll={clearAll}
            isProcessing={isProcessing}
            isDownloading={isDownloading}
            doneCount={doneCount}
            totalCount={totalCount}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Photos are processed entirely in your browser. Nothing is uploaded to any server.
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            Powered by EXIF.js & OpenStreetMap Nominatim
          </p>
        </div>
      </footer>
    </div>
  );
}
