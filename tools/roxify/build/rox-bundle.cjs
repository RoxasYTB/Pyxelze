#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/roxify/dist/cli.js
var import_fs4 = require("fs");
var import_promises2 = require("fs/promises");
var import_path4 = require("path");

// node_modules/roxify/dist/utils/constants.js
var CHUNK_TYPE = "rXDT";
var MAGIC = Buffer.from("ROX1");
var PIXEL_MAGIC = Buffer.from("PXL1");
var PIXEL_MAGIC_BLOCK = Buffer.from("BLK2");
var ENC_NONE = 0;
var ENC_AES = 1;
var ENC_XOR = 2;
var FILTER_ZERO = Buffer.from([0]);
var PNG_HEADER = Buffer.from([
  137,
  80,
  78,
  71,
  13,
  10,
  26,
  10
]);
var PNG_HEADER_HEX = PNG_HEADER.toString("hex");
var MARKER_COLORS = [
  { r: 255, g: 0, b: 0 },
  { r: 0, g: 255, b: 0 },
  { r: 0, g: 0, b: 255 }
];
var MARKER_START = MARKER_COLORS;
var MARKER_END = [...MARKER_COLORS].reverse();
var COMPRESSION_MARKERS = {
  zstd: [{ r: 0, g: 255, b: 0 }],
  lzma: [{ r: 255, g: 255, b: 0 }]
};

// node_modules/roxify/dist/utils/crc.js
var CRC_TABLE = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 3988292384 ^ c >>> 1;
    } else {
      c = c >>> 1;
    }
  }
  CRC_TABLE[n] = c;
}
function crc32(buf, previous = 0) {
  let crc = previous ^ 4294967295;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 255] ^ crc >>> 8;
  }
  return (crc ^ 4294967295) >>> 0;
}

// node_modules/roxify/dist/utils/decoder.js
var import_fs2 = require("fs");

// node_modules/roxify/dist/pack.js
var import_fs = require("fs");
var import_promises = require("fs/promises");
var import_path = require("path");
function* collectFilesGenerator(paths) {
  for (const p of paths) {
    const abs = (0, import_path.resolve)(p);
    const st = (0, import_fs.statSync)(abs);
    if (st.isFile()) {
      yield abs;
    } else if (st.isDirectory()) {
      const names = (0, import_fs.readdirSync)(abs);
      const childPaths = names.map((n) => (0, import_path.join)(abs, n));
      yield* collectFilesGenerator(childPaths);
    }
  }
}
function unpackBuffer(buf, fileList) {
  if (buf.length < 8)
    return null;
  const magic = buf.readUInt32BE(0);
  if (magic === 1380931657) {
    const indexLen = buf.readUInt32BE(4);
    const indexBuf = buf.slice(8, 8 + indexLen);
    const index = JSON.parse(indexBuf.toString("utf8"));
    const dataStart = 8 + indexLen;
    const files2 = [];
    const entriesToProcess = fileList ? index.filter((e) => fileList.includes(e.path)) : index;
    for (const entry of entriesToProcess) {
      const entryStart = dataStart + entry.offset;
      let ptr = entryStart;
      if (ptr + 2 > buf.length)
        continue;
      const nameLen = buf.readUInt16BE(ptr);
      ptr += 2;
      ptr += nameLen;
      ptr += 8;
      if (ptr + entry.size > buf.length)
        continue;
      const content = buf.slice(ptr, ptr + entry.size);
      files2.push({ path: entry.path, buf: content });
    }
    return { files: files2 };
  }
  if (magic !== 1380931664)
    return null;
  const header = buf.slice(0, 8);
  const fileCount = header.readUInt32BE(4);
  let offset = 8;
  const files = [];
  for (let i = 0; i < fileCount; i++) {
    if (offset + 2 > buf.length)
      return null;
    const nameLen = buf.readUInt16BE(offset);
    offset += 2;
    if (offset + nameLen > buf.length)
      return null;
    const name = buf.slice(offset, offset + nameLen).toString("utf8");
    offset += nameLen;
    if (offset + 8 > buf.length)
      return null;
    const size = buf.readBigUInt64BE(offset);
    offset += 8;
    if (offset + Number(size) > buf.length)
      return null;
    const content = buf.slice(offset, offset + Number(size));
    offset += Number(size);
    files.push({ path: name, buf: content });
  }
  if (fileList) {
    const filtered = files.filter((f) => fileList.includes(f.path));
    return { files: filtered };
  }
  return { files };
}
async function packPathsGenerator(paths, baseDir, onProgress) {
  const files = [];
  for (const f of collectFilesGenerator(paths)) {
    files.push(f);
  }
  files.sort((a, b) => {
    const extA = (0, import_path.extname)(a);
    const extB = (0, import_path.extname)(b);
    if (extA !== extB)
      return extA.localeCompare(extB);
    return a.localeCompare(b);
  });
  const base = baseDir ? (0, import_path.resolve)(baseDir) : process.cwd();
  const BLOCK_SIZE = 8 * 1024 * 1024;
  const index = [];
  let currentBlockId = 0;
  let currentBlockSize = 0;
  let globalDataOffset = 0;
  let totalSize = 0;
  for (const f of files) {
    const st = (0, import_fs.statSync)(f);
    const rel = (0, import_path.relative)(base, f).split(import_path.sep).join("/");
    const nameBuf = Buffer.from(rel, "utf8");
    const entrySize = 2 + nameBuf.length + 8 + st.size;
    if (currentBlockSize + entrySize > BLOCK_SIZE && currentBlockSize > 0) {
      currentBlockId++;
      currentBlockSize = 0;
    }
    index.push({
      path: rel,
      blockId: currentBlockId,
      offset: globalDataOffset,
      size: st.size
    });
    currentBlockSize += entrySize;
    globalDataOffset += entrySize;
    totalSize += st.size;
  }
  async function* streamGenerator() {
    const indexBuf = Buffer.from(JSON.stringify(index), "utf8");
    const indexHeader = Buffer.alloc(8);
    indexHeader.writeUInt32BE(1380931657, 0);
    indexHeader.writeUInt32BE(indexBuf.length, 4);
    yield Buffer.concat([indexHeader, indexBuf]);
    let readSoFar = 0;
    const BATCH_SIZE = 1e3;
    const chunks = [];
    let chunkSize = 0;
    for (let batchStart = 0; batchStart < files.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, files.length);
      const batchFiles = files.slice(batchStart, batchEnd);
      const contentPromises = batchFiles.map(async (f) => {
        try {
          return await (0, import_promises.readFile)(f);
        } catch (e) {
          return Buffer.alloc(0);
        }
      });
      const contents = await Promise.all(contentPromises);
      for (let i = 0; i < batchFiles.length; i++) {
        const f = batchFiles[i];
        const rel = (0, import_path.relative)(base, f).split(import_path.sep).join("/");
        const content = contents[i];
        const nameBuf = Buffer.from(rel, "utf8");
        const nameLen = Buffer.alloc(2);
        nameLen.writeUInt16BE(nameBuf.length, 0);
        const sizeBuf = Buffer.alloc(8);
        sizeBuf.writeBigUInt64BE(BigInt(content.length), 0);
        const entry = Buffer.concat([nameLen, nameBuf, sizeBuf, content]);
        chunks.push(entry);
        chunkSize += entry.length;
        if (chunkSize >= BLOCK_SIZE) {
          yield Buffer.concat(chunks);
          chunks.length = 0;
          chunkSize = 0;
        }
        readSoFar += content.length;
        if (onProgress)
          onProgress(readSoFar, totalSize, rel);
      }
    }
    if (chunks.length > 0) {
      yield Buffer.concat(chunks);
    }
  }
  return { index, stream: streamGenerator(), totalSize };
}

// node_modules/roxify/dist/utils/errors.js
var PassphraseRequiredError = class extends Error {
  constructor(message = "Passphrase required") {
    super(message);
    this.name = "PassphraseRequiredError";
  }
};
var IncorrectPassphraseError = class extends Error {
  constructor(message = "Incorrect passphrase") {
    super(message);
    this.name = "IncorrectPassphraseError";
  }
};
var DataFormatError = class extends Error {
  constructor(message = "Data format error") {
    super(message);
    this.name = "DataFormatError";
  }
};

// node_modules/roxify/dist/utils/helpers.js
var import_crypto = require("crypto");

// node_modules/roxify/dist/utils/native.js
var import_module = require("module");
var import_path2 = require("path");
var import_url = require("url");
var __filename = __filename;
var __dirname = __dirname;
var require2 = require;
var native = require((0, import_path2.join)(__dirname, "../node_modules/roxify/libroxify_native.node"));

// node_modules/roxify/dist/utils/helpers.js
var nativeDeltaEncode = null;
var nativeDeltaDecode = null;
var hasNative = false;
try {
  if (native?.nativeDeltaEncode && native?.nativeDeltaDecode) {
    nativeDeltaEncode = native.nativeDeltaEncode;
    nativeDeltaDecode = native.nativeDeltaDecode;
    hasNative = true;
  }
} catch (e) {
}
function colorsToBytes(colors) {
  const buf = Buffer.alloc(colors.length * 3);
  for (let i = 0; i < colors.length; i++) {
    buf[i * 3] = colors[i].r;
    buf[i * 3 + 1] = colors[i].g;
    buf[i * 3 + 2] = colors[i].b;
  }
  return buf;
}
function deltaDecodeTS(data) {
  if (data.length === 0)
    return data;
  const out = Buffer.alloc(data.length);
  out[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    out[i] = out[i - 1] + data[i] & 255;
  }
  return out;
}
function deltaDecode(data) {
  if (hasNative && nativeDeltaDecode) {
    try {
      return Buffer.from(nativeDeltaDecode(data));
    } catch (e) {
      console.warn("Native deltaDecode failed, falling back to TS:", e);
    }
  }
  return deltaDecodeTS(data);
}
function applyXor(buf, passphrase) {
  const key = Buffer.from(passphrase, "utf8");
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ key[i % key.length];
  }
  return out;
}
function tryDecryptIfNeeded(buf, passphrase) {
  if (!buf || buf.length === 0)
    return buf;
  const flag = buf[0];
  if (flag === ENC_AES) {
    const MIN_AES_LEN = 1 + 16 + 12 + 16 + 1;
    if (buf.length < MIN_AES_LEN)
      throw new IncorrectPassphraseError();
    if (!passphrase)
      throw new PassphraseRequiredError();
    const salt = buf.slice(1, 17);
    const iv = buf.slice(17, 29);
    const tag = buf.slice(29, 45);
    const enc = buf.slice(45);
    const PBKDF2_ITERS = 1e6;
    const key = (0, import_crypto.pbkdf2Sync)(passphrase, salt, PBKDF2_ITERS, 32, "sha256");
    const dec = (0, import_crypto.createDecipheriv)("aes-256-gcm", key, iv);
    dec.setAuthTag(tag);
    try {
      const decrypted = Buffer.concat([dec.update(enc), dec.final()]);
      return decrypted;
    } catch (e) {
      throw new IncorrectPassphraseError();
    }
  }
  if (flag === ENC_XOR) {
    if (!passphrase)
      throw new PassphraseRequiredError();
    return applyXor(buf.slice(1), passphrase);
  }
  if (flag === ENC_NONE) {
    return buf.slice(1);
  }
  return buf;
}

// node_modules/roxify/dist/utils/reconstitution.js
async function cropAndReconstitute(input, debugDir) {
  return input;
}

