export interface SelectedVideo {
  file: File
  url: string
  name: string
  size: number
  duration: number
  type: string
}

export type BoosterStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error'

export type EnhancementMode = 'maximize' | 'clarity' | 'loud' | 'raw' | 'custom'

export interface CustomAudioSettings {
  normalize: boolean
  normalizeTarget: number
  compressor: boolean
  compressorAmount: number
  denoise: boolean
  denoiseAmount: number
  voice: boolean
  voiceAmount: number
  bass: number
  mid: number
  treble: number
  limiter: boolean
  limiterCeiling: number
  fadeIn: number
  fadeOut: number
}

export const DEFAULT_CUSTOM_SETTINGS: CustomAudioSettings = {
  normalize: false,
  normalizeTarget: -16,
  compressor: true,
  compressorAmount: 40,
  denoise: false,
  denoiseAmount: 40,
  voice: true,
  voiceAmount: 4,
  bass: 0,
  mid: 0,
  treble: 0,
  limiter: true,
  limiterCeiling: 0.98,
  fadeIn: 0,
  fadeOut: 0,
}

export interface ExportResult {
  url: string
  blob: Blob
  fileName: string
  size: number
}

export interface ProcessParams {
  file: File
  gain: number
  mode: EnhancementMode
  custom?: CustomAudioSettings
  duration?: number
  onProgress?: (ratio: number) => void
  onLog?: (message: string) => void
  onReady?: () => void
  signal?: AbortSignal
}

export interface ProcessResult {
  blob: Blob
  fileName: string
}
