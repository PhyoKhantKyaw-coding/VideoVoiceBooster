import { FFmpeg } from '@ffmpeg/ffmpeg'
import type { LogEvent, ProgressEvent } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import coreURL from '@ffmpeg/core?url'
import wasmURL from '@ffmpeg/core/wasm?url'
import { DEFAULT_CUSTOM_SETTINGS } from '../types/video'
import type {
  CustomAudioSettings,
  EnhancementMode,
  ProcessParams,
  ProcessResult,
} from '../types/video'

const OUTPUT_NAME = 'output.mp4'
const MAP_AUDIO_VIDEO = ['-map', '0:v:0?', '-map', '0:a:0?']
const MAP_VIDEO_ONLY = ['-map', '0:v:0?']

let ffmpeg: FFmpeg | null = null
let loadPromise: Promise<FFmpeg> | null = null

export function getFFmpeg(): FFmpeg {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg()
  }
  return ffmpeg
}

export async function ensureFFmpegLoaded(): Promise<FFmpeg> {
  const instance = getFFmpeg()
  if (instance.loaded) return instance
  if (!loadPromise) {
    loadPromise = instance
      .load({ coreURL, wasmURL })
      .then(() => instance)
      .finally(() => {
        loadPromise = null
      })
  }
  return loadPromise
}

function pickExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (/^(mp4|m4v|webm|mov|mkv)$/.test(fromName)) return fromName
  if (file.type === 'video/webm') return 'webm'
  if (file.type === 'video/quicktime') return 'mov'
  return 'mp4'
}

const LIMITER = 'alimiter=limit=0.98'
const AUDIO_BITRATE = '192k'

function volumeFilter(gain: number): string {
  const safe = Number.isFinite(gain) ? gain : 1
  return `volume=${safe.toFixed(2)}`
}

// Voice-first chain: trim rumble, fix muddy/boxy mids, lift presence, even out
// dynamics, then apply the user gain and cap peaks so it cannot clip.
function clarityChain(gain: number): string {
  return [
    'highpass=f=80',
    'equalizer=f=300:t=q:w=1:g=-2',
    'equalizer=f=3000:t=q:w=1:g=3',
    'acompressor=threshold=-18dB:ratio=3:attack=5:release=120:makeup=1.5',
    volumeFilter(gain),
    LIMITER,
  ].join(',')
}

// Maximum loudness: lift quiet speech with dynamic normalization, then push the
// whole track toward full scale and cap peaks. Strongest, most compressed option.
function maximizeChain(gain: number): string {
  return [
    'highpass=f=60',
    'equalizer=f=250:t=q:w=1:g=-2',
    'equalizer=f=3200:t=q:w=1:g=5',
    'dynaudnorm=f=150:g=11:p=0.97:m=20',
    'acompressor=threshold=-30dB:ratio=6:attack=6:release=200:makeup=3',
    volumeFilter(gain),
    LIMITER,
  ].join(',')
}

// Builds an arbitrary chain from the user's custom settings. Order matches the
// UI: cleanup -> tone -> dynamics -> loudness -> boost -> limiter -> fades.
function customChain(raw: CustomAudioSettings, gain: number, duration: number): string {
  const d = DEFAULT_CUSTOM_SETTINGS
  const s: CustomAudioSettings = { ...d, ...(raw ?? {}) }
  const num = (value: number | undefined, fallback: number): number =>
    Number.isFinite(value) ? (value as number) : fallback

  const voiceAmount = num(s.voiceAmount, d.voiceAmount)
  const denoiseAmount = num(s.denoiseAmount, d.denoiseAmount)
  const compressorAmount = num(s.compressorAmount, d.compressorAmount)
  const normalizeTarget = num(s.normalizeTarget, d.normalizeTarget)
  const limiterCeiling = num(s.limiterCeiling, d.limiterCeiling)
  const fadeIn = num(s.fadeIn, d.fadeIn)
  const fadeOut = num(s.fadeOut, d.fadeOut)
  const bass = num(s.bass, d.bass)
  const mid = num(s.mid, d.mid)
  const treble = num(s.treble, d.treble)
  const length = num(duration, 0)

  const parts: string[] = []

  if (s.voice) {
    parts.push('highpass=f=80')
    parts.push(`equalizer=f=3000:t=q:w=1:g=${voiceAmount.toFixed(1)}`)
  }
  if (s.denoise) {
    const nr = 6 + (denoiseAmount / 100) * 24
    const nf = -40 - (denoiseAmount / 100) * 30
    parts.push(`afftdn=nr=${nr.toFixed(1)}:nf=${nf.toFixed(1)}`)
  }
  if (bass !== 0) parts.push(`bass=g=${bass.toFixed(1)}:f=110:w=0.6`)
  if (mid !== 0) parts.push(`equalizer=f=1000:t=q:w=1:g=${mid.toFixed(1)}`)
  if (treble !== 0) parts.push(`treble=g=${treble.toFixed(1)}:f=3200:w=0.6`)
  if (s.compressor) {
    const ratio = 2 + (compressorAmount / 100) * 8
    parts.push(
      `acompressor=threshold=-24dB:ratio=${ratio.toFixed(1)}:attack=5:release=150:makeup=2`,
    )
  }
  if (s.normalize) {
    parts.push(`loudnorm=I=${normalizeTarget}:TP=-1.5:LRA=11`)
  }
  parts.push(volumeFilter(gain))
  if (s.limiter) {
    parts.push(`alimiter=limit=${limiterCeiling.toFixed(2)}`)
  }
  if (fadeIn > 0) {
    parts.push(`afade=t=in:st=0:d=${fadeIn}`)
  }
  if (fadeOut > 0 && length > 0) {
    const start = Math.max(0, length - fadeOut)
    parts.push(`afade=t=out:st=${start.toFixed(2)}:d=${fadeOut}`)
  }

  return parts.join(',')
}

