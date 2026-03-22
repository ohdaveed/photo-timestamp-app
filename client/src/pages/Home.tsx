/**
 * Home Page — "Precision Lens" LocalStamp
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
import { Camera, Shield, Zap, MapPin, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

/** Inline SVG aperture illustration for empty state */
function ApertureIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="60"
        cy="60"
        r="56"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.15"
      />
      <circle
        cx="60"
        cy="60"
        r="42"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.2"
      />
      <circle
        cx="60"
        cy="60"
        r="28"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.25"
      />
      {/* Aperture blades */}
      {[0, 60, 120, 180, 240, 300].map(angle => (
        <line
          key={angle}
          x1="60"
          y1="60"
          x2={60 + 42 * Math.cos((angle * Math.PI) / 180)}
          y2={60 + 42 * Math.sin((angle * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.12"
        />
      ))}
      <circle
        cx="60"
        cy="60"
        r="14"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
      />
      <circle cx="60" cy="60" r="4" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

export default function Home() {
  const {
    photos,
    stampOptions,
    setStampOptions,
    isProcessing,
    isDownloading,
    addPhotos,
    removePhoto,
    clearAll,
    handleDownloadAll,
    handleDownloadSingle,
    doneCount,
    errorCount,
    totalCount,
  } = usePhotoProcessor();

  const { theme, toggleTheme } = useTheme();
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
                LocalStamp
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground leading-tight">
                Add time & location to your photos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasPhotos && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-[11px] font-mono text-muted-foreground">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isProcessing ? "bg-amber-500 animate-pulse" : doneCount === totalCount ? "bg-emerald-500" : "bg-primary"}`}
                />
                {isProcessing
                  ? `Processing ${doneCount}/${totalCount}`
                  : `${doneCount} ready${errorCount > 0 ? ` · ${errorCount} errors` : ""}`}
              </div>
            )}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero section — only shown when no photos */}
        {!hasPhotos && (
          <section className="relative overflow-hidden border-b">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background">
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                  backgroundSize: "24px 24px",
                }}
              />
            </div>

            <div className="relative container py-14 sm:py-20 lg:py-24">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-2xl"
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-[1.1]">
                  Stamp your photos
                  <br />
                  <span className="text-primary">with time & place</span>
                </h2>

                <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
                  Drop in your photos to automatically read the date, time, and
                  GPS details. Add clean, readable stamps in seconds, then
                  download everything at once.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2.5 mt-6">
                  {[
                    { icon: Zap, label: "Instant Processing" },
                    { icon: MapPin, label: "GPS Location Lookup" },
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
          {/* Privacy notice */}
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm sm:text-[15px] font-medium text-foreground leading-relaxed">
                Photos are processed entirely in your browser. Nothing is
                uploaded to any server.
              </p>
            </div>
          </div>

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
              <ApertureIllustration className="w-36 h-36 text-muted-foreground" />
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

          {/* EXIF explainer — shown only in empty state */}
          {!hasPhotos && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.45 }}
              className="max-w-3xl mx-auto"
            >
              <div className="rounded-xl border bg-card p-5 sm:p-6">
                <p className="text-[11px] uppercase tracking-widest text-primary font-mono mb-2">
                  EXIF 101
                </p>
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  What is EXIF metadata?
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  EXIF metadata is information saved by your camera when a photo
                  is taken—such as date, time, camera settings, and sometimes
                  GPS coordinates. This app reads that metadata to place
                  accurate time and location stamps on your photos.
                </p>
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
        <div className="container flex items-center justify-center sm:justify-end gap-3">
          <p className="text-xs text-muted-foreground font-mono">
            Powered by exifr & OpenStreetMap Nominatim · © Arrizon.Dev 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
