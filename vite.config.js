import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const publicDirectory = fileURLToPath(new URL('./public/', import.meta.url))
const frameIndices = readdirSync(publicDirectory)
  .map((filename) => filename.match(/^frame_(\d+)\.webp$/)?.[1])
  .filter((index) => index !== undefined)
  .map(Number)
  .sort((a, b) => a - b)
const frameStart = frameIndices[0] ?? 0
const frameCount = frameIndices.length

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_FRAME_START': JSON.stringify(frameStart),
    'import.meta.env.VITE_FRAME_COUNT': JSON.stringify(frameCount),
  },
})
