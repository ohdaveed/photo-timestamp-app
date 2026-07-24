/**
 * HEIC/HEIF support
 *
 * Two things break when an iPhone HEIC lands in the app:
 *
 * 1. Canvas can't draw it. Only Safari decodes HEIC natively, so everywhere else
 *    `new Image()` fails and the photo can never be stamped. `getRenderableBlob`
 *    hands back a JPEG the browser *can* decode, converting with libheif (wasm)
 *    only when the browser can't do it itself.
 * 2. exifr only recognises a HEIC container when its `ftyp` box advertises the
 *    "heic" compatible brand — plenty of HEIC/HEIF files don't, and exifr then
 *    rejects the whole file. `extractHeicExifBlock` walks the container itself
 *    and returns the raw EXIF/TIFF block, which exifr parses happily.
 *
 * Everything here stays client-side; nothing is uploaded.
 */

// ─── Format detection ────────────────────────────────────────────

const HEIC_EXTENSIONS = ["heic", "heif", "hif"];

const HEIC_MIME_TYPES = [
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
];

/** `ftyp` brands used by HEIC/HEIF images (ISO/IEC 23008-12). */
const HEIC_BRANDS = [
  "heic",
  "heix",
  "heim",
  "heis",
  "hevc",
  "hevx",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
  "mif2",
];

/** AVIF shares the `mif1` brand with HEIF but decodes natively in browsers. */
const AVIF_BRANDS = ["avif", "avis", "avio"];

/**
 * Extensions we accept on upload. Needed because Windows and some Android
 * builds report an empty `File.type` for HEIC, so a MIME check alone drops them.
 */
const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "jpe",
  "png",
  "gif",
  "webp",
  "avif",
  "bmp",
  "tif",
  "tiff",
  ...HEIC_EXTENSIONS,
];

export function getFileExtension(name: string): string {
  const match = /\.([^./\\]+)$/.exec(name);
  return match ? match[1].toLowerCase() : "";
}

/** True when a dropped/selected file is worth trying to process as an image. */
export function isSupportedImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.includes(getFileExtension(file.name));
}

/** Name/MIME-based guess, used as a fallback when the header can't be read. */
function looksLikeHeic(file: File): boolean {
  return (
    HEIC_MIME_TYPES.includes(file.type.toLowerCase()) ||
    HEIC_EXTENSIONS.includes(getFileExtension(file.name))
  );
}

