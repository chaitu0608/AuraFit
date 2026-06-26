#!/usr/bin/env node
/**
 * Generates PWA icons from public/icon.svg using sharp if available,
 * otherwise writes minimal placeholder PNGs.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outDir = resolve(root, 'public/icons')
const svgPath = resolve(root, 'public/icon.svg')

mkdirSync(outDir, { recursive: true })

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-512.png', size: 512 },
]

async function main() {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.warn('sharp not installed — writing SVG fallbacks as .png paths skipped')
    console.warn('Install sharp for PNG icons: npm i -D sharp')
    for (const { name } of sizes) {
      const dest = resolve(outDir, name)
      if (!existsSync(dest)) {
        writeFileSync(dest, readFileSync(svgPath))
      }
    }
    return
  }

  const svg = readFileSync(svgPath)
  for (const { name, size } of sizes) {
    await sharp(svg).resize(size, size).png().toFile(resolve(outDir, name))
    console.log(`Wrote ${name}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
