// Vite derives these bounds from matching files in public/ at startup/build time.
export const FRAME_COUNT = Number(import.meta.env.VITE_FRAME_COUNT ?? 983);
export const FRAME_START = Number(import.meta.env.VITE_FRAME_START ?? 0);
export const getFramePath = (index) => `/frame_${String(index).padStart(4, '0')}.webp`;

const CONCURRENCY = 4;
// Must exceed App's LOOP_FRAMES so the looping ending stays decoded.
const CACHE_LIMIT = 40;

class FrameLoader {
  constructor() {
    this.images = new Array(FRAME_COUNT).fill(null);
    this.loadedCount = 0;
    this.onProgressCallback = null;
    this.queue = [];
    this.queued = new Set();
    this.failed = new Set();
    this.active = 0;
    this.targetIndex = FRAME_START;
    this.pending = new Map();
  }

  loadFrame(index) {
    if (index < FRAME_START || index >= FRAME_START + FRAME_COUNT) return Promise.resolve(null);
    const offset = index - FRAME_START;
    if (this.images[offset]) return Promise.resolve(this.images[offset]);
    if (this.failed.has(index)) return Promise.resolve(null);
    if (this.pending.has(index)) return this.pending.get(index);

    const promise = new Promise((resolve) => {
      this.pending.set(index, resolve);
      this.queue.push(index);
      this.queued.add(index);
      this.pump();
    });
    return promise;
  }

  pump() {
    while (this.active < CONCURRENCY && this.queue.length > 0) {
      this.queue.sort((a, b) => Math.abs(a - this.targetIndex) - Math.abs(b - this.targetIndex));
      const index = this.queue.shift();
      this.queued.delete(index);
      const offset = index - FRAME_START;
      if (this.images[offset] || this.failed.has(index)) {
        this.pending.get(index)?.(this.images[offset] ?? null);
        this.pending.delete(index);
        continue;
      }

      this.active += 1;
      const image = new Image();
      image.decoding = 'async';
      image.onload = async () => {
        try {
          if (image.decode) await image.decode();
        } catch {
          // Some browsers reject decode() after a successful load; it remains drawable.
        }
        this.images[offset] = image;
        this.loadedCount += 1;
        this.onProgressCallback?.(this.loadedCount, FRAME_COUNT);
        this.pending.get(index)?.(image);
        this.pending.delete(index);
        this.active -= 1;
        this.trimCache();
        this.pump();
      };
      image.onerror = () => {
        this.failed.add(index);
        this.pending.get(index)?.(null);
        this.pending.delete(index);
        this.active -= 1;
        this.pump();
      };
      image.src = getFramePath(index);
    }
  }

  trimCache() {
    const loaded = [];
    this.images.forEach((image, offset) => {
      if (image) loaded.push(offset + FRAME_START);
    });
    if (loaded.length <= CACHE_LIMIT) return;
    loaded
      .sort((a, b) => Math.abs(b - this.targetIndex) - Math.abs(a - this.targetIndex))
      .slice(0, loaded.length - CACHE_LIMIT)
      .forEach((index) => { this.images[index - FRAME_START] = null; });
  }

  async preloadInitial(count = 12) {
    await Promise.all(
      Array.from({ length: Math.min(count, FRAME_COUNT) }, (_, offset) => this.loadFrame(FRAME_START + offset)),
    );
    // Queue the rest at low priority; nearby frames jump the queue as the scroll target changes.
    for (let index = FRAME_START + count; index < FRAME_START + FRAME_COUNT; index += 1) {
      if (!this.images[index - FRAME_START] && !this.failed.has(index) && !this.queued.has(index)) {
        this.queue.push(index);
        this.queued.add(index);
      }
    }
    this.pump();
  }

  setTargetFrame(index) {
    this.targetIndex = Math.max(FRAME_START, Math.min(FRAME_START + FRAME_COUNT - 1, index));
    const radius = window.matchMedia('(max-width: 700px)').matches ? 8 : 14;
    for (let frame = Math.max(FRAME_START, index - radius); frame <= Math.min(FRAME_START + FRAME_COUNT - 1, index + radius); frame += 1) {
      if (!this.images[frame - FRAME_START] && !this.failed.has(frame) && !this.queued.has(frame)) {
        this.queue.push(frame);
        this.queued.add(frame);
      }
    }
    this.trimCache();
    this.pump();
  }

  getFrame(index) {
    return this.images[index - FRAME_START] ?? null;
  }

  onProgress(callback) {
    this.onProgressCallback = callback;
  }
}

let loaderInstance = null;

export const getFrameLoader = () => {
  if (!loaderInstance) loaderInstance = new FrameLoader();
  return loaderInstance;
};