// node_modules/roxify/dist/utils/zstd.js
var nativeZstdCompress = null;
var nativeZstdDecompress = null;
try {
  if (native?.nativeZstdCompress) {
    nativeZstdCompress = native.nativeZstdCompress;
  }
  if (native?.nativeZstdDecompress) {
    nativeZstdDecompress = native.nativeZstdDecompress;
  }
} catch (e) {
}
async function parallelZstdCompress(payload, level = 19, onProgress) {
  const chunkSize = 8 * 1024 * 1024;
  const chunks = [];
  if (Array.isArray(payload)) {
    for (const p of payload) {
      if (p.length <= chunkSize) {
        chunks.push(p);
      } else {
        for (let i = 0; i < p.length; i += chunkSize) {
          chunks.push(p.subarray(i, Math.min(i + chunkSize, p.length)));
        }
      }
    }
  } else {
    if (payload.length <= chunkSize) {
      if (onProgress)
        onProgress(0, 1);
      if (!nativeZstdCompress) {
        throw new Error("Native zstd compression not available");
      }
      const result = Buffer.from(nativeZstdCompress(payload, level));
      if (onProgress)
        onProgress(1, 1);
      return [result];
    }
    for (let i = 0; i < payload.length; i += chunkSize) {
      chunks.push(payload.subarray(i, Math.min(i + chunkSize, payload.length)));
    }
  }
  const totalChunks = chunks.length;
  const compressedChunks = [];
  if (!nativeZstdCompress) {
    throw new Error("Native zstd compression not available");
  }
  for (let i = 0; i < totalChunks; i++) {
    const compressed = Buffer.from(nativeZstdCompress(chunks[i], level));
    compressedChunks.push(compressed);
    if (onProgress)
      onProgress(i + 1, totalChunks);
  }
  const chunkSizes = Buffer.alloc(compressedChunks.length * 4);
  for (let i = 0; i < compressedChunks.length; i++) {
    chunkSizes.writeUInt32BE(compressedChunks[i].length, i * 4);
  }
  const header = Buffer.alloc(8);
  header.writeUInt32BE(1515410500, 0);
  header.writeUInt32BE(compressedChunks.length, 4);
  return [header, chunkSizes, ...compressedChunks];
}
async function parallelZstdDecompress(payload, onProgress) {
  if (payload.length < 8) {
    onProgress?.({ phase: "decompress_start", total: 1 });
    if (!nativeZstdDecompress) {
      throw new Error("Native zstd decompression not available");
    }
    const d = Buffer.from(nativeZstdDecompress(payload));
    onProgress?.({ phase: "decompress_progress", loaded: 1, total: 1 });
    onProgress?.({ phase: "decompress_done", loaded: 1, total: 1 });
    return d;
  }
  const magic = payload.readUInt32BE(0);
  if (magic !== 1515410500) {
    if (process.env.ROX_DEBUG)
      console.log("tryZstdDecompress: invalid magic");
    onProgress?.({ phase: "decompress_start", total: 1 });
    if (!nativeZstdDecompress) {
      throw new Error("Native zstd decompression not available");
    }
    const d = Buffer.from(nativeZstdDecompress(payload));
    onProgress?.({ phase: "decompress_progress", loaded: 1, total: 1 });
    onProgress?.({ phase: "decompress_done", loaded: 1, total: 1 });
    return d;
  }
  const numChunks = payload.readUInt32BE(4);
  const chunkSizes = [];
  let offset = 8;
  for (let i = 0; i < numChunks; i++) {
    chunkSizes.push(payload.readUInt32BE(offset));
    offset += 4;
  }
  onProgress?.({ phase: "decompress_start", total: numChunks });
  const decompressedChunks = [];
  for (let i = 0; i < numChunks; i++) {
    const size = chunkSizes[i];
    const chunk = payload.slice(offset, offset + size);
    offset += size;
    if (!nativeZstdDecompress) {
      throw new Error("Native zstd decompression not available");
    }
    const dec = Buffer.from(nativeZstdDecompress(chunk));
    decompressedChunks.push(dec);
    onProgress?.({
      phase: "decompress_progress",
      loaded: i + 1,
      total: numChunks
    });
  }
  onProgress?.({
    phase: "decompress_done",
    loaded: numChunks,
    total: numChunks
  });
  return Buffer.concat(decompressedChunks);
}
async function tryZstdDecompress(payload, onProgress) {
  return await parallelZstdDecompress(payload, onProgress);
}

