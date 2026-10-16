<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ExportResult, SelectedVideo } from '../types/video'
import { formatBytes, formatDuration } from '../utils/format'

const props = defineProps<{
  video: SelectedVideo | null
  result?: ExportResult | null
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [file: File]
  remove: []
}>()

const ACCEPT = 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov'
const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const listenMode = ref<'boosted' | 'original'>('boosted')

const hasResult = computed(() => props.result !== null && props.result !== undefined)
const activeUrl = computed(() => {
  if (hasResult.value && listenMode.value === 'original' && props.video) {
    return props.video.url
  }
  return props.result?.url ?? props.video?.url ?? ''
})

function openPicker(): void {
  if (props.disabled) return
  inputRef.value?.click()
}

function handleInput(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('select', file)
  input.value = ''
}

function handleDrop(event: DragEvent): void {
  isDragging.value = false
  if (props.disabled) return
  const file = event.dataTransfer?.files?.[0]
  if (file) emit('select', file)
}

function handleDragOver(): void {
  if (!props.disabled) isDragging.value = true
}

function handleDragLeave(): void {
  isDragging.value = false
}
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40">
    <template v-if="hasResult && result">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 p-4">
        <div>
          <h2 class="text-base font-semibold text-neutral-100">Preview result</h2>
          <p class="mt-1 text-xs text-neutral-400">
            Listen to the boosted audio before you download.
          </p>
        </div>

        <div
          class="inline-flex rounded-lg border border-neutral-700 p-1"
          role="group"
          aria-label="Choose which audio to preview"
        >
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            :class="
              listenMode === 'boosted'
                ? 'bg-indigo-500 text-white'
                : 'text-neutral-300 hover:text-white'
            "
            :aria-pressed="listenMode === 'boosted'"
            @click="listenMode = 'boosted'"
          >
            Boosted
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            :class="
              listenMode === 'original'
                ? 'bg-indigo-500 text-white'
                : 'text-neutral-300 hover:text-white'
            "
            :aria-pressed="listenMode === 'original'"
            @click="listenMode = 'original'"
          >
            Original
          </button>
        </div>
      </div>

      <div class="bg-black">
        <video
          :key="listenMode"
          :src="activeUrl"
          class="mx-auto block max-h-[50vh] w-full bg-black sm:max-h-[60vh]"
          controls
          playsinline
          preload="metadata"
        ></video>
      </div>

      <div class="border-t border-neutral-800 p-4">
        <p class="text-xs text-neutral-400">
          {{ listenMode === 'boosted' ? 'Playing the boosted export' : 'Playing the original upload' }}
          <template v-if="listenMode === 'boosted'">
            &middot; {{ result.fileName }} &middot; {{ formatBytes(result.size) }}
          </template>
        </p>
        <p class="mt-1 text-xs text-neutral-500">
          Both play at the same player volume, so the loudness difference you hear is the
          actual boost baked into the export.
        </p>
      </div>
    </template>

    <template v-else-if="video">
      <div class="bg-black">
        <video
          :src="video.url"
          class="mx-auto block max-h-[50vh] w-full bg-black sm:max-h-[60vh]"
          controls
          playsinline
          preload="metadata"
        ></video>
      </div>

      <div
        class="flex flex-col gap-3 border-t border-neutral-800 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-neutral-100" :title="video.name">
            {{ video.name }}
          </p>
          <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
            <span>{{ formatDuration(video.duration) }}</span>
            <span class="text-neutral-600" aria-hidden="true">&middot;</span>
            <span>{{ formatBytes(video.size) }}</span>
          </p>
        </div>

        <div class="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
          <button
            type="button"
            :disabled="disabled"
            class="flex-1 rounded-lg border border-neutral-700 px-3 py-2.5 text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            @click="openPicker"
          >
            Replace video
          </button>
          <button
            type="button"
            :disabled="disabled"
            class="flex-1 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium text-neutral-400 transition-colors hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            @click="emit('remove')"
          >
            Remove
          </button>
        </div>
      </div>
    </template>

    <button
      v-else
      type="button"
      :disabled="disabled"
      :aria-busy="disabled"
      class="group block w-full p-4 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      @click="openPicker"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <span
        class="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-4 py-12 transition-colors sm:px-6 sm:py-14"
        :class="
          isDragging
            ? 'border-indigo-400 bg-indigo-500/10'
            : 'border-neutral-700 group-hover:border-neutral-500 group-hover:bg-neutral-900/70'
        "
      >
        <span
          class="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 transition-colors group-hover:bg-neutral-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-7 w-7"
            aria-hidden="true"
          >
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </span>
        <span class="space-y-1">
          <span class="block text-base font-medium text-neutral-100">
            Drag &amp; drop a video here
          </span>
          <span class="block text-sm text-neutral-400">
            or <span class="font-medium text-indigo-400">browse your device</span>
          </span>
        </span>
        <span class="text-xs text-neutral-500">MP4, WebM, or MOV &middot; up to 500 MB</span>
        <span class="text-xs text-neutral-600">
          Processed in your browser &mdash; never uploaded
        </span>
      </span>
    </button>

    <p
      v-if="!video && !hasResult && error"
      role="alert"
      class="mx-4 mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
    >
      {{ error }}
    </p>

    <input
      ref="inputRef"
      type="file"
      :accept="ACCEPT"
      class="hidden"
      @change="handleInput"
    />
  </section>
</template>
