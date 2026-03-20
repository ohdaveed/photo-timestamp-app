/**
 * Photo Processor — "Precision Lens" design
 * 
 * Reads EXIF metadata (date/time, GPS) from photos,
 * reverse-geocodes GPS coordinates via OpenStreetMap Nominatim,
 * and overlays a formatted timestamp + location on each image
 * using the HTML Canvas API. Everything runs client-side.
 */

import exifr from "exifr";

// ─── Types ───────────────────────────────────────────────────────

export interface PhotoMetadata {
  dateTime: Date | null;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  cameraModel: string | null;
}

export interface ProcessedPhoto {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl: string | null;
  processedBlob: Blob | null;
  metadata: PhotoMetadata;
  status: "pending" | "reading" | "geocoding" | "stamping" | "done" | "error";
  error?: string;
}

export interface StampOptions {
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  fontSize: "small" | "medium" | "large";
  showDate: boolean;
  showTime: boolean;
  showLocation: boolean;
  showCoordinates: boolean;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  timeFormat: "12h" | "24h";
  opacity: number;
  textColor: string;
  backgroundColor: string;
}

export const DEFAULT_STAMP_OPTIONS: StampOptions = {
  position: "bottom-right",
  fontSize: "medium",
  showDate: true,
  showTime: true,
  showLocation: true,
  showCoordinates: false,
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  opacity: 0.85,
  textColor: "#FFFFFF",
  backgroundColor: "#000000",
};

// ─── EXIF Reading ────────────────────────────────────────────────

export async function readExifData(file: File): Promise<PhotoMetadata> {
  try {
    const exif = await exifr.parse(file, {
      gps: true,
      pick: [
        "DateTimeOriginal",
        "CreateDate",
        "ModifyDate",
        "GPSLatitude",
        "GPSLongitude",
        "Make",
        "Model",
        "latitude",
        "longitude",
      ],
    });

    if (!exif) {
      return {
        dateTime: null,
        latitude: null,
        longitude: null,
        locationName: null,
        cameraModel: null,
      };
    }

    const dateTime =
      exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate || null;
    const latitude = exif.latitude ?? null;
    const longitude = exif.longitude ?? null;
    const cameraModel = exif.Model
      ? `${exif.Make ? exif.Make + " " : ""}${exif.Model}`
      : null;

    return {
      dateTime: dateTime instanceof Date ? dateTime : dateTime ? new Date(dateTime) : null,
      latitude,
      longitude,
      locationName: null,
      cameraModel,
    };
  } catch {
    return {
      dateTime: null,
      latitude: null,
      longitude: null,
      locationName: null,
      cameraModel: null,
    };
  }
}

// ─── Reverse Geocoding ──────────────────────────────────────────

const geocodeCache = new Map<string, string>();
let lastGeoRequest = 0;

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string | null> {
  const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (geocodeCache.has(key)) {
    return geocodeCache.get(key)!;
  }

  // Nominatim requires 1 request per second
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastGeoRequest));
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastGeoRequest = Date.now();

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14&addressdetails=1`,
      {
        headers: {
          "User-Agent": "PhotoTimestampApp/1.0",
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const addr = data.address;

    // Build a concise location string
    let location = "";
    if (addr) {
      const city =
        addr.city || addr.town || addr.village || addr.hamlet || addr.county || "";
      const state = addr.state || "";
      const country = addr.country || "";

      if (city && state) {
        location = `${city}, ${state}`;
      } else if (city && country) {
        location = `${city}, ${country}`;
      } else if (state && country) {
        location = `${state}, ${country}`;
      } else {
        location = city || state || country || data.display_name?.split(",").slice(0, 2).join(",") || "";
      }
    }

    if (location) {
      geocodeCache.set(key, location);
      return location;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Date/Time Formatting ───────────────────────────────────────

function formatDate(date: Date, format: StampOptions["dateFormat"]): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  switch (format) {
    case "MM/DD/YYYY":
      return `${m}/${d}/${y}`;
    case "DD/MM/YYYY":
      return `${d}/${m}/${y}`;
    case "YYYY-MM-DD":
      return `${y}-${m}-${d}`;
  }
}

function formatTime(date: Date, format: StampOptions["timeFormat"]): string {
  if (format === "24h") {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  let h = date.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(date.getMinutes()).padStart(2, "0")} ${ampm}`;
}

