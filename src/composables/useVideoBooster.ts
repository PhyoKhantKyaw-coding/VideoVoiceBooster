import { computed, onBeforeUnmount, ref } from 'vue'
import { DEFAULT_CUSTOM_SETTINGS } from '../types/video'
import type {
  BoosterStatus,
  CustomAudioSettings,
  EnhancementMode,
  ExportResult,
  SelectedVideo,
} from '../types/video'
import { boostVideo, disposeFFmpeg } from '../services/ffmpegService'

const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const ACCEPTED_EXTENSIONS = /\.(mp4|webm|mov)$/i
const MAX_FILE_SIZE = 500 * 1024 * 1024

function toMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error.trim()
  return 'Processing failed. Please try again.'
}

export function useVideoBooster() {
  const video = ref<SelectedVideo | null>(null)
  const boostPercent = ref(100)
  const enhancement = ref<EnhancementMode>('maximize')
  const customSettings = ref<CustomAudioSettings>({ ...DEFAULT_CUSTOM_SETTINGS })
  const status = ref<BoosterStatus>('idle')
  const progress = ref(0)
  const errorMessage = ref('')
  const result = ref<ExportResult | null>(null)

  let controller: AbortController | null = null
  let runId = 0

  const hasVideo = computed(() => video.value !== null)
  const isBusy = computed(() => status.value === 'loading' || status.value === 'processing')
  const canProcess = computed(() => hasVideo.value && !isBusy.value)
  const gain = computed(() => boostPercent.value / 100)
  const canDownload = computed(() => status.value === 'success' && result.value !== null)

  function validate(file: File): string | null {
    const typeOk = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.test(file.name)
    if (!typeOk) {
      return 'Unsupported format. Please choose an MP4, WebM, or MOV video.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'This file is too large. Please choose a video smaller than 500 MB.'
    }
    return null
  }

  function readDuration(url: string): Promise<number> {
    return new Promise((resolve) => {
      const element = document.createElement('video')
      element.preload = 'metadata'
      element.onloadedmetadata = () => {
        resolve(Number.isFinite(element.duration) ? element.duration : 0)
      }
      element.onerror = () => resolve(0)
      element.src = url
    })
  }

  function revokeResult(): void {
    if (result.value) {
      URL.revokeObjectURL(result.value.url)
      result.value = null
    }
  }

  function revokeCurrentVideo(): void {
    if (video.value) {
      URL.revokeObjectURL(video.value.url)
    }
  }

  async function loadVideo(file: File): Promise<void> {
    errorMessage.value = ''
    const problem = validate(file)
    if (problem) {
      errorMessage.value = problem
      return
    }
    revokeResult()
    revokeCurrentVideo()
    const url = URL.createObjectURL(file)
    const duration = await readDuration(url)
    video.value = {
      file,
      url,
      name: file.name,
      size: file.size,
      duration,
      type: file.type || 'video/mp4',
    }
    status.value = 'idle'
    progress.value = 0
  }

  function clearVideo(): void {
    cancel()
    revokeCurrentVideo()
    revokeResult()
    video.value = null
    errorMessage.value = ''
    status.value = 'idle'
    progress.value = 0
  }

  function setBoost(percent: number): void {
    boostPercent.value = Math.min(2000, Math.max(100, Math.round(percent)))
  }

  function setEnhancement(value: EnhancementMode): void {
    enhancement.value = value
  }

  function setCustomSettings(value: CustomAudioSettings): void {
    customSettings.value = { ...DEFAULT_CUSTOM_SETTINGS, ...(value ?? {}) }
  }

  async function process(): Promise<void> {
    if (!video.value || isBusy.value) return
    revokeResult()
    errorMessage.value = ''
    status.value = 'loading'
    progress.value = 0
    controller = new AbortController()
    const id = ++runId

    try {
      const { blob, fileName } = await boostVideo({
        file: video.value.file,
        gain: gain.value,
        mode: enhancement.value,
        custom: customSettings.value,
        duration: video.value.duration,
        signal: controller.signal,
        onReady: () => {
          if (id === runId) status.value = 'processing'
        },
        onProgress: (ratio) => {
          if (id !== runId) return
          progress.value = Math.min(100, Math.max(0, Math.round(ratio * 100)))
        },
      })

      if (id !== runId) return

      result.value = {
        url: URL.createObjectURL(blob),
        blob,
        fileName,
        size: blob.size,
      }
      progress.value = 100
      status.value = 'success'
    } catch (error) {
      if (id !== runId) return
      status.value = 'error'
      errorMessage.value = toMessage(error)
    } finally {
      if (id === runId) controller = null
    }
  }

  function cancel(): void {
    runId += 1
    controller?.abort()
    controller = null
    disposeFFmpeg()
    if (status.value === 'loading' || status.value === 'processing') {
      status.value = 'idle'
      progress.value = 0
    }
  }

  function resetOutput(): void {
    revokeResult()
    progress.value = 0
    if (status.value === 'success' || status.value === 'error') {
      status.value = 'idle'
    }
    errorMessage.value = ''
  }

  function download(): void {
    if (!result.value) return
    const link = document.createElement('a')
    link.href = result.value.url
    link.download = result.value.fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  onBeforeUnmount(() => {
    cancel()
    revokeResult()
    revokeCurrentVideo()
  })

  return {
    video,
    boostPercent,
    enhancement,
    customSettings,
    status,
    progress,
    errorMessage,
    result,
    hasVideo,
    isBusy,
    canProcess,
    gain,
    canDownload,
    loadVideo,
    clearVideo,
    setBoost,
    setEnhancement,
    setCustomSettings,
    process,
    cancel,
    resetOutput,
    download,
  }
}
