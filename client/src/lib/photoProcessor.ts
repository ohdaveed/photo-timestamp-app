/**
 * Photo Processor — "Precision Lens" design
 * 
 * Reads EXIF metadata (date/time, GPS) from photos,
 * reverse-geocodes GPS coordinates via OpenStreetMap Nominatim,
 * and overlays a formatted timestamp + location on each image
 * using the HTML Canvas API. Everything runs client-side.
 *
 * HEIC/HEIF photos take a detour on the way in and out — see ./heicSupport.
 */

import exifr from "exifr";
import {
  extractHeicExifBlock,
  getRenderableBlob,
  isHeicImage,
} from "./heicSupport";

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
  status:
    | "pending"
    | "converting"
    | "reading"
    | "geocoding"
    | "stamping"
    | "done"
    | "error";
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

const EXIF_TAGS = [
  "DateTimeOriginal",
  "CreateDate",
  "ModifyDate",
  "GPSLatitude",
  "GPSLatitudeRef",
  "GPSLongitude",
  "GPSLongitudeRef",
  "Make",
  "Model",
  "latitude",
  "longitude",
];

const EMPTY_METADATA: PhotoMetadata = {
  dateTime: null,
  latitude: null,
  longitude: null,
  locationName: null,
  cameraModel: null,
};

/** Anything exifr hands back that we can actually stamp onto a photo. */
function hasUsableExif(exif: Record<string, unknown> | null): boolean {
  if (!exif) return false;
  return Boolean(
    exif.DateTimeOriginal ||
      exif.CreateDate ||
      exif.ModifyDate ||
      exif.latitude != null
  );
}

async function parseExif(
  input: File | Uint8Array
): Promise<Record<string, unknown> | null> {
  try {
    return (await exifr.parse(input, { gps: true, pick: EXIF_TAGS })) ?? null;
  } catch {
    return null;
  }
}

export async function readExifData(file: File): Promise<PhotoMetadata> {
  let exif = await parseExif(file);

  // exifr only accepts a HEIC container that advertises the "heic" compatible
  // brand, so for the rest we locate the EXIF block ourselves and parse that.
  if (!hasUsableExif(exif) && (await isHeicImage(file))) {
    const exifBlock = await extractHeicExifBlock(file);
    if (exifBlock) {
      const fromBlock = await parseExif(exifBlock);
      if (hasUsableExif(fromBlock)) exif = fromBlock;
    }
  }

  if (!exif) {
    return { ...EMPTY_METADATA };
  }

  const dateTime =
    exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate || null;
  const latitude = (exif.latitude as number | undefined) ?? null;
  const longitude = (exif.longitude as number | undefined) ?? null;
  const cameraModel = exif.Model
    ? `${exif.Make ? exif.Make + " " : ""}${exif.Model}`
    : null;

  return {
    dateTime:
      dateTime instanceof Date
        ? dateTime
        : dateTime
          ? new Date(dateTime as string)
          : null,
    latitude,
    longitude,
    locationName: null,
    cameraModel,
  };
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

/** The format every stamped photo is exported as. */
const OUTPUT_MIME_TYPE = "image/jpeg";
const OUTPUT_QUALITY = 0.92;

export async function stampPhoto(
  file: File,
  metadata: PhotoMetadata,
  options: StampOptions
): Promise<Blob> {
  // HEIC can't be drawn onto a canvas directly, so draw a decoded copy instead.
  const source = await getRenderableBlob(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(source);

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
          OUTPUT_MIME_TYPE,
          OUTPUT_QUALITY
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

/**
 * Stamped photos are always exported as JPEG, so the download keeps the
 * original name but takes its extension from the exported blob — a HEIC input
 * must not come back as a ".heic" file that no viewer can open.
 */
function downloadFileName(photo: ProcessedPhoto): string {
  const baseName = photo.originalFile.name.replace(/\.[^.]+$/, "") || "photo";
  const ext = photo.processedBlob?.type === "image/png" ? "png" : "jpg";
  return `${baseName}_timestamped.${ext}`;
}

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
    zip.file(downloadFileName(photo), photo.processedBlob!);
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `timestamped_photos_${Date.now()}.zip`);
}

export function downloadSingle(photo: ProcessedPhoto): void {
  if (!photo.processedBlob) return;
  const url = URL.createObjectURL(photo.processedBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = downloadFileName(photo);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
