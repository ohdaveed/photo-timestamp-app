import { describe, it, expect, vi } from "vitest";
import {
  DEFAULT_STAMP_OPTIONS,
  getExportExtension,
  downloadFileName,
  ProcessedPhoto,
  StampOptions,
} from "./photoProcessor";

describe("Photo Processor - WebP Auto Conversion", () => {
  it("should default stamp options outputFormat to webp", () => {
    expect(DEFAULT_STAMP_OPTIONS.outputFormat).toBe("webp");
  });

  it("should return webp extension for image/webp MIME type", () => {
    expect(getExportExtension("image/webp")).toBe("webp");
  });

  it("should return jpg extension for image/jpeg MIME type", () => {
    expect(getExportExtension("image/jpeg")).toBe("jpg");
  });

  it("should return png extension for image/png MIME type", () => {
    expect(getExportExtension("image/png")).toBe("png");
  });

  it("should default extension to webp when mimeType is unknown or undefined", () => {
    expect(getExportExtension(undefined)).toBe("webp");
    expect(getExportExtension("unknown/format")).toBe("webp");
  });

  it("should generate filename with _timestamped.webp extension for processed WebP blob", () => {
    const mockPhoto: ProcessedPhoto = {
      id: "photo-1",
      originalFile: new File(["dummy"], "vacation.jpg", { type: "image/jpeg" }),
      originalUrl: "blob:http://localhost/123",
      processedUrl: "blob:http://localhost/456",
      processedBlob: new Blob(["stamped"], { type: "image/webp" }),
      metadata: {
        dateTime: new Date("2026-08-01T12:00:00Z"),
        latitude: null,
        longitude: null,
        locationName: null,
        cameraModel: null,
      },
      status: "done",
    };

    const fileName = downloadFileName(mockPhoto);
    expect(fileName).toBe("vacation_timestamped.webp");
  });

  it("should respect options outputFormat type setting in StampOptions", () => {
    const customOptions: StampOptions = {
      ...DEFAULT_STAMP_OPTIONS,
      outputFormat: "jpeg",
    };
    expect(customOptions.outputFormat).toBe("jpeg");
  });
});
