<script setup lang="ts">
import { computed } from 'vue'
import type { BoosterStatus } from '../types/video'

const props = defineProps<{
  status: BoosterStatus
  progress: number
  errorMessage?: string
}>()

const isActive = computed(() => props.status === 'loading' || props.status === 'processing')

const statusText = computed(() => {
  switch (props.status) {
    case 'loading':
      return 'Loading the FFmpeg engine (first run downloads ~31 MB)\u2026'
    case 'processing':
      return 'Boosting audio and muxing the MP4\u2026'
    case 'success':
      return 'Export complete. Your video is ready to download.'
    case 'error':
      return props.errorMessage || 'Something went wrong.'
    default:
      return ''
  }
})

const barStyle = computed(() => ({ width: `${Math.min(100, Math.max(0, props.progress))}%` }))
</script>

<template>
  <section
    v-if="status !== 'idle'"
    class="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 sm:p-6"
    aria-live="polite"
  >
    <div class="flex items-center justify-between gap-3">
      <p
        class="text-sm"
        :class="status === 'error' ? 'text-red-300' : 'text-neutral-300'"
      >
        {{ statusText }}
      </p>
      <span v-if="isActive" class="text-sm tabular-nums text-neutral-400">
        {{ progress }}%
      </span>
    </div>

    <div
      v-if="isActive"
      class="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-800"
      role="progressbar"
      :aria-valuenow="progress"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="h-full rounded-full bg-indigo-500 transition-[width] duration-300 ease-out"
        :class="progress === 0 ? 'animate-pulse' : ''"
        :style="barStyle"
      ></div>
    </div>

    <p v-if="status === 'processing' && progress === 0" class="mt-2 text-xs text-neutral-500">
      Progress is reported by FFmpeg and may stay at 0% for very large files.
    </p>
  </section>
</template>