/** Reads a fixed-length ASCII field (box kinds, brands, TIFF magic). */
function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let out = "";
  const end = Math.min(offset + length, bytes.length);
  for (let i = offset; i < end; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

/** Reads the major + compatible brands out of the leading `ftyp` box. */
async function readBrands(file: Blob): Promise<string[]> {
  const header = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  if (header.length < 12 || ascii(header, 4, 4) !== "ftyp") return [];

  const boxLength = new DataView(
    header.buffer,
    header.byteOffset,
    header.byteLength
  ).getUint32(0);
  const end = Math.min(boxLength, header.length);

  const brands = [ascii(header, 8, 4).trim()];
  for (let offset = 16; offset + 4 <= end; offset += 4) {
    brands.push(ascii(header, offset, 4).trim());
  }
  return brands;
}

/** True for HEIC/HEIF images, sniffed from the container header. */
export async function isHeicImage(file: File): Promise<boolean> {
  try {
    const brands = await readBrands(file);
    if (brands.length === 0) return looksLikeHeic(file);
    if (brands.some(brand => AVIF_BRANDS.includes(brand))) return false;
    return brands.some(brand => HEIC_BRANDS.includes(brand));
  } catch {
    return looksLikeHeic(file);
  }
}

// ─── Decoding to something canvas understands ───────────────────

/** Quality of the intermediate JPEG we decode HEIC into before stamping. */
const CONVERSION_QUALITY = 0.95;

/** Conversion is slow, so results are reused across re-stamps of the same file. */
const renderableCache = new WeakMap<File, Blob>();

let nativeHeicDecoding: boolean | null = null;

/** Safari decodes HEIC itself — no point paying for the wasm decoder there. */
async function canDecodeHeicNatively(file: Blob): Promise<boolean> {
  if (nativeHeicDecoding !== null) return nativeHeicDecoding;
  if (typeof createImageBitmap !== "function") {
    nativeHeicDecoding = false;
    return false;
  }
  try {
    const bitmap = await createImageBitmap(file);
    bitmap.close?.();
    nativeHeicDecoding = true;
  } catch {
    nativeHeicDecoding = false;
  }
  return nativeHeicDecoding;
}

async function convertHeicToJpeg(file: File): Promise<Blob> {
  try {
    // Loaded on demand: the libheif decoder is several megabytes.
    const { heicTo } = await import("heic-to");
    return await heicTo({
      blob: file,
      type: "image/jpeg",
      quality: CONVERSION_QUALITY,
    });
  } catch {
    throw new Error("Could not decode this HEIC image");
  }
}

/**
 * Returns a blob the browser can draw onto a canvas — the original file for
 * ordinary formats, a decoded JPEG for HEIC the browser can't read itself.
 */
export async function getRenderableBlob(file: File): Promise<Blob> {
  const cached = renderableCache.get(file);
  if (cached) return cached;

  if (!(await isHeicImage(file))) return file;
  if (await canDecodeHeicNatively(file)) {
    renderableCache.set(file, file);
    return file;
  }

  const converted = await convertHeicToJpeg(file);
  renderableCache.set(file, converted);
  return converted;
}

// ─── EXIF extraction from the HEIF container ────────────────────

const TIFF_MAGIC = ["II*\0", "MM\0*"];

interface Box {
  kind: string;
  /** First byte of the box payload. */
  contentStart: number;
  /** First byte after the box. */
  end: number;
}

function readBoxes(bytes: Uint8Array, start: number, end: number): Box[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const boxes: Box[] = [];

  let offset = start;
  while (offset + 8 <= end) {
    let size = view.getUint32(offset);
    let contentStart = offset + 8;

    if (size === 1) {
      // 64-bit size; the high word is irrelevant for files we can hold in memory.
      if (offset + 16 > end) break;
      size = view.getUint32(offset + 8) * 2 ** 32 + view.getUint32(offset + 12);
      contentStart = offset + 16;
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < contentStart - offset) break;

    boxes.push({
      kind: ascii(bytes, offset + 4, 4),
      contentStart,
      end: Math.min(offset + size, end),
    });
    offset += size;
  }

  return boxes;
}

const findBox = (boxes: Box[], kind: string): Box | undefined =>
  boxes.find(box => box.kind === kind);

/** Version/flags header of a FullBox; returns the offset of its payload. */
function readFullBoxHead(
  view: DataView,
  box: Box
): { version: number; contentStart: number } {
  return {
    version: view.getUint8(box.contentStart),
    contentStart: box.contentStart + 4,
  };
}

/** Item ID of the `Exif` item, per the `iinf` item list. */
function findExifItemId(bytes: Uint8Array, iinf: Box): number | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const { version, contentStart } = readFullBoxHead(view, iinf);
  const listStart = version === 0 ? contentStart + 2 : contentStart + 4; // entry_count

  for (const entry of readBoxes(bytes, listStart, iinf.end)) {
    if (entry.kind !== "infe") continue;
    const head = readFullBoxHead(view, entry);
    // item_type only exists from version 2 onwards.
    if (head.version < 2) continue;
    const idSize = head.version === 3 ? 4 : 2;
    const itemType = ascii(bytes, head.contentStart + idSize + 2, 4);
    if (itemType !== "Exif") continue;
    return idSize === 4
      ? view.getUint32(head.contentStart)
      : view.getUint16(head.contentStart);
  }
  return null;
}