// node_modules/roxify/dist/utils/decoder.js
async function tryDecompress(payload, onProgress) {
  try {
    return await parallelZstdDecompress(payload, onProgress);
  } catch (e) {
    try {
      const mod = await import("lzma-purejs");
      const decompressFn = mod && (mod.decompress || mod.LZMA && mod.LZMA.decompress);
      if (!decompressFn)
        throw new Error("No lzma decompress");
      const dec = await new Promise((resolve3, reject) => {
        try {
          decompressFn(Buffer.from(payload), (out) => resolve3(out));
        } catch (err) {
          reject(err);
        }
      });
      const dBuf = Buffer.isBuffer(dec) ? dec : Buffer.from(dec);
      return dBuf;
    } catch (e3) {
      throw e;
    }
  }
}
async function decodePngToBinary(input, opts = {}) {
  let pngBuf;
  if (Buffer.isBuffer(input)) {
    pngBuf = input;
  } else {
    try {
      if (native?.sharpMetadata) {
        const inputBuf = (0, import_fs2.readFileSync)(input);
        const metadata = native.sharpMetadata(inputBuf);
        const rawBytesEstimate = metadata.width * metadata.height * 4;
        const MAX_RAW_BYTES = 200 * 1024 * 1024;
        if (rawBytesEstimate > MAX_RAW_BYTES) {
          pngBuf = inputBuf;
        } else {
          pngBuf = inputBuf;
        }
      } else {
        pngBuf = (0, import_fs2.readFileSync)(input);
      }
    } catch (e) {
      try {
        pngBuf = (0, import_fs2.readFileSync)(input);
      } catch (e2) {
        throw e;
      }
    }
  }
  let progressBar = null;
  if (opts.showProgress) {
    progressBar = {
      start: () => {
      },
      update: () => {
      },
      stop: () => {
      }
    };
    const startTime = Date.now();
    if (!opts.onProgress) {
      opts.onProgress = (info) => {
        let pct = 0;
        if (info.phase === "start") {
          pct = 10;
        } else if (info.phase === "decompress") {
          pct = 50;
        } else if (info.phase === "done") {
          pct = 100;
        }
      };
    }
  }
  if (opts.onProgress)
    opts.onProgress({ phase: "start" });
  let processedBuf = pngBuf;
  try {
    if (native?.sharpMetadata) {
      const info = native.sharpMetadata(pngBuf);
      if (info.width && info.height) {
        const MAX_RAW_BYTES = 1200 * 1024 * 1024;
        const rawBytesEstimate = info.width * info.height * 4;
        if (rawBytesEstimate > MAX_RAW_BYTES) {
          throw new DataFormatError(`Image too large to decode in-process (${Math.round(rawBytesEstimate / 1024 / 1024)} MB). Increase Node heap or use a smaller image/compact mode.`);
        }
      }
    }
    processedBuf = pngBuf;
  } catch (e) {
    if (e instanceof DataFormatError)
      throw e;
  }
  if (opts.onProgress)
    opts.onProgress({ phase: "processed" });
  if (processedBuf.subarray(0, MAGIC.length).equals(MAGIC)) {
    const d = processedBuf.subarray(MAGIC.length);
    const nameLen = d[0];
    let idx = 1;
    let name;
    if (nameLen > 0) {
      name = d.subarray(idx, idx + nameLen).toString("utf8");
      idx += nameLen;
    }
    const rawPayload = d.subarray(idx);
    let payload = tryDecryptIfNeeded(rawPayload, opts.passphrase);
    if (opts.onProgress)
      opts.onProgress({ phase: "decompress_start" });
    try {
      payload = await tryDecompress(payload, (info) => {
        if (opts.onProgress)
          opts.onProgress(info);
      });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (opts.passphrase)
        throw new IncorrectPassphraseError("Incorrect passphrase (compact mode, zstd failed: " + errMsg + ")");
      throw new DataFormatError("Compact mode zstd decompression failed: " + errMsg);
    }
    if (!payload.subarray(0, MAGIC.length).equals(MAGIC)) {
      throw new Error("Invalid ROX format (ROX direct: missing ROX1 magic after decompression)");
    }
    payload = payload.subarray(MAGIC.length);
    if (opts.onProgress)
      opts.onProgress({ phase: "done" });
    progressBar?.stop();
    return { buf: payload, meta: { name } };
  }
  let chunks = [];
  try {
    if (native?.extractPngChunks) {
      const chunksRaw = native.extractPngChunks(processedBuf);
      chunks = chunksRaw.map((c) => ({
        name: c.name,
        data: Buffer.from(c.data)
      }));
    } else {
      throw new Error("Native PNG chunk extraction not available");
    }
  } catch (e) {
    try {
      const withHeader = Buffer.concat([PNG_HEADER, pngBuf]);
      if (native?.extractPngChunks) {
        const chunksRaw = native.extractPngChunks(withHeader);
        chunks = chunksRaw.map((c) => ({
          name: c.name,
          data: Buffer.from(c.data)
        }));
      } else {
        throw new Error("Native PNG chunk extraction not available");
      }
    } catch (e2) {
      chunks = [];
    }
  }
  const target = chunks.find((c) => c.name === CHUNK_TYPE);
  if (target) {
    const d = target.data;
    const nameLen = d[0];
    let idx = 1;
    let name;
    if (nameLen > 0) {
      name = d.slice(idx, idx + nameLen).toString("utf8");
      idx += nameLen;
    }
    const rawPayload = d.slice(idx);
    if (rawPayload.length === 0)
      throw new DataFormatError("Compact mode payload empty");
    let payload = tryDecryptIfNeeded(rawPayload, opts.passphrase);
    if (opts.onProgress)
      opts.onProgress({ phase: "decompress_start" });
    try {
      payload = await tryZstdDecompress(payload, (info) => {
        if (opts.onProgress)
          opts.onProgress(info);
      });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (opts.passphrase)
        throw new IncorrectPassphraseError("Incorrect passphrase (compact mode, zstd failed: " + errMsg + ")");
      throw new DataFormatError("Compact mode zstd decompression failed: " + errMsg);
    }
    if (!payload.slice(0, MAGIC.length).equals(MAGIC)) {
      throw new DataFormatError("Invalid ROX format (compact mode: missing ROX1 magic after decompression)");
    }
    payload = payload.slice(MAGIC.length);
    if (opts.files) {
      const unpacked = unpackBuffer(payload, opts.files);
      if (unpacked) {
        if (opts.onProgress)
          opts.onProgress({ phase: "done" });
        progressBar?.stop();
        return { files: unpacked.files, meta: { name } };
      }
    }
    if (opts.onProgress)
      opts.onProgress({ phase: "done" });
    progressBar?.stop();
    return { buf: payload, meta: { name } };
  }
  try {
    const metadata = native.sharpMetadata(processedBuf);
    const currentWidth = metadata.width;
    const currentHeight = metadata.height;
    let rawRGB = Buffer.alloc(0);
    let isBlockEncoded = false;
    if (currentWidth % 2 === 0 && currentHeight % 2 === 0) {
      const rawData = native.sharpToRaw(processedBuf);
      const testData = rawData.pixels;
      let hasBlockPattern = true;
      for (let y = 0; y < Math.min(2, currentHeight / 2); y++) {
        for (let x = 0; x < Math.min(2, currentWidth / 2); x++) {
          const px00 = (y * 2 * currentWidth + x * 2) * 3;
          const px01 = (y * 2 * currentWidth + (x * 2 + 1)) * 3;
          const px10 = ((y * 2 + 1) * currentWidth + x * 2) * 3;
          const px11 = ((y * 2 + 1) * currentWidth + (x * 2 + 1)) * 3;
          if (testData[px00] !== testData[px01] || testData[px00] !== testData[px10] || testData[px00] !== testData[px11] || testData[px00 + 1] !== testData[px01 + 1] || testData[px00 + 1] !== testData[px10 + 1] || testData[px00 + 1] !== testData[px11 + 1]) {
            hasBlockPattern = false;
            break;
          }
        }
        if (!hasBlockPattern)
          break;
      }
      if (hasBlockPattern) {
        isBlockEncoded = true;
        const blocksWide = currentWidth / 2;
        const blocksHigh = currentHeight / 2;
        rawRGB = Buffer.alloc(blocksWide * blocksHigh * 3);
        const fullRaw = native.sharpToRaw(processedBuf);
        const fullData = fullRaw.pixels;
        let outIdx = 0;
        for (let by = 0; by < blocksHigh; by++) {
          for (let bx = 0; bx < blocksWide; bx++) {
            const pixelOffset = (by * 2 * currentWidth + bx * 2) * 3;
            rawRGB[outIdx++] = fullData[pixelOffset];
            rawRGB[outIdx++] = fullData[pixelOffset + 1];
            rawRGB[outIdx++] = fullData[pixelOffset + 2];
          }
        }
      }
    }
    if (!isBlockEncoded) {
      const rawData = native.sharpToRaw(processedBuf);
      rawRGB = Buffer.from(rawData.pixels);
      if (opts.onProgress) {
        opts.onProgress({
          phase: "extract_pixels",
          loaded: currentHeight,
          total: currentHeight
        });
      }
    }
    const firstPixels = [];
    for (let i = 0; i < Math.min(MARKER_START.length, rawRGB.length / 3); i++) {
      firstPixels.push({
        r: rawRGB[i * 3],
        g: rawRGB[i * 3 + 1],
        b: rawRGB[i * 3 + 2]
      });
    }
    let hasMarkerStart = false;
    if (firstPixels.length === MARKER_START.length) {
      hasMarkerStart = true;
      for (let i = 0; i < MARKER_START.length; i++) {
        if (firstPixels[i].r !== MARKER_START[i].r || firstPixels[i].g !== MARKER_START[i].g || firstPixels[i].b !== MARKER_START[i].b) {
          hasMarkerStart = false;
          break;
        }
      }
    }
    let hasPixelMagic = false;
    let hasBlockMagic = false;
    if (rawRGB.length >= 8 + PIXEL_MAGIC.length) {
      const widthFromDim = rawRGB.readUInt32BE(0);
      const heightFromDim = rawRGB.readUInt32BE(4);
      if (widthFromDim === currentWidth && heightFromDim === currentHeight && rawRGB.slice(8, 8 + PIXEL_MAGIC.length).equals(PIXEL_MAGIC)) {
        hasPixelMagic = true;
      } else if (rawRGB.slice(8, 8 + PIXEL_MAGIC_BLOCK.length).equals(PIXEL_MAGIC_BLOCK)) {
        hasBlockMagic = true;
      }
    }
    let logicalWidth;
    let logicalHeight;
    let logicalData;
    if (hasMarkerStart || hasPixelMagic || hasBlockMagic) {
      logicalWidth = currentWidth;
      logicalHeight = currentHeight;
      logicalData = rawRGB;
    } else {
      const reconstructed = await cropAndReconstitute(processedBuf, opts.debugDir);
      const rawData = native.sharpToRaw(reconstructed);
      logicalWidth = rawData.width;
      logicalHeight = rawData.height;
      logicalData = Buffer.from(rawData.pixels);
    }
    if (process.env.ROX_DEBUG) {
      console.log("DEBUG: Logical grid reconstructed:", logicalWidth, "x", logicalHeight, "=", logicalWidth * logicalHeight, "pixels");
    }
    if (hasPixelMagic) {
      if (logicalData.length < 8 + PIXEL_MAGIC.length) {
        throw new DataFormatError("Pixel mode data too short");
      }
      let idx = 8 + PIXEL_MAGIC.length;
      const version = logicalData[idx++];
      const nameLen = logicalData[idx++];
      let name;
      if (nameLen > 0 && nameLen < 256) {
        name = logicalData.slice(idx, idx + nameLen).toString("utf8");
        idx += nameLen;
      }
      const payloadLen = logicalData.readUInt32BE(idx);
      idx += 4;
      const available = logicalData.length - idx;
      if (available < payloadLen) {
        throw new DataFormatError(`Pixel payload truncated: expected ${payloadLen} bytes but only ${available} available`);
      }
      const rawPayload = logicalData.slice(idx, idx + payloadLen);
      let payload = tryDecryptIfNeeded(rawPayload, opts.passphrase);
      try {
        payload = await tryZstdDecompress(payload, (info) => {
          if (opts.onProgress)
            opts.onProgress(info);
        });
        if (version === 3) {
          payload = deltaDecode(payload);
        }
      } catch (e) {
      }
      if (!payload.slice(0, MAGIC.length).equals(MAGIC)) {
        throw new DataFormatError("Invalid ROX format (pixel mode: missing ROX1 magic after decompression)");
      }
      payload = payload.slice(MAGIC.length);
      return { buf: payload, meta: { name } };
    }
    const totalPixels = logicalData.length / 3 | 0;
    let startIdx = -1;
    for (let i = 0; i <= totalPixels - MARKER_START.length; i++) {
      let match = true;
      for (let mi = 0; mi < MARKER_START.length && match; mi++) {
        const offset = (i + mi) * 3;
        if (logicalData[offset] !== MARKER_START[mi].r || logicalData[offset + 1] !== MARKER_START[mi].g || logicalData[offset + 2] !== MARKER_START[mi].b) {
          match = false;
        }
      }
      if (match) {
        startIdx = i;
        break;
      }
    }
    if (startIdx === -1) {
      if (process.env.ROX_DEBUG) {
        console.log("DEBUG: MARKER_START not found in grid of", totalPixels, "pixels");
        console.log("DEBUG: Trying 2D scan for START marker...");
      }
      let found2D = false;
      for (let y = 0; y < logicalHeight && !found2D; y++) {
        for (let x = 0; x <= logicalWidth - MARKER_START.length && !found2D; x++) {
          let match = true;
          for (let mi = 0; mi < MARKER_START.length && match; mi++) {
            const idx = (y * logicalWidth + (x + mi)) * 3;
            if (idx + 2 >= logicalData.length || logicalData[idx] !== MARKER_START[mi].r || logicalData[idx + 1] !== MARKER_START[mi].g || logicalData[idx + 2] !== MARKER_START[mi].b) {
              match = false;
            }
          }
          if (match) {
            if (process.env.ROX_DEBUG) {
              console.log(`DEBUG: Found START marker in 2D at (${x}, ${y})`);
            }
            let endX = x + MARKER_START.length - 1;
            let endY = y;
            for (let scanY = y; scanY < logicalHeight; scanY++) {
              let rowHasData = false;
              for (let scanX = x; scanX < logicalWidth; scanX++) {
                const scanIdx = (scanY * logicalWidth + scanX) * 3;
                if (scanIdx + 2 < logicalData.length) {
                  const r = logicalData[scanIdx];
                  const g = logicalData[scanIdx + 1];
                  const b = logicalData[scanIdx + 2];
                  const isBackground = r === 100 && g === 120 && b === 110 || r === 0 && g === 0 && b === 0 || r >= 50 && r <= 220 && g >= 50 && g <= 220 && b >= 50 && b <= 220 && Math.abs(r - g) < 70 && Math.abs(r - b) < 70 && Math.abs(g - b) < 70;
                  if (!isBackground) {
                    rowHasData = true;
                    if (scanX > endX) {
                      endX = scanX;
                    }
                  }
                }
              }
              if (rowHasData) {
                endY = scanY;
              } else if (scanY > y) {
                break;
              }
            }
            const rectWidth = endX - x + 1;
            const rectHeight = endY - y + 1;
            if (process.env.ROX_DEBUG) {
              console.log(`DEBUG: Extracted rectangle: ${rectWidth}x${rectHeight} from (${x},${y})`);
            }
            const newDataLen = rectWidth * rectHeight * 3;
            const newData = Buffer.allocUnsafe(newDataLen);
            let writeIdx = 0;
            for (let ry = y; ry <= endY; ry++) {
              for (let rx = x; rx <= endX; rx++) {
                const idx = (ry * logicalWidth + rx) * 3;
                newData[writeIdx++] = logicalData[idx];
                newData[writeIdx++] = logicalData[idx + 1];
                newData[writeIdx++] = logicalData[idx + 2];
              }
            }
            logicalData = newData;
            logicalWidth = rectWidth;
            logicalHeight = rectHeight;
            startIdx = 0;
            found2D = true;
          }
        }
      }
      if (!found2D) {
        if (process.env.ROX_DEBUG) {
          const first20 = [];
          for (let i = 0; i < Math.min(20, totalPixels); i++) {
            const offset = i * 3;
            first20.push(`(${logicalData[offset]},${logicalData[offset + 1]},${logicalData[offset + 2]})`);
          }
          console.log("DEBUG: First 20 pixels:", first20.join(" "));
        }
        throw new Error("Marker START not found - image format not supported");
      }
    }
    if (process.env.ROX_DEBUG && startIdx === 0) {
      console.log(`DEBUG: MARKER_START at index ${startIdx}, grid size: ${totalPixels}`);
    }
    const dataStartPixel = startIdx + MARKER_START.length + 1;
    const curTotalPixels = logicalData.length / 3 | 0;
    if (curTotalPixels < dataStartPixel + MARKER_END.length) {
      if (process.env.ROX_DEBUG) {
        console.log("DEBUG: grid too small:", curTotalPixels, "pixels");
      }
      throw new Error("Marker START or END not found - image format not supported");
    }
    for (let i = 0; i < MARKER_START.length; i++) {
      const offset = (startIdx + i) * 3;
      if (logicalData[offset] !== MARKER_START[i].r || logicalData[offset + 1] !== MARKER_START[i].g || logicalData[offset + 2] !== MARKER_START[i].b) {
        throw new Error("Marker START not found - image format not supported");
      }
    }
    let compression = "zstd";
    if (curTotalPixels > startIdx + MARKER_START.length) {
      const compOffset = (startIdx + MARKER_START.length) * 3;
      const compPixel = {
        r: logicalData[compOffset],
        g: logicalData[compOffset + 1],
        b: logicalData[compOffset + 2]
      };
      if (compPixel.r === 0 && compPixel.g === 255 && compPixel.b === 0) {
        compression = "zstd";
      } else {
        compression = "zstd";
      }
    }
    if (process.env.ROX_DEBUG) {
      console.log(`DEBUG: Detected compression: ${compression}`);
    }
    let endStartPixel = -1;
    const lastLineStart = (logicalHeight - 1) * logicalWidth;
    const endMarkerStartCol = logicalWidth - MARKER_END.length;
    if (lastLineStart + endMarkerStartCol < curTotalPixels) {
      let matchEnd = true;
      for (let mi = 0; mi < MARKER_END.length && matchEnd; mi++) {
        const pixelIdx = lastLineStart + endMarkerStartCol + mi;
        if (pixelIdx >= curTotalPixels) {
          matchEnd = false;
          break;
        }
        const offset = pixelIdx * 3;
        if (logicalData[offset] !== MARKER_END[mi].r || logicalData[offset + 1] !== MARKER_END[mi].g || logicalData[offset + 2] !== MARKER_END[mi].b) {
          matchEnd = false;
        }
      }
      if (matchEnd) {
        endStartPixel = lastLineStart + endMarkerStartCol - startIdx;
        if (process.env.ROX_DEBUG) {
          console.log(`DEBUG: Found END marker at last line, col ${endMarkerStartCol}`);
        }
      }
    }
    if (endStartPixel === -1) {
      if (process.env.ROX_DEBUG) {
        console.log("DEBUG: END marker not found at expected position");
        const lastLinePixels = [];
        for (let i = Math.max(0, lastLineStart); i < curTotalPixels && i < lastLineStart + 20; i++) {
          const offset = i * 3;
          lastLinePixels.push(`(${logicalData[offset]},${logicalData[offset + 1]},${logicalData[offset + 2]})`);
        }
        console.log("DEBUG: Last line pixels:", lastLinePixels.join(" "));
      }
      endStartPixel = curTotalPixels - startIdx;
    }
    const dataPixelCount = endStartPixel - (MARKER_START.length + 1);
    const pixelBytes = Buffer.allocUnsafe(dataPixelCount * 3);
    for (let i = 0; i < dataPixelCount; i++) {
      const srcOffset = (dataStartPixel + i) * 3;
      const dstOffset = i * 3;
      pixelBytes[dstOffset] = logicalData[srcOffset];
      pixelBytes[dstOffset + 1] = logicalData[srcOffset + 1];
      pixelBytes[dstOffset + 2] = logicalData[srcOffset + 2];
    }
    if (process.env.ROX_DEBUG) {
      console.log("DEBUG: extracted len", pixelBytes.length);
      console.log("DEBUG: extracted head", pixelBytes.slice(0, 32).toString("hex"));
      const found = pixelBytes.indexOf(PIXEL_MAGIC);
      console.log("DEBUG: PIXEL_MAGIC index:", found);
      if (found !== -1) {
        console.log("DEBUG: PIXEL_MAGIC head:", pixelBytes.slice(found, found + 64).toString("hex"));
        const markerEndBytes = colorsToBytes(MARKER_END);
        console.log("DEBUG: MARKER_END index:", pixelBytes.indexOf(markerEndBytes));
      }
    }
    try {
      let idx = 0;
      if (pixelBytes.length >= PIXEL_MAGIC.length) {
        const at0 = pixelBytes.slice(0, PIXEL_MAGIC.length).equals(PIXEL_MAGIC);
        const at0Block = pixelBytes.slice(0, PIXEL_MAGIC_BLOCK.length).equals(PIXEL_MAGIC_BLOCK);
        if (at0) {
          idx = PIXEL_MAGIC.length;
        } else if (at0Block) {
          idx = PIXEL_MAGIC_BLOCK.length;
        } else {
          const found = pixelBytes.indexOf(PIXEL_MAGIC);
          const foundBlock = pixelBytes.indexOf(PIXEL_MAGIC_BLOCK);
          if (found !== -1) {
            idx = found + PIXEL_MAGIC.length;
          } else if (foundBlock !== -1) {
            idx = foundBlock + PIXEL_MAGIC_BLOCK.length;
          }
        }
      }
      if (idx > 0) {
        const version = pixelBytes[idx++];
        const nameLen = pixelBytes[idx++];
        let name;
        if (nameLen > 0 && nameLen < 256) {
          name = pixelBytes.slice(idx, idx + nameLen).toString("utf8");
          idx += nameLen;
        }
        const payloadLen = pixelBytes.readUInt32BE(idx);
        idx += 4;
        if (idx + 4 <= pixelBytes.length) {
          const marker = pixelBytes.slice(idx, idx + 4).toString("utf8");
          if (marker === "rXFL") {
            idx += 4;
            if (idx + 4 <= pixelBytes.length) {
              const jsonLen = pixelBytes.readUInt32BE(idx);
              idx += 4;
              idx += jsonLen;
            }
          }
        }
        const available = pixelBytes.length - idx;
        if (available < payloadLen) {
          throw new DataFormatError(`Pixel payload truncated: expected ${payloadLen} bytes but only ${available} available`);
        }
        const rawPayload = pixelBytes.slice(idx, idx + payloadLen);
        let payload = tryDecryptIfNeeded(rawPayload, opts.passphrase);
        try {
          payload = await tryDecompress(payload, (info) => {
            if (opts.onProgress)
              opts.onProgress(info);
          });
          if (version === 3) {
            payload = deltaDecode(payload);
          }
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          if (opts.passphrase)
            throw new IncorrectPassphraseError(`Incorrect passphrase (screenshot mode, zstd failed: ` + errMsg + ")");
          throw new DataFormatError(`Screenshot mode zstd decompression failed: ` + errMsg);
        }
        if (!payload.slice(0, MAGIC.length).equals(MAGIC)) {
          throw new DataFormatError("Invalid ROX format (pixel mode: missing ROX1 magic after decompression)");
        }
        payload = payload.slice(MAGIC.length);
        if (opts.files) {
          const unpacked = unpackBuffer(payload, opts.files);
          if (unpacked) {
            if (opts.onProgress)
              opts.onProgress({ phase: "done" });
            progressBar?.stop();
            return { files: unpacked.files, meta: { name } };
          }
        }
        if (opts.onProgress)
          opts.onProgress({ phase: "done" });
        progressBar?.stop();
        return { buf: payload, meta: { name } };
      }
    } catch (e) {
      if (e instanceof PassphraseRequiredError || e instanceof IncorrectPassphraseError || e instanceof DataFormatError) {
        throw e;
      }
      const errMsg = e instanceof Error ? e.message : String(e);
      throw new Error("Failed to extract data from screenshot: " + errMsg);
    }
  } catch (e) {
    if (e instanceof PassphraseRequiredError || e instanceof IncorrectPassphraseError || e instanceof DataFormatError) {
      throw e;
    }
    const errMsg = e instanceof Error ? e.message : String(e);
    throw new Error("Failed to decode PNG: " + errMsg);
  }
  throw new DataFormatError("No valid data found in image");
}