interface ChainInput {
  mode: EnhancementMode
  gain: number
  custom?: CustomAudioSettings
  duration?: number
}

// Ordered filter chains to try. The selected mode leads; simpler, more widely
// supported chains follow so a missing filter degrades gracefully instead of failing.
function audioChains({ mode, gain, custom, duration = 0 }: ChainInput): string[] {
  const loud = [volumeFilter(gain), LIMITER].join(',')
  const raw = volumeFilter(gain)
  const clarity = clarityChain(gain)
  const maximize = maximizeChain(gain)
  const customGraph = custom ? customChain(custom, gain, duration) : raw

  const ordered =
    mode === 'raw'
      ? [raw]
      : mode === 'loud'
        ? [loud, raw]
        : mode === 'clarity'
          ? [clarity, loud, raw]
          : mode === 'custom'
            ? [customGraph, maximize, clarity, loud, raw]
            : [maximize, clarity, loud, raw]

  return [...new Set(ordered)]
}

function buildAttempts(inputName: string, chains: string[]): string[][] {
  const head = ['-hide_banner', '-i', inputName]
  const copyVideo = ['-c:v', 'copy']
  const x264Video = ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-pix_fmt', 'yuv420p']
  const tail = ['-movflags', '+faststart', OUTPUT_NAME]
  const audio = (chain: string) => ['-c:a', 'aac', '-b:a', AUDIO_BITRATE, '-af', chain]

  const attempts: string[][] = []

  // Try every chain with the original video stream first (no video quality loss).
  for (const chain of chains) {
    attempts.push([...head, ...MAP_AUDIO_VIDEO, ...copyVideo, ...audio(chain), ...tail])
  }
  // Still boosting, but re-encode video for sources MP4 cannot copy (e.g. VP8/VP9).
  for (const chain of chains) {
    attempts.push([...head, ...MAP_AUDIO_VIDEO, ...x264Video, ...audio(chain), ...tail])
  }
  // Last resort: video-only, for clips that carry no audio track at all.
  attempts.push([...head, ...MAP_VIDEO_ONLY, ...copyVideo, '-an', ...tail])
  attempts.push([...head, ...MAP_VIDEO_ONLY, ...x264Video, '-an', ...tail])

  return attempts
}

function describeFailure(recent: string[]): string {
  const line = [...recent]
    .reverse()
    .find(
      (message) =>
        /(error|invalid|failed|unable|not supported|no such|could not|conversion)/i.test(message) &&
        !/frame=\s*\d+/i.test(message),
    )
  const base = 'FFmpeg could not process this video.'
  return line ? `${base} Details: ${line.trim()}` : base
}

async function deleteIfExists(instance: FFmpeg, name: string): Promise<void> {
  try {
    await instance.deleteFile(name)
  } catch {
    // The file may not exist (for example after a cancellation).
  }
}

export async function boostVideo(params: ProcessParams): Promise<ProcessResult> {
  const { file, gain, mode, custom, duration, onProgress, onLog, onReady, signal } = params
  const instance = await ensureFFmpegLoaded()
  onReady?.()

  const inputName = `input.${pickExtension(file)}`
  const chains = audioChains({ mode, gain, custom, duration })
  const recent: string[] = []

  const logListener = ({ message }: LogEvent) => {
    onLog?.(message)
    recent.push(message)
    if (recent.length > 80) recent.shift()
  }
  const progressListener = ({ progress }: ProgressEvent) => onProgress?.(progress)

  instance.on('log', logListener)
  instance.on('progress', progressListener)

  try {
    await instance.writeFile(inputName, await fetchFile(file))

    const attempts = buildAttempts(inputName, chains)

    let exitCode = 1
    for (const args of attempts) {
      exitCode = await instance.exec(args, undefined, { signal })
      if (exitCode === 0) break
    }

    if (exitCode !== 0) {
      throw new Error(describeFailure(recent))
    }

    const data = await instance.readFile(OUTPUT_NAME)
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
    if (!bytes || bytes.length === 0) {
      throw new Error('The export file came back empty. Please try again.')
    }
    const blob = new Blob([bytes as BlobPart], { type: 'video/mp4' })
    return { blob, fileName: 'boosted-video.mp4' }
  } finally {
    instance.off('log', logListener)
    instance.off('progress', progressListener)
    await deleteIfExists(instance, inputName)
    await deleteIfExists(instance, OUTPUT_NAME)
  }
}

export function disposeFFmpeg(): void {
  if (ffmpeg) {
    try {
      ffmpeg.terminate()
    } catch {
      // The worker may already be gone.
    }
    ffmpeg = null
  }
  loadPromise = null
}