/** Byte range of an item, per the `iloc` item location table. */
function findItemExtent(
  bytes: Uint8Array,
  iloc: Box,
  itemId: number
): { offset: number; length: number; constructionMethod: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const { version, contentStart } = readFullBoxHead(view, iloc);

  let offset = contentStart;
  const sizes = view.getUint8(offset++);
  const offsetSize = sizes >> 4;
  const lengthSize = sizes & 0x0f;
  const bases = view.getUint8(offset++);
  const baseOffsetSize = bases >> 4;
  const indexSize = version === 1 || version === 2 ? bases & 0x0f : 0;

  const readUint = (at: number, size: number): number => {
    switch (size) {
      case 0:
        return 0;
      case 4:
        return view.getUint32(at);
      case 8:
        return view.getUint32(at) * 2 ** 32 + view.getUint32(at + 4);
      default:
        return view.getUint16(at);
    }
  };

  const idSize = version === 2 ? 4 : 2;
  let itemCount = readUint(offset, idSize);
  offset += idSize;

  while (itemCount-- > 0 && offset < iloc.end) {
    const id = readUint(offset, idSize);
    offset += idSize;

    let constructionMethod = 0;
    if (version === 1 || version === 2) {
      constructionMethod = view.getUint16(offset) & 0x0f;
      offset += 2;
    }
    offset += 2; // data_reference_index
    const baseOffset = readUint(offset, baseOffsetSize);
    offset += baseOffsetSize;

    let extentCount = view.getUint16(offset);
    offset += 2;

    while (extentCount-- > 0) {
      offset += indexSize;
      const extentOffset = readUint(offset, offsetSize);
      offset += offsetSize;
      const extentLength = readUint(offset, lengthSize);
      offset += lengthSize;

      if (id === itemId) {
        return {
          offset: baseOffset + extentOffset,
          length: extentLength,
          constructionMethod,
        };
      }
    }
  }
  return null;
}

/** Strips the `exif_tiff_header_offset` preamble ahead of the TIFF header. */
function sliceTiffBlock(payload: Uint8Array): Uint8Array | null {
  if (payload.length < 8) return null;

  const view = new DataView(
    payload.buffer,
    payload.byteOffset,
    payload.byteLength
  );
  const declared = 4 + view.getUint32(0);
  if (
    declared < payload.length &&
    TIFF_MAGIC.includes(ascii(payload, declared, 4))
  ) {
    return payload.subarray(declared);
  }

  // Some encoders write a different preamble; look for the TIFF header instead.
  const limit = Math.min(payload.length - 4, 64);
  for (let offset = 0; offset <= limit; offset++) {
    if (TIFF_MAGIC.includes(ascii(payload, offset, 4))) {
      return payload.subarray(offset);
    }
  }
  return null;
}

/**
 * Pulls the raw EXIF/TIFF block out of a HEIC/HEIF file so it can be parsed
 * even when the container itself isn't recognised. Returns null when the file
 * carries no EXIF item.
 */
export async function extractHeicExifBlock(
  file: Blob
): Promise<Uint8Array | null> {
  try {
    // The metadata box sits at the front; read enough to cover it, then extend
    // the read if the box turns out to be bigger than the first slice.
    let bytes = new Uint8Array(await file.slice(0, 65536).arrayBuffer());
    let meta = findBox(readBoxes(bytes, 0, bytes.length), "meta");
    if (meta && meta.end >= bytes.length && bytes.length < file.size) {
      bytes = new Uint8Array(
        await file.slice(0, Math.min(meta.end + 1024, file.size)).arrayBuffer()
      );
      meta = findBox(readBoxes(bytes, 0, bytes.length), "meta");
    }
    if (!meta) return null;

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const metaHead = readFullBoxHead(view, meta);
    const metaBoxes = readBoxes(bytes, metaHead.contentStart, meta.end);

    const iinf = findBox(metaBoxes, "iinf");
    const iloc = findBox(metaBoxes, "iloc");
    if (!iinf || !iloc) return null;

    const itemId = findExifItemId(bytes, iinf);
    if (itemId === null) return null;

    const extent = findItemExtent(bytes, iloc, itemId);
    if (!extent || extent.length === 0) return null;

    // construction_method 1 locates the item inside the `idat` box of `meta`.
    let start = extent.offset;
    if (extent.constructionMethod === 1) {
      const idat = findBox(metaBoxes, "idat");
      if (!idat) return null;
      start += idat.contentStart;
    }

    const payload = new Uint8Array(
      await file.slice(start, start + extent.length).arrayBuffer()
    );
    return sliceTiffBlock(payload);
  } catch {
    return null;
  }
}