// node_modules/roxify/dist/utils/encoder.js
var import_crypto2 = require("crypto");
var zlib = __toESM(require("zlib"), 1);
async function encodeBinaryToPng(input, opts = {}) {
  let progressBar = null;
  if (opts.showProgress) {
    progressBar = {
      start: () => {
      },
      update: () => {
      },
      stop: () => {
      }
    };
    const startTime = Date.now();
    if (!opts.onProgress) {
      opts.onProgress = (info) => {
        let pct = 0;
        if (info.phase === "compress_progress" && info.loaded && info.total) {
          pct = info.loaded / info.total * 50;
        } else if (info.phase === "compress_done") {
          pct = 50;
        } else if (info.phase === "encrypt_done") {
          pct = 80;
        } else if (info.phase === "png_gen") {
          pct = 90;
        } else if (info.phase === "done") {
          pct = 100;
        }
      };
    }
  }
  let payloadInput;
  let totalLen = 0;
  if (Array.isArray(input)) {
    payloadInput = [MAGIC, ...input];
    totalLen = MAGIC.length + input.reduce((a, b) => a + b.length, 0);
  } else {
    payloadInput = [MAGIC, input];
    totalLen = MAGIC.length + input.length;
  }
  if (opts.onProgress)
    opts.onProgress({ phase: "compress_start", total: totalLen });
  const compressionLevel = opts.compressionLevel ?? 19;
  let payload = await parallelZstdCompress(payloadInput, compressionLevel, (loaded, total) => {
    if (opts.onProgress) {
      opts.onProgress({
        phase: "compress_progress",
        loaded,
        total
      });
    }
  });
  if (opts.onProgress)
    opts.onProgress({ phase: "compress_done", loaded: payload.length });
  if (Array.isArray(input)) {
    input.length = 0;
  }
  if (opts.passphrase && !opts.encrypt) {
    opts.encrypt = "aes";
  }
  if (opts.encrypt === "auto" && !opts._skipAuto) {
    const candidates = ["none", "xor", "aes"];
    const candidateBufs = [];
    for (const c of candidates) {
      const testBuf = await encodeBinaryToPng(input, {
        ...opts,
        encrypt: c,
        _skipAuto: true
      });
      candidateBufs.push({ enc: c, buf: testBuf });
    }
    candidateBufs.sort((a, b) => a.buf.length - b.buf.length);
    return candidateBufs[0].buf;
  }
  if (opts.passphrase && opts.encrypt && opts.encrypt !== "auto") {
    const encChoice = opts.encrypt;
    if (opts.onProgress)
      opts.onProgress({ phase: "encrypt_start" });
    if (encChoice === "aes") {
      const salt = (0, import_crypto2.randomBytes)(16);
      const iv = (0, import_crypto2.randomBytes)(12);
      const PBKDF2_ITERS = 1e6;
      const key = (0, import_crypto2.pbkdf2Sync)(opts.passphrase, salt, PBKDF2_ITERS, 32, "sha256");
      const cipher = (0, import_crypto2.createCipheriv)("aes-256-gcm", key, iv);
      const encParts = [];
      for (const chunk of payload) {
        encParts.push(cipher.update(chunk));
      }
      encParts.push(cipher.final());
      const tag = cipher.getAuthTag();
      payload = [Buffer.from([ENC_AES]), salt, iv, tag, ...encParts];
      if (opts.onProgress)
        opts.onProgress({ phase: "encrypt_done" });
    } else if (encChoice === "xor") {
      const xoredParts = [];
      let offset = 0;
      const keyBuf = Buffer.from(opts.passphrase, "utf8");
      for (const chunk of payload) {
        const out = Buffer.alloc(chunk.length);
        for (let i = 0; i < chunk.length; i++) {
          out[i] = chunk[i] ^ keyBuf[(offset + i) % keyBuf.length];
        }
        offset += chunk.length;
        xoredParts.push(out);
      }
      payload = [Buffer.from([ENC_XOR]), ...xoredParts];
      if (opts.onProgress)
        opts.onProgress({ phase: "encrypt_done" });
    } else if (encChoice === "none") {
      payload = [Buffer.from([ENC_NONE]), ...payload];
      if (opts.onProgress)
        opts.onProgress({ phase: "encrypt_done" });
    }
  } else {
    payload = [Buffer.from([ENC_NONE]), ...payload];
  }
  const payloadTotalLen = payload.reduce((a, b) => a + b.length, 0);
  if (opts.onProgress)
    opts.onProgress({ phase: "meta_prep_done", loaded: payloadTotalLen });
  const metaParts = [];
  const includeName = opts.includeName === void 0 ? true : !!opts.includeName;
  if (includeName && opts.name) {
    const nameBuf = Buffer.from(opts.name, "utf8");
    metaParts.push(Buffer.from([nameBuf.length]));
    metaParts.push(nameBuf);
  } else {
    metaParts.push(Buffer.from([0]));
  }
  let meta = [...metaParts, ...payload];
  if (opts.includeFileList && opts.fileList) {
    let sizeMap = null;
    if (!Array.isArray(input)) {
      try {
        const unpack = unpackBuffer(input);
        if (unpack) {
          sizeMap = {};
          for (const ef of unpack.files)
            sizeMap[ef.path] = ef.buf.length;
        }
      } catch (e) {
      }
    }
    const normalized = opts.fileList.map((f) => {
      if (typeof f === "string")
        return { name: f, size: sizeMap && sizeMap[f] ? sizeMap[f] : 0 };
      if (f && typeof f === "object") {
        if (f.name)
          return { name: f.name, size: f.size ?? 0 };
        if (f.path)
          return { name: f.path, size: f.size ?? 0 };
      }
      return { name: String(f), size: 0 };
    });
    const jsonBuf = Buffer.from(JSON.stringify(normalized), "utf8");
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(jsonBuf.length, 0);
    meta = [...meta, Buffer.from("rXFL", "utf8"), lenBuf, jsonBuf];
  }
  if (opts.output === "rox") {
    return Buffer.concat([MAGIC, ...meta]);
  }
  {
    const nameBuf = opts.name ? Buffer.from(opts.name, "utf8") : Buffer.alloc(0);
    const nameLen = nameBuf.length;
    const payloadLenBuf = Buffer.alloc(4);
    payloadLenBuf.writeUInt32BE(payloadTotalLen, 0);
    const version = 1;
    let metaPixel = [
      Buffer.from([version]),
      Buffer.from([nameLen]),
      nameBuf,
      payloadLenBuf,
      ...payload
    ];
    if (opts.includeFileList && opts.fileList) {
      let sizeMap2 = null;
      if (!Array.isArray(input)) {
        try {
          const unpack = unpackBuffer(input);
          if (unpack) {
            sizeMap2 = {};
            for (const ef of unpack.files)
              sizeMap2[ef.path] = ef.buf.length;
          }
        } catch (e) {
        }
      }
      const normalized = opts.fileList.map((f) => {
        if (typeof f === "string")
          return { name: f, size: sizeMap2 && sizeMap2[f] ? sizeMap2[f] : 0 };
        if (f && typeof f === "object") {
          if (f.name)
            return { name: f.name, size: f.size ?? 0 };
          if (f.path)
            return { name: f.path, size: f.size ?? 0 };
        }
        return { name: String(f), size: 0 };
      });
      const jsonBuf = Buffer.from(JSON.stringify(normalized), "utf8");
      const lenBuf = Buffer.alloc(4);
      lenBuf.writeUInt32BE(jsonBuf.length, 0);
      metaPixel = [...metaPixel, Buffer.from("rXFL", "utf8"), lenBuf, jsonBuf];
    }
    const useBlockEncoding = false;
    const pixelMagic = useBlockEncoding ? PIXEL_MAGIC_BLOCK : PIXEL_MAGIC;
    const dataWithoutMarkers = [pixelMagic, ...metaPixel];
    const dataWithoutMarkersLen = dataWithoutMarkers.reduce((a, b) => a + b.length, 0);
    const padding = (3 - dataWithoutMarkersLen % 3) % 3;
    const paddedData = padding > 0 ? [...dataWithoutMarkers, Buffer.alloc(padding)] : dataWithoutMarkers;
    const markerStartBytes = colorsToBytes(MARKER_START);
    const compressionMarkerBytes = colorsToBytes(COMPRESSION_MARKERS.zstd);
    const dataWithMarkers = [
      markerStartBytes,
      compressionMarkerBytes,
      ...paddedData
    ];
    const dataWithMarkersLen = dataWithMarkers.reduce((a, b) => a + b.length, 0);
    let width;
    let height;
    let bufScr;
    if (useBlockEncoding) {
      const flatData = Buffer.concat(dataWithMarkers);
      const blocksPerRow = Math.ceil(Math.sqrt(flatData.length));
      const numRows = Math.ceil(flatData.length / blocksPerRow);
      width = blocksPerRow * 2;
      height = numRows * 2;
      const rgbBuffer = Buffer.alloc(width * height * 3);
      for (let i = 0; i < flatData.length; i++) {
        const blockRow = Math.floor(i / blocksPerRow);
        const blockCol = i % blocksPerRow;
        const pixelRow = blockRow * 2;
        const pixelCol = blockCol * 2;
        const byte = flatData[i];
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const px = (pixelRow + dy) * width + (pixelCol + dx);
            rgbBuffer[px * 3] = byte;
            rgbBuffer[px * 3 + 1] = byte;
            rgbBuffer[px * 3 + 2] = byte;
          }
        }
      }
      bufScr = Buffer.from(native.rgbToPng(rgbBuffer, width, height));
    } else {
      const bytesPerPixel = 3;
      const dataPixels = Math.ceil(dataWithMarkersLen / 3);
      const totalPixels = dataPixels + MARKER_END.length;
      const maxWidth = 16384;
      let side = Math.ceil(Math.sqrt(totalPixels));
      if (side < MARKER_END.length)
        side = MARKER_END.length;
      let logicalWidth;
      let logicalHeight;
      if (side <= maxWidth) {
        logicalWidth = side;
        logicalHeight = side;
      } else {
        logicalWidth = Math.min(maxWidth, totalPixels);
        logicalHeight = Math.ceil(totalPixels / logicalWidth);
      }
      const scale = 1;
      width = logicalWidth * scale;
      height = logicalHeight * scale;
      const LARGE_IMAGE_PIXELS = 1e7;
      const useManualPng = (width * height > LARGE_IMAGE_PIXELS || !!process.env.ROX_FAST_PNG) && opts.outputFormat !== "webp";
      if (process.env.ROX_DEBUG) {
        console.log(`[DEBUG] Width=${width}, Height=${height}, Pixels=${width * height}`);
        console.log(`[DEBUG] outputFormat=${opts.outputFormat}, useManualPng=${useManualPng}`);
      }
      let raw;
      let stride = 0;
      if (useManualPng) {
        stride = width * 3 + 1;
        raw = Buffer.alloc(height * stride);
        const flatData = Buffer.concat(dataWithMarkers);
        const markerEndBytes = Buffer.alloc(MARKER_END.length * 3);
        for (let i = 0; i < MARKER_END.length; i++) {
          markerEndBytes[i * 3] = MARKER_END[i].r;
          markerEndBytes[i * 3 + 1] = MARKER_END[i].g;
          markerEndBytes[i * 3 + 2] = MARKER_END[i].b;
        }
        const totalDataBytes = logicalWidth * logicalHeight * 3;
        const fullData = Buffer.alloc(totalDataBytes);
        const markerStartPos = (logicalHeight - 1) * logicalWidth * 3 + (logicalWidth - MARKER_END.length) * 3;
        flatData.copy(fullData, 0, 0, Math.min(flatData.length, markerStartPos));
        markerEndBytes.copy(fullData, markerStartPos);
        for (let row = 0; row < height; row++) {
          raw[row * stride] = 0;
          fullData.copy(raw, row * stride + 1, row * width * 3, (row + 1) * width * 3);
        }
      } else {
        raw = Buffer.alloc(width * height * 3);
        const flatData = Buffer.concat(dataWithMarkers);
        flatData.copy(raw, 0, 0, Math.min(flatData.length, raw.length));
      }
      if (opts.onProgress)
        opts.onProgress({ phase: "png_gen", loaded: 0, total: height });
      if (useManualPng) {
        const bytesPerRow = width * 3;
        const scanlinesData = Buffer.alloc(height * (1 + bytesPerRow));
        const progressStep = Math.max(1, Math.floor(height / 20));
        for (let row = 0; row < height; row++) {
          scanlinesData[row * (1 + bytesPerRow)] = 0;
          const srcStart = row * stride + 1;
          const dstStart = row * (1 + bytesPerRow) + 1;
          raw.copy(scanlinesData, dstStart, srcStart, srcStart + bytesPerRow);
          if (opts.onProgress && row % progressStep === 0) {
            opts.onProgress({ phase: "png_gen", loaded: row, total: height });
          }
        }
        if (opts.onProgress)
          opts.onProgress({ phase: "png_compress", loaded: 0, total: 100 });
        const idatData = zlib.deflateSync(scanlinesData, {
          level: 0,
          memLevel: 8,
          strategy: zlib.constants.Z_FILTERED
        });
        raw = Buffer.alloc(0);
        const ihdrData = Buffer.alloc(13);
        ihdrData.writeUInt32BE(width, 0);
        ihdrData.writeUInt32BE(height, 4);
        ihdrData[8] = 8;
        ihdrData[9] = 2;
        ihdrData[10] = 0;
        ihdrData[11] = 0;
        ihdrData[12] = 0;
        const ihdrType = Buffer.from("IHDR", "utf8");
        const ihdrCrc = crc32(ihdrData, crc32(ihdrType));
        const ihdrCrcBuf = Buffer.alloc(4);
        ihdrCrcBuf.writeUInt32BE(ihdrCrc, 0);
        const ihdrLen = Buffer.alloc(4);
        ihdrLen.writeUInt32BE(ihdrData.length, 0);
        const idatType = Buffer.from("IDAT", "utf8");
        const idatCrc = crc32(idatData, crc32(idatType));
        const idatCrcBuf = Buffer.alloc(4);
        idatCrcBuf.writeUInt32BE(idatCrc, 0);
        const idatLen = Buffer.alloc(4);
        idatLen.writeUInt32BE(idatData.length, 0);
        const iendType = Buffer.from("IEND", "utf8");
        const iendCrc = crc32(Buffer.alloc(0), crc32(iendType));
        const iendCrcBuf = Buffer.alloc(4);
        iendCrcBuf.writeUInt32BE(iendCrc, 0);
        const iendLen = Buffer.alloc(4);
        iendLen.writeUInt32BE(0, 0);
        bufScr = Buffer.concat([
          PNG_HEADER,
          ihdrLen,
          ihdrType,
          ihdrData,
          ihdrCrcBuf,
          idatLen,
          idatType,
          idatData,
          idatCrcBuf,
          iendLen,
          iendType,
          iendCrcBuf
        ]);
      } else {
        const outputFormat = opts.outputFormat || "png";
        if (outputFormat === "webp") {
          throw new Error("WebP output format not supported with native backend");
        } else {
          bufScr = Buffer.from(native.rgbToPng(raw, width, height));
        }
      }
    }
    payload.length = 0;
    dataWithMarkers.length = 0;
    metaPixel.length = 0;
    meta.length = 0;
    paddedData.length = 0;
    dataWithoutMarkers.length = 0;
    if (opts.onProgress)
      opts.onProgress({ phase: "png_compress", loaded: 100, total: 100 });
    progressBar?.stop();
    return bufScr;
  }
}