function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
}

// ─── Canvas Timestamp Overlay ───────────────────────────────────

export async function stampPhoto(
  file: File,
  metadata: PhotoMetadata,
  options: StampOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Build text lines
        const lines: string[] = [];

        if (metadata.dateTime) {
          let dateTimeLine = "";
          if (options.showDate) {
            dateTimeLine += formatDate(metadata.dateTime, options.dateFormat);
          }
          if (options.showTime) {
            if (dateTimeLine) dateTimeLine += "  ";
            dateTimeLine += formatTime(metadata.dateTime, options.timeFormat);
          }
          if (dateTimeLine) lines.push(dateTimeLine);
        }

        if (
          options.showLocation &&
          metadata.locationName
        ) {
          lines.push(metadata.locationName);
        }

        if (
          options.showCoordinates &&
          metadata.latitude != null &&
          metadata.longitude != null
        ) {
          lines.push(formatCoordinates(metadata.latitude, metadata.longitude));
        }

        if (lines.length === 0) {
          lines.push("No metadata available");
        }

        // Calculate font size relative to image dimensions
        const shortSide = Math.min(canvas.width, canvas.height);
        const baseFontSize =
          options.fontSize === "small"
            ? shortSide * 0.025
            : options.fontSize === "large"
              ? shortSide * 0.045
              : shortSide * 0.035;

        const fontSize = Math.max(14, Math.min(baseFontSize, 72));
        const lineHeight = fontSize * 1.4;
        const padding = fontSize * 0.8;

        ctx.font = `500 ${fontSize}px "JetBrains Mono", monospace`;
        ctx.textBaseline = "top";

        // Measure text
        const textWidths = lines.map((l) => ctx.measureText(l).width);
        const maxTextWidth = Math.max(...textWidths);
        const blockWidth = maxTextWidth + padding * 2;
        const blockHeight = lines.length * lineHeight + padding * 1.5;

        // Position
        let x: number, y: number;
        const margin = fontSize * 0.6;

        switch (options.position) {
          case "bottom-right":
            x = canvas.width - blockWidth - margin;
            y = canvas.height - blockHeight - margin;
            break;
          case "bottom-left":
            x = margin;
            y = canvas.height - blockHeight - margin;
            break;
          case "top-right":
            x = canvas.width - blockWidth - margin;
            y = margin;
            break;
          case "top-left":
            x = margin;
            y = margin;
            break;
        }

        // Draw background
        ctx.globalAlpha = options.opacity;
        ctx.fillStyle = options.backgroundColor;
        const cornerRadius = fontSize * 0.3;
        roundRect(ctx, x, y, blockWidth, blockHeight, cornerRadius);
        ctx.fill();

        // Draw text
        ctx.globalAlpha = 1;
        ctx.fillStyle = options.textColor;
        lines.forEach((line, i) => {
          ctx.fillText(line, x + padding, y + padding * 0.75 + i * lineHeight);
        });

        // Export
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) resolve(blob);
            else reject(new Error("Canvas export failed"));
          },
          "image/jpeg",
          0.92
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Bulk Download ──────────────────────────────────────────────

export async function downloadAllAsZip(
  photos: ProcessedPhoto[]
): Promise<void> {
  const JSZip = (await import("jszip")).default;
  const { saveAs } = await import("file-saver");

  const zip = new JSZip();
  const donePhotos = photos.filter(
    (p) => p.status === "done" && p.processedBlob
  );

  for (const photo of donePhotos) {
    const ext = photo.originalFile.name.replace(/.*\./, "") || "jpg";
    const baseName = photo.originalFile.name.replace(/\.[^.]+$/, "");
    zip.file(`${baseName}_timestamped.${ext}`, photo.processedBlob!);
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `timestamped_photos_${Date.now()}.zip`);
}

export function downloadSingle(photo: ProcessedPhoto): void {
  if (!photo.processedBlob) return;
  const ext = photo.originalFile.name.replace(/.*\./, "") || "jpg";
  const baseName = photo.originalFile.name.replace(/\.[^.]+$/, "");
  const url = URL.createObjectURL(photo.processedBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}_timestamped.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