// node_modules/roxify/dist/utils/inspection.js
var zlib2 = __toESM(require("zlib"), 1);
async function listFilesInPng(pngBuf, opts = {}) {
  try {
    const chunks = native.extractPngChunks(pngBuf);
    const ihdr = chunks.find((c) => c.name === "IHDR");
    const idatChunks = chunks.filter((c) => c.name === "IDAT");
    if (ihdr && idatChunks.length > 0) {
      const ihdrData = Buffer.from(ihdr.data);
      const width = ihdrData.readUInt32BE(0);
      const bpp = 3;
      const rowLen = 1 + width * bpp;
      const files = await new Promise((resolve3) => {
        const inflate = zlib2.createInflate();
        let buffer = Buffer.alloc(0);
        let resolved = false;
        inflate.on("data", (chunk) => {
          if (resolved)
            return;
          buffer = Buffer.concat([buffer, chunk]);
          const cleanBuffer = Buffer.alloc(buffer.length);
          let cleanPtr = 0;
          let ptr = 0;
          while (ptr < buffer.length) {
            const rowPos = ptr % rowLen;
            if (rowPos === 0) {
              ptr++;
            } else {
              const remainingInRow = rowLen - rowPos;
              const available = buffer.length - ptr;
              const toCopy = Math.min(remainingInRow, available);
              buffer.copy(cleanBuffer, cleanPtr, ptr, ptr + toCopy);
              cleanPtr += toCopy;
              ptr += toCopy;
            }
          }
          const validClean = cleanBuffer.slice(0, cleanPtr);
          if (validClean.length < 12)
            return;
          const magic = validClean.slice(8, 12);
          if (!magic.equals(PIXEL_MAGIC)) {
            resolved = true;
            inflate.destroy();
            resolve3(null);
            return;
          }
          let idx = 12;
          if (validClean.length < idx + 2)
            return;
          idx++;
          const nameLen = validClean[idx++];
          if (validClean.length < idx + nameLen + 4)
            return;
          idx += nameLen;
          idx += 4;
          if (validClean.length < idx + 4)
            return;
          const marker = validClean.slice(idx, idx + 4).toString("utf8");
          if (marker === "rXFL") {
            idx += 4;
            if (validClean.length < idx + 4)
              return;
            const jsonLen = validClean.readUInt32BE(idx);
            idx += 4;
            if (validClean.length < idx + jsonLen)
              return;
            const jsonBuf = validClean.slice(idx, idx + jsonLen);
            try {
              const parsedFiles = JSON.parse(jsonBuf.toString("utf8"));
              resolved = true;
              inflate.destroy();
              if (parsedFiles.length > 0 && typeof parsedFiles[0] === "object" && (parsedFiles[0].name || parsedFiles[0].path)) {
                const objs = parsedFiles.map((p) => ({
                  name: p.name ?? p.path,
                  size: typeof p.size === "number" ? p.size : 0
                }));
                resolve3(objs.sort((a, b) => a.name.localeCompare(b.name)));
                return;
              }
              const names = parsedFiles;
              if (opts.includeSizes) {
                getFileSizesFromPng(pngBuf).then((sizes) => {
                  if (sizes) {
                    resolve3(names.map((f) => ({ name: f, size: sizes[f] ?? 0 })).sort((a, b) => a.name.localeCompare(b.name)));
                  } else {
                    resolve3(names.sort());
                  }
                }).catch(() => resolve3(names.sort()));
              } else {
                resolve3(names.sort());
              }
            } catch (e) {
              resolved = true;
              inflate.destroy();
              resolve3(null);
            }
          } else {
            resolved = true;
            inflate.destroy();
            resolve3(null);
          }
        });
        inflate.on("error", () => {
          if (!resolved)
            resolve3(null);
        });
        inflate.on("end", () => {
          if (!resolved)
            resolve3(null);
        });
        for (const chunk of idatChunks) {
          if (resolved)
            break;
          inflate.write(Buffer.from(chunk.data));
        }
        inflate.end();
      });
      if (files)
        return files;
    }
  } catch (e) {
    console.log(" error:", e);
  }
  try {
    try {
      const rawData = native.sharpToRaw(pngBuf);
      const data = rawData.pixels;
      const currentWidth = rawData.width;
      const currentHeight = rawData.height;
      const rawRGB = Buffer.alloc(currentWidth * currentHeight * 3);
      for (let i = 0; i < currentWidth * currentHeight; i++) {
        rawRGB[i * 3] = data[i * 3];
        rawRGB[i * 3 + 1] = data[i * 4 + 1];
        rawRGB[i * 3 + 2] = data[i * 4 + 2];
      }
      const found = rawRGB.indexOf(PIXEL_MAGIC);
      if (found !== -1) {
        let idx = found + PIXEL_MAGIC.length;
        if (idx + 2 <= rawRGB.length) {
          const version = rawRGB[idx++];
          const nameLen = rawRGB[idx++];
          if (process.env.ROX_DEBUG)
            console.log("listFilesInPng: pixel version", version, "nameLen", nameLen);
          if (nameLen > 0 && idx + nameLen <= rawRGB.length) {
            idx += nameLen;
          }
          if (idx + 4 <= rawRGB.length) {
            const payloadLen = rawRGB.readUInt32BE(idx);
            idx += 4;
            const afterPayload = idx + payloadLen;
            if (afterPayload <= rawRGB.length) {
              if (afterPayload + 8 <= rawRGB.length) {
                const marker = rawRGB.slice(afterPayload, afterPayload + 4).toString("utf8");
                if (marker === "rXFL") {
                  const jsonLen = rawRGB.readUInt32BE(afterPayload + 4);
                  const jsonStart = afterPayload + 8;
                  const jsonEnd = jsonStart + jsonLen;
                  if (jsonEnd <= rawRGB.length) {
                    const jsonBuf = rawRGB.slice(jsonStart, jsonEnd);
                    const parsedFiles = JSON.parse(jsonBuf.toString("utf8"));
                    if (parsedFiles.length > 0 && typeof parsedFiles[0] === "object" && (parsedFiles[0].name || parsedFiles[0].path)) {
                      const objs = parsedFiles.map((p) => ({
                        name: p.name ?? p.path,
                        size: typeof p.size === "number" ? p.size : 0
                      }));
                      return objs.sort((a, b) => a.name.localeCompare(b.name));
                    }
                    const files = parsedFiles;
                    if (opts.includeSizes) {
                      const sizes = await getFileSizesFromPng(pngBuf);
                      if (sizes) {
                        return files.map((f) => ({ name: f, size: sizes[f] ?? 0 })).sort((a, b) => a.name.localeCompare(b.name));
                      }
                    }
                    return files.sort();
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
    }
  } catch (e) {
  }
  try {
    const reconstructed = await cropAndReconstitute(pngBuf);
    try {
      const rawData = native.sharpToRaw(reconstructed);
      const data = rawData.pixels;
      const currentWidth = rawData.width;
      const currentHeight = rawData.height;
      const rawRGB = Buffer.alloc(currentWidth * currentHeight * 3);
      for (let i = 0; i < currentWidth * currentHeight; i++) {
        rawRGB[i * 3] = data[i * 3];
        rawRGB[i * 3 + 1] = data[i * 3 + 1];
        rawRGB[i * 3 + 2] = data[i * 3 + 2];
      }
      const found = rawRGB.indexOf(PIXEL_MAGIC);
      if (found !== -1) {
        let idx = found + PIXEL_MAGIC.length;
        if (idx + 2 <= rawRGB.length) {
          const version = rawRGB[idx++];
          const nameLen = rawRGB[idx++];
          if (process.env.ROX_DEBUG)
            console.log("listFilesInPng (reconstructed): pixel version", version, "nameLen", nameLen);
          if (nameLen > 0 && idx + nameLen <= rawRGB.length) {
            idx += nameLen;
          }
          if (idx + 4 <= rawRGB.length) {
            const payloadLen = rawRGB.readUInt32BE(idx);
            idx += 4;
            const afterPayload = idx + payloadLen;
            if (afterPayload <= rawRGB.length) {
              if (afterPayload + 8 <= rawRGB.length) {
                const marker = rawRGB.slice(afterPayload, afterPayload + 4).toString("utf8");
                if (marker === "rXFL") {
                  const jsonLen = rawRGB.readUInt32BE(afterPayload + 4);
                  const jsonStart = afterPayload + 8;
                  const jsonEnd = jsonStart + jsonLen;
                  if (jsonEnd <= rawRGB.length) {
                    const jsonBuf = rawRGB.slice(jsonStart, jsonEnd);
                    const parsedFiles = JSON.parse(jsonBuf.toString("utf8"));
                    if (parsedFiles.length > 0 && typeof parsedFiles[0] === "object" && (parsedFiles[0].name || parsedFiles[0].path)) {
                      const objs = parsedFiles.map((p) => ({
                        name: p.name ?? p.path,
                        size: typeof p.size === "number" ? p.size : 0
                      }));
                      return objs.sort((a, b) => a.name.localeCompare(b.name));
                    }
                    const files = parsedFiles;
                    if (opts.includeSizes) {
                      const sizes = await getFileSizesFromPng(reconstructed);
                      if (sizes) {
                        return files.map((f) => ({ name: f, size: sizes[f] ?? 0 })).sort((a, b) => a.name.localeCompare(b.name));
                      }
                    }
                    return files.sort();
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
    }
    try {
      const chunks = native.extractPngChunks(reconstructed);
      const fileListChunk = chunks.find((c) => c.name === "rXFL");
      if (fileListChunk) {
        const data = Buffer.from(fileListChunk.data);
        const parsedFiles = JSON.parse(data.toString("utf8"));
        if (parsedFiles.length > 0 && typeof parsedFiles[0] === "object" && (parsedFiles[0].name || parsedFiles[0].path)) {
          const objs = parsedFiles.map((p) => ({
            name: p.name ?? p.path,
            size: typeof p.size === "number" ? p.size : 0
          }));
          return objs.sort((a, b) => a.name.localeCompare(b.name));
        }
        const files = parsedFiles;
        if (opts.includeSizes) {
          const sizes = await getFileSizesFromPng(pngBuf);
          if (sizes) {
            return files.map((f) => ({ name: f, size: sizes[f] ?? 0 })).sort((a, b) => a.name.localeCompare(b.name));
          }
        }
        return files.sort();
      }
      const metaChunk = chunks.find((c) => c.name === CHUNK_TYPE);
      if (metaChunk) {
        const dataBuf = Buffer.from(metaChunk.data);
        const markerIdx = dataBuf.indexOf(Buffer.from("rXFL"));
        if (markerIdx !== -1 && markerIdx + 8 <= dataBuf.length) {
          const jsonLen = dataBuf.readUInt32BE(markerIdx + 4);
          const jsonStart = markerIdx + 8;
          const jsonEnd = jsonStart + jsonLen;
          if (jsonEnd <= dataBuf.length) {
            const parsedFiles = JSON.parse(dataBuf.slice(jsonStart, jsonEnd).toString("utf8"));
            if (parsedFiles.length > 0 && typeof parsedFiles[0] === "object" && (parsedFiles[0].name || parsedFiles[0].path)) {
              const objs = parsedFiles.map((p) => ({
                name: p.name ?? p.path,
                size: typeof p.size === "number" ? p.size : 0
              }));
              return objs.sort((a, b) => a.name.localeCompare(b.name));
            }
            const files = parsedFiles;
            return files.sort();
          }
        }
      }
    } catch (e) {
    }
  } catch (e) {
  }
  try {
    const chunks = native.extractPngChunks(pngBuf);
    const fileListChunk = chunks.find((c) => c.name === "rXFL");
    if (fileListChunk) {
      const data = Buffer.from(fileListChunk.data);
      const parsedFiles = JSON.parse(data.toString("utf8"));
      if (parsedFiles.length > 0 && typeof parsedFiles[0] === "object" && (parsedFiles[0].name || parsedFiles[0].path)) {
        const objs = parsedFiles.map((p) => ({
          name: p.name ?? p.path,
          size: typeof p.size === "number" ? p.size : 0
        }));
        return objs.sort((a, b) => a.name.localeCompare(b.name));
      }
      const files = parsedFiles;
      if (opts.includeSizes) {
        const sizes = await getFileSizesFromPng(pngBuf);
        if (sizes) {
          return files.map((f) => ({ name: f, size: sizes[f] ?? 0 })).sort((a, b) => a.name.localeCompare(b.name));
        }
      }
      return files.sort();
    }
    const metaChunk = chunks.find((c) => c.name === CHUNK_TYPE);
    if (metaChunk) {
      const dataBuf = Buffer.from(metaChunk.data);
      const markerIdx = dataBuf.indexOf(Buffer.from("rXFL"));
      if (markerIdx !== -1 && markerIdx + 8 <= dataBuf.length) {
        const jsonLen = dataBuf.readUInt32BE(markerIdx + 4);
        const jsonStart = markerIdx + 8;
        const jsonEnd = jsonStart + jsonLen;
        if (jsonEnd <= dataBuf.length) {
          const parsedFiles = JSON.parse(dataBuf.slice(jsonStart, jsonEnd).toString("utf8"));
          if (parsedFiles.length > 0 && typeof parsedFiles[0] === "object" && (parsedFiles[0].name || parsedFiles[0].path)) {
            const objs = parsedFiles.map((p) => ({
              name: p.name ?? p.path,
              size: typeof p.size === "number" ? p.size : 0
            }));
            return objs.sort((a, b) => a.name.localeCompare(b.name));
          }
          const files = parsedFiles;
          return files.sort();
        }
      }
    }
  } catch (e) {
  }
  return null;
}
async function getFileSizesFromPng(pngBuf) {
  try {
    const res = await decodePngToBinary(pngBuf, { showProgress: false });
    if (res && res.files) {
      const map = {};
      for (const f of res.files)
        map[f.path] = f.buf.length;
      return map;
    }
    if (res && res.buf) {
      const unpack = unpackBuffer(res.buf);
      if (unpack) {
        const map = {};
        for (const f of unpack.files)
          map[f.path] = f.buf.length;
        return map;
      }
    }
  } catch (e) {
  }
  return null;
}
async function hasPassphraseInPng(pngBuf) {
  try {
    if (pngBuf.slice(0, MAGIC.length).equals(MAGIC)) {
      let offset = MAGIC.length;
      if (offset >= pngBuf.length)
        return false;
      const nameLen = pngBuf.readUInt8(offset);
      offset += 1 + nameLen;
      if (offset >= pngBuf.length)
        return false;
      const flag = pngBuf[offset];
      return flag === ENC_AES || flag === ENC_XOR;
    }
    try {
      const chunksRaw = native.extractPngChunks(pngBuf);
      const target = chunksRaw.find((c) => c.name === CHUNK_TYPE);
      if (target) {
        const data = Buffer.isBuffer(target.data) ? target.data : Buffer.from(target.data);
        if (data.length >= 1) {
          const nameLen = data.readUInt8(0);
          const payloadStart = 1 + nameLen;
          if (payloadStart < data.length) {
            const flag = data[payloadStart];
            return flag === ENC_AES || flag === ENC_XOR;
          }
        }
      }
    } catch (e) {
    }
    try {
      const rawData = native.sharpToRaw(pngBuf);
      const rawRGB = Buffer.from(rawData.pixels);
      const markerLen = MARKER_COLORS.length * 3;
      for (let i = 0; i <= rawRGB.length - markerLen; i += 3) {
        let ok = true;
        for (let m = 0; m < MARKER_COLORS.length; m++) {
          const j = i + m * 3;
          if (rawRGB[j] !== MARKER_COLORS[m].r || rawRGB[j + 1] !== MARKER_COLORS[m].g || rawRGB[j + 2] !== MARKER_COLORS[m].b) {
            ok = false;
            break;
          }
        }
        if (!ok)
          continue;
        const headerStart = i + markerLen;
        if (headerStart + PIXEL_MAGIC.length >= rawRGB.length)
          continue;
        if (!rawRGB.slice(headerStart, headerStart + PIXEL_MAGIC.length).equals(PIXEL_MAGIC))
          continue;
        const metaStart = headerStart + PIXEL_MAGIC.length;
        if (metaStart + 2 >= rawRGB.length)
          continue;
        const nameLen = rawRGB[metaStart + 1];
        const payloadLenOff = metaStart + 2 + nameLen;
        const payloadStart = payloadLenOff + 4;
        if (payloadStart >= rawRGB.length)
          continue;
        const flag = rawRGB[payloadStart];
        return flag === ENC_AES || flag === ENC_XOR;
      }
    } catch (e) {
    }
    try {
      await decodePngToBinary(pngBuf, { showProgress: false });
      return false;
    } catch (e) {
      if (e instanceof PassphraseRequiredError)
        return true;
      if (e.message && e.message.toLowerCase().includes("passphrase"))
        return true;
      return false;
    }
  } catch (e) {
    return false;
  }
}

// node_modules/roxify/dist/minpng.js
var nativeZstdCompress2 = null;
var nativeZstdDecompress2 = null;
var nativeEncodePngChunks = null;
try {
  if (native?.nativeZstdCompress) {
    nativeZstdCompress2 = native.nativeZstdCompress;
  }
  if (native?.nativeZstdDecompress) {
    nativeZstdDecompress2 = native.nativeZstdDecompress;
  }
  if (native?.encodePngChunks) {
    nativeEncodePngChunks = native.encodePngChunks;
  }
} catch (e) {
}
var PIXEL_MAGIC2 = Buffer.from("MNPG");
var MARKER_START2 = [
  { r: 255, g: 0, b: 0 },
  { r: 0, g: 255, b: 0 },
  { r: 0, b: 0, g: 255 }
];
var MARKER_END2 = [...MARKER_START2].reverse();

// node_modules/roxify/dist/stub-progress.js
var SingleBar = class {
  constructor(...args) {
  }
  start(...args) {
  }
  update(...args) {
  }
  stop(...args) {
  }
};
var Presets = {
  shades_classic: {}
};

// node_modules/roxify/dist/utils/rust-cli-wrapper.js
var import_child_process = require("child_process");
var import_fs3 = require("fs");
var import_path3 = require("path");
var import_url2 = require("url");
var __filename2 = __filename;
var __dirname2 = (0, import_path3.dirname)(__filename2);
function findRustBinary() {
  const candidates = [];
  const binNames = process.platform === "win32" ? ["roxify-cli.exe", "roxify_cli.exe", "roxify_native.exe"] : ["roxify-cli", "roxify_cli", "roxify_native"];
  const relativeDirs = [
    (0, import_path3.join)(__dirname2, "..", "..", "target", "release"),
    (0, import_path3.join)(__dirname2, "..", "..", "dist"),
    (0, import_path3.join)(__dirname2, ".."),
    (0, import_path3.join)(__dirname2, "..", "..")
  ];
  for (const dir of relativeDirs) {
    for (const name of binNames) {
      candidates.push((0, import_path3.join)(dir, name));
    }
  }
  if (process.platform !== "win32") {
    candidates.push("/usr/local/bin/roxify_native");
    candidates.push("/usr/bin/roxify_native");
  }
  for (const p of candidates) {
    try {
      if ((0, import_fs3.existsSync)(p))
        return p;
    } catch (e) {
    }
  }
  try {
    const which = process.platform === "win32" ? "where" : "which";
    const { execSync } = require("child_process");
    for (const name of binNames) {
      try {
        const out = execSync(`${which} ${name}`, { encoding: "utf-8" }).split("\n")[0].trim();
        if (out && (0, import_fs3.existsSync)(out))
          return out;
      } catch (e) {
      }
    }
  } catch (e) {
  }
  return null;
}
function isRustBinaryAvailable() {
  return findRustBinary() !== null;
}
async function encodeWithRustCLI(inputPath, outputPath, compressionLevel = 3, passphrase, encryptType = "aes", name) {
  const cliPath = findRustBinary();
  if (!cliPath) {
    throw new Error("Rust CLI binary not found. Run: cargo build --release");
  }
  return new Promise((resolve3, reject) => {
    const args = ["encode", "--level", String(compressionLevel)];
    if (name) {
      args.push("--name", name);
    }
    if (passphrase) {
      args.push("--passphrase", passphrase);
      args.push("--encrypt", encryptType);
    }
    args.push(inputPath, outputPath);
    const proc = (0, import_child_process.spawn)(cliPath, args);
    let stderr = "";
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn Rust CLI: ${err.message}`));
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve3();
      } else {
        reject(new Error(`Rust CLI exited with code ${code}: ${stderr}`));
      }
    });
  });
}

// node_modules/roxify/dist/cli.js
var VERSION = "1.4.0";
async function readLargeFile(filePath) {
  const st = (0, import_fs4.statSync)(filePath);
  if (st.size <= 2 * 1024 * 1024 * 1024) {
    return (0, import_fs4.readFileSync)(filePath);
  }
  const chunkSize = 64 * 1024 * 1024;
  const chunks = [];
  let position = 0;
  const fd = await (0, import_promises2.open)(filePath, "r");
  try {
    while (position < st.size) {
      const currentChunkSize = Math.min(chunkSize, st.size - position);
      const buffer = Buffer.alloc(currentChunkSize);
      const { bytesRead } = await fd.read(buffer, 0, currentChunkSize, position);
      chunks.push(buffer.slice(0, bytesRead));
      position += bytesRead;
    }
  } finally {
    await fd.close();
  }
  return Buffer.concat(chunks);
}
function showHelp() {
  console.log(`
ROX CLI \u2014 Encode/decode binary in PNG

Usage:
  npx rox <command> [options]

Commands:
  encode <input>... [output]   Encode one or more files/directories into a PNG
  decode <input> [output]   Decode PNG to original file
  list <input>               List files in a Rox PNG archive
  havepassphrase <input>     Check whether the PNG requires a passphrase

Options:
  -p, --passphrase <pass>   Use passphrase (AES-256-GCM)
  -m, --mode <mode>         Mode: screenshot (default)
  -e, --encrypt <type>      auto|aes|xor|none
  --no-compress             Disable compression
  --force-ts                Force TypeScript encoder (slower but supports encryption)
  -o, --output <path>       Output file path
  -s, --sizes               Show file sizes in 'list' output (default)
  --no-sizes                Disable file size reporting in 'list'
  --files <list>            Extract only specified files (comma-separated)
  --view-reconst            Export the reconstituted PNG for debugging
  --debug                   Export debug images (doubled.png, reconstructed.png)
  -v, --verbose             Show detailed errors

Run "npx rox help" for this message.
`);
}
function parseArgs(args) {
  const parsed = { _: [] };
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (key === "no-compress") {
        parsed.noCompress = true;
        i++;
      } else if (key === "verbose") {
        parsed.verbose = true;
        i++;
      } else if (key === "view-reconst") {
        parsed.viewReconst = true;
        i++;
      } else if (key === "sizes") {
        parsed.sizes = true;
        i++;
      } else if (key === "no-sizes") {
        parsed.sizes = false;
        i++;
      } else if (key === "debug") {
        parsed.debug = true;
        i++;
      } else if (key === "force-ts") {
        parsed.forceTs = true;
        i++;
      } else if (key === "debug-dir") {
        parsed.debugDir = args[i + 1];
        i += 2;
      } else if (key === "files") {
        parsed.files = args[i + 1].split(",");
        i += 2;
      } else {
        const value = args[i + 1];
        parsed[key] = value;
        i += 2;
      }
    } else if (arg.startsWith("-")) {
      const flag = arg.slice(1);
      const value = args[i + 1];
      switch (flag) {
        case "p":
          parsed.passphrase = value;
          i += 2;
          break;
        case "m":
          i += 2;
          break;
        case "e":
          parsed.encrypt = value;
          i += 2;
          break;
        case "o":
          parsed.output = value;
          i += 2;
          break;
        case "v":
          parsed.verbose = true;
          i += 1;
          break;
        case "s":
          parsed.sizes = true;
          i += 1;
          break;
          break;
        case "d":
          parsed.debugDir = value;
          i += 2;
          break;
        default:
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
      }
    } else {
      parsed._.push(arg);
      i++;
    }
  }
  return parsed;
}
async function encodeCommand(args) {
  const parsed = parseArgs(args);
  const inputPaths = parsed.output ? parsed._ : parsed._.length > 1 ? parsed._.slice(0, -1) : parsed._;
  const outputPath = parsed.output ? void 0 : parsed._.length > 1 ? parsed._[parsed._.length - 1] : void 0;
  const firstInput = inputPaths[0];
  if (!firstInput) {
    console.log(" ");
    console.error("Error: Input file required");
    console.log("Usage: npx rox encode <input> [output] [options]");
    process.exit(1);
  }
  let safeCwd = "/";
  try {
    safeCwd = process.cwd();
  } catch (e) {
    safeCwd = "/";
  }
  const resolvedInputs = inputPaths.map((p) => (0, import_path4.resolve)(safeCwd, p));
  let outputName = inputPaths.length === 1 ? (0, import_path4.basename)(firstInput) : "archive";
  if (inputPaths.length === 1 && !(0, import_fs4.statSync)(resolvedInputs[0]).isDirectory()) {
    outputName = outputName.replace(/(\.[^.]+)?$/, ".png");
  } else {
    outputName += ".png";
  }
  let resolvedOutput;
  try {
    resolvedOutput = (0, import_path4.resolve)(safeCwd, parsed.output || outputPath || outputName);
  } catch (e) {
    resolvedOutput = (0, import_path4.join)("/", parsed.output || outputPath || outputName);
  }
  if (isRustBinaryAvailable() && !parsed.forceTs) {
    try {
      console.log(`Encoding to ${resolvedOutput} (Using native Rust encoder)
`);
      const startTime = Date.now();
      const encodeBar = new SingleBar({ format: " {bar} {percentage}% | {step} | {elapsed}s" }, Presets.shades_classic);
      let barValue = 0;
      encodeBar.start(100, 0, { step: "Encoding", elapsed: "0" });
      const progressInterval = setInterval(() => {
        barValue = Math.min(barValue + 1, 99);
        const elapsed = Math.floor((Date.now() - startTime) / 1e3);
        encodeBar.update(barValue, {
          step: "Encoding",
          elapsed: String(elapsed)
        });
      }, 500);
      const encryptType = parsed.encrypt === "xor" ? "xor" : "aes";
      const fileName = (0, import_path4.basename)(inputPaths[0]);
      await encodeWithRustCLI(inputPaths.length === 1 ? resolvedInputs[0] : resolvedInputs[0], resolvedOutput, 12, parsed.passphrase, encryptType, fileName);
      clearInterval(progressInterval);
      const encodeTime = Date.now() - startTime;
      encodeBar.update(100, {
        step: "done",
        elapsed: String(Math.floor(encodeTime / 1e3))
      });
      encodeBar.stop();
      const { statSync: fstatSync } = await import("fs");
      let inputSize = 0;
      if (inputPaths.length === 1 && fstatSync(resolvedInputs[0]).isDirectory()) {
        const { execSync } = await import("child_process");
        const sizeOutput = execSync(`du -sb "${resolvedInputs[0]}"`, {
          encoding: "utf-8"
        });
        inputSize = parseInt(sizeOutput.split(/\s+/)[0]);
      } else {
        inputSize = fstatSync(resolvedInputs[0]).size;
      }
      const outputSize = fstatSync(resolvedOutput).size;
      const ratio = (outputSize / inputSize * 100).toFixed(1);
      console.log(`
Success!`);
      console.log(`  Input:  ${(inputSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Output: ${(outputSize / 1024 / 1024).toFixed(2)} MB (${ratio}% of original)`);
      console.log(`  Time:   ${encodeTime}ms`);
      console.log(`  Saved:  ${resolvedOutput}`);
      console.log(" ");
      return;
    } catch (err) {
      console.warn("\nRust encoder failed, falling back to TypeScript encoder...");
      console.warn(`Reason: ${err.message}
`);
    }
  }
  let options = {};
  try {
    const encodeBar = new SingleBar({
      format: " {bar} {percentage}% | {step} | {elapsed}s"
    }, Presets.shades_classic);
    let barStarted = false;
    const startEncode = Date.now();
    let currentEncodeStep = "Starting";
    let displayedPct = 0;
    let targetPct = 0;
    const TICK_MS = 100;
    const PCT_STEP = 1;
    const encodeHeartbeat = setInterval(() => {
      const elapsed = Date.now() - startEncode;
      if (!barStarted) {
        encodeBar.start(100, Math.floor(displayedPct), {
          step: currentEncodeStep,
          elapsed: "0"
        });
        barStarted = true;
      }
      if (displayedPct < targetPct) {
        displayedPct = Math.min(displayedPct + PCT_STEP, targetPct);
      } else if (displayedPct < 99) {
        displayedPct = Math.min(displayedPct + PCT_STEP, 99);
      }
      encodeBar.update(Math.floor(displayedPct), {
        step: currentEncodeStep,
        elapsed: String(Math.floor(elapsed / 1e3))
      });
    }, TICK_MS);
    const mode = "screenshot";
    Object.assign(options, {
      mode,
      name: parsed.outputName || "archive",
      skipOptimization: false,
      compressionLevel: 12,
      outputFormat: "auto"
    });
    if (parsed.verbose)
      options.verbose = true;
    if (parsed.noCompress)
      options.compression = "none";
    if (parsed.passphrase) {
      options.passphrase = parsed.passphrase;
      options.encrypt = parsed.encrypt || "aes";
    }
    console.log(`Encoding to ${resolvedOutput} (Mode: ${mode})
`);
    let inputData;
    let inputSizeVal = 0;
    let displayName;
    let totalBytes = 0;
    const onProgress = (readBytes, total, currentFile) => {
      if (totalBytes === 0)
        totalBytes = total;
      const packPct = Math.floor(readBytes / totalBytes * 25);
      targetPct = Math.max(targetPct, packPct);
      currentEncodeStep = currentFile ? `Reading files: ${currentFile}` : "Reading files";
    };
    if (inputPaths.length > 1) {
      currentEncodeStep = "Reading files";
      const { index, stream, totalSize } = await packPathsGenerator(inputPaths, void 0, onProgress);
      inputData = stream;
      inputSizeVal = totalSize;
      displayName = parsed.outputName || "archive";
      options.includeFileList = true;
      options.fileList = index.map((e) => ({
        name: e.path,
        size: e.size
      }));
    } else {
      const resolvedInput = resolvedInputs[0];
      const st = (0, import_fs4.statSync)(resolvedInput);
      if (st.isDirectory()) {
        currentEncodeStep = "Reading files";
        const { index, stream, totalSize } = await packPathsGenerator([resolvedInput], (0, import_path4.dirname)(resolvedInput), onProgress);
        inputData = stream;
        inputSizeVal = totalSize;
        displayName = parsed.outputName || (0, import_path4.basename)(resolvedInput);
        options.includeFileList = true;
        options.fileList = index.map((e) => ({
          name: e.path,
          size: e.size
        }));
      } else {
        inputData = await readLargeFile(resolvedInput);
        inputSizeVal = inputData.length;
        displayName = (0, import_path4.basename)(resolvedInput);
        options.includeFileList = true;
        options.fileList = [{ name: (0, import_path4.basename)(resolvedInput), size: st.size }];
      }
    }
    options.name = displayName;
    options.onProgress = (info) => {
      let stepLabel = "Processing";
      let pct = 0;
      if (info.phase === "compress_start") {
        pct = 25;
        stepLabel = "Compressing";
      } else if (info.phase === "compress_progress") {
        pct = 25 + Math.floor(info.loaded / info.total * 50);
        stepLabel = "Compressing";
      } else if (info.phase === "compress_done") {
        pct = 75;
        stepLabel = "Compressed";
      } else if (info.phase === "encrypt_start") {
        pct = 76;
        stepLabel = "Encrypting";
      } else if (info.phase === "encrypt_done") {
        pct = 80;
        stepLabel = "Encrypted";
      } else if (info.phase === "meta_prep_done") {
        pct = 82;
        stepLabel = "Preparing";
      } else if (info.phase === "png_gen") {
        if (info.loaded !== void 0 && info.total !== void 0) {
          pct = 82 + Math.floor(info.loaded / info.total * 16);
        } else {
          pct = 98;
        }
        stepLabel = "Generating PNG";
      } else if (info.phase === "optimizing") {
        if (info.loaded !== void 0 && info.total !== void 0) {
          pct = 82 + Math.floor(info.loaded / info.total * 18);
        } else {
          pct = 98;
        }
        stepLabel = "Optimizing PNG";
      } else if (info.phase === "done") {
        pct = 100;
        stepLabel = "Done";
      }
      targetPct = Math.max(targetPct, pct);
      currentEncodeStep = stepLabel;
    };
    let inputBuffer;
    if (typeof inputData[Symbol.asyncIterator] === "function") {
      const chunks = [];
      for await (const chunk of inputData) {
        chunks.push(chunk);
      }
      inputBuffer = chunks;
    } else {
      inputBuffer = inputData;
    }
    const output = await encodeBinaryToPng(inputBuffer, options);
    const encodeTime = Date.now() - startEncode;
    clearInterval(encodeHeartbeat);
    if (barStarted) {
      encodeBar.update(100, {
        step: "done",
        elapsed: String(Math.floor(encodeTime / 1e3))
      });
      encodeBar.stop();
    }
    (0, import_fs4.writeFileSync)(resolvedOutput, output);
    const outputSize = (output.length / 1024 / 1024).toFixed(2);
    const inputSize = (inputSizeVal / 1024 / 1024).toFixed(2);
    const ratio = (output.length / inputSizeVal * 100).toFixed(1);
    console.log(`
Success!`);
    console.log(`  Input:  ${inputSize} MB`);
    console.log(`  Output: ${outputSize} MB (${ratio}% of original)`);
    console.log(`  Time:   ${encodeTime}ms`);
    console.log(`  Saved:  ${resolvedOutput}`);
    console.log(" ");
  } catch (err) {
    console.log(" ");
    console.error("Error: Failed to encode file. Use --verbose for details.");
    if (parsed.verbose)
      console.error("Details:", err.stack || err.message);
    process.exit(1);
  }
}
async function decodeCommand(args) {
  const parsed = parseArgs(args);
  const [inputPath, outputPath] = parsed._;
  if (!inputPath) {
    console.log(" ");
    console.error("Error: Input PNG file required");
    console.log("Usage: npx rox decode <input> [output] [options]");
    process.exit(1);
  }
  const resolvedInput = (0, import_path4.resolve)(inputPath);
  const resolvedOutput = parsed.output || outputPath || "decoded.bin";
  try {
    const options = {};
    if (parsed.passphrase) {
      options.passphrase = parsed.passphrase;
    }
    if (parsed.debug) {
      options.debugDir = (0, import_path4.dirname)(resolvedInput);
    }
    if (parsed.files) {
      options.files = parsed.files;
    }
    console.log(" ");
    console.log(`Decoding...`);
    console.log(" ");
    const decodeBar = new SingleBar({
      format: " {bar} {percentage}% | {step} | {elapsed}s"
    }, Presets.shades_classic);
    let barStarted = false;
    const startDecode = Date.now();
    let currentPct = 0;
    let targetPct = 0;
    let currentStep = "Decoding";
    const heartbeat = setInterval(() => {
      if (currentPct < targetPct) {
        currentPct = Math.min(currentPct + 2, targetPct);
      }
      if (!barStarted && targetPct > 0) {
        decodeBar.start(100, Math.floor(currentPct), {
          step: currentStep,
          elapsed: String(Math.floor((Date.now() - startDecode) / 1e3))
        });
        barStarted = true;
      } else if (barStarted) {
        decodeBar.update(Math.floor(currentPct), {
          step: currentStep,
          elapsed: String(Math.floor((Date.now() - startDecode) / 1e3))
        });
      }
    }, 100);
    options.onProgress = (info) => {
      if (info.phase === "decompress_start") {
        targetPct = 50;
        currentStep = "Decompressing";
      } else if (info.phase === "decompress_progress" && info.loaded && info.total) {
        targetPct = 50 + Math.floor(info.loaded / info.total * 40);
        currentStep = `Decompressing (${info.loaded}/${info.total})`;
      } else if (info.phase === "decompress_done") {
        targetPct = 90;
        currentStep = "Decompressed";
      } else if (info.phase === "done") {
        targetPct = 100;
        currentStep = "Done";
      }
    };
    const inputBuffer = await readLargeFile(resolvedInput);
    const result = await decodePngToBinary(inputBuffer, options);
    const decodeTime = Date.now() - startDecode;
    clearInterval(heartbeat);
    if (barStarted) {
      currentPct = 100;
      decodeBar.update(100, {
        step: "done",
        elapsed: String(Math.floor(decodeTime / 1e3))
      });
      decodeBar.stop();
    }
    if (result.files) {
      const baseDir = parsed.output || outputPath || ".";
      const totalBytes = result.files.reduce((s, f) => s + f.buf.length, 0);
      const extractBar = new SingleBar({ format: " {bar} {percentage}% | {step} | {elapsed}s" }, Presets.shades_classic);
      const extractStart = Date.now();
      extractBar.start(totalBytes, 0, { step: "Writing files", elapsed: "0" });
      let written = 0;
      for (const file of result.files) {
        const fullPath = (0, import_path4.join)(baseDir, file.path);
        const dir = (0, import_path4.dirname)(fullPath);
        (0, import_fs4.mkdirSync)(dir, { recursive: true });
        (0, import_fs4.writeFileSync)(fullPath, file.buf);
        written += file.buf.length;
        extractBar.update(written, {
          step: `Writing ${file.path}`,
          elapsed: String(Math.floor((Date.now() - extractStart) / 1e3))
        });
      }
      extractBar.update(totalBytes, {
        step: "Done",
        elapsed: String(Math.floor((Date.now() - extractStart) / 1e3))
      });
      extractBar.stop();
      console.log(`
Success!`);
      console.log(`Unpacked ${result.files.length} files to directory : ${(0, import_path4.resolve)(baseDir)}`);
      console.log(`Time: ${decodeTime}ms`);
    } else if (result.buf) {
      const unpacked = unpackBuffer(result.buf);
      if (unpacked) {
        const baseDir = parsed.output || outputPath || ".";
        for (const file of unpacked.files) {
          const fullPath = (0, import_path4.join)(baseDir, file.path);
          const dir = (0, import_path4.dirname)(fullPath);
          (0, import_fs4.mkdirSync)(dir, { recursive: true });
          (0, import_fs4.writeFileSync)(fullPath, file.buf);
        }
        console.log(`
Success!`);
        console.log(`Time: ${decodeTime}ms`);
        console.log(`Unpacked ${unpacked.files.length} files to current directory`);
      } else {
        let finalOutput = resolvedOutput;
        if (!parsed.output && !outputPath && result.meta?.name) {
          finalOutput = result.meta.name;
        }
        (0, import_fs4.writeFileSync)(finalOutput, result.buf);
        console.log(`
Success!`);
        if (result.meta?.name) {
          console.log(`  Original name: ${result.meta.name}`);
        }
        const outputSize = (result.buf.length / 1024 / 1024).toFixed(2);
        console.log(`  Output size:   ${outputSize} MB`);
        console.log(`  Time:          ${decodeTime}ms`);
        console.log(`  Saved:         ${finalOutput}`);
      }
    } else {
      console.log(`
Success!`);
      console.log(`Time: ${decodeTime}ms`);
    }
    console.log(" ");
  } catch (err) {
    if (err instanceof PassphraseRequiredError || err.message && err.message.includes("passphrase") && !parsed.passphrase) {
      console.log(" ");
      console.error("File appears to be encrypted. Provide a passphrase with -p");
    } else if (err instanceof IncorrectPassphraseError || err.message && err.message.includes("Incorrect passphrase")) {
      console.log(" ");
      console.error("Incorrect passphrase");
    } else if (err instanceof DataFormatError || err.message && (err.message.includes("decompression failed") || err.message.includes("missing ROX1") || err.message.includes("Pixel payload truncated") || err.message.includes("Marker START not found"))) {
      console.log(" ");
      console.error("Data corrupted or unsupported format. Use --verbose for details.");
    } else {
      console.log(" ");
      console.error("Failed to decode file. Use --verbose for details.");
    }
    if (parsed.verbose) {
      console.error("Details:", err.stack || err.message);
    }
    process.exit(1);
  }
}
async function listCommand(args) {
  const parsed = parseArgs(args);
  const [inputPath] = parsed._;
  if (!inputPath) {
    console.log(" ");
    console.error("Error: Input PNG file required");
    console.log("Usage: npx rox list <input>");
    process.exit(1);
  }
  const resolvedInput = (0, import_path4.resolve)(inputPath);
  try {
    const inputBuffer = (0, import_fs4.readFileSync)(resolvedInput);
    const fileList = await listFilesInPng(inputBuffer, {
      includeSizes: parsed.sizes !== false
    });
    if (fileList) {
      console.log(`Files in ${resolvedInput}:`);
      for (const file of fileList) {
        if (typeof file === "string") {
          console.log(`  ${file}`);
        } else {
          console.log(`  ${file.name} (${file.size} bytes)`);
        }
      }
    } else {
      console.log("No file list found in the archive.");
    }
  } catch (err) {
    console.log(" ");
    console.error("Failed to list files. Use --verbose for details.");
    if (parsed.verbose) {
      console.error("Details:", err.stack || err.message);
    }
    process.exit(1);
  }
}
async function havePassphraseCommand(args) {
  const parsed = parseArgs(args);
  const [inputPath] = parsed._;
  if (!inputPath) {
    console.log(" ");
    console.error("Error: Input PNG file required");
    console.log("Usage: npx rox havepassphrase <input>");
    process.exit(1);
  }
  const resolvedInput = (0, import_path4.resolve)(inputPath);
  try {
    const inputBuffer = (0, import_fs4.readFileSync)(resolvedInput);
    const has = await hasPassphraseInPng(inputBuffer);
    console.log(has ? "Passphrase detected." : "No passphrase detected.");
  } catch (err) {
    console.log(" ");
    console.error("Failed to check passphrase. Use --verbose for details.");
    if (parsed.verbose)
      console.error("Details:", err.stack || err.message);
    process.exit(1);
  }
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "help" || args[0] === "--help") {
    showHelp();
    return;
  }
  if (args[0] === "version" || args[0] === "--version") {
    console.log(VERSION);
    return;
  }
  const command = args[0];
  const commandArgs = args.slice(1);
  switch (command) {
    case "encode":
      await encodeCommand(commandArgs);
      break;
    case "decode":
      await decodeCommand(commandArgs);
      break;
    case "list":
      await listCommand(commandArgs);
      break;
    case "havepassphrase":
      await havePassphraseCommand(commandArgs);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run "npx rox help" for usage information');
      process.exit(1);
  }
}
main().catch((err) => {
  console.log(" ");
  console.error("Fatal error:", err);
  process.exit(1);
});
