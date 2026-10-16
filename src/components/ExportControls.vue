<script setup lang="ts">
import { computed } from 'vue'
import type { BoosterStatus } from '../types/video'
import { formatBytes } from '../utils/format'

const props = defineProps<{
  status: BoosterStatus
  canProcess: boolean
  canDownload: boolean
  isBusy: boolean
  resultName?: string
  resultSize?: number
}>()

const emit = defineEmits<{
  process: []
  cancel: []
  download: []
  reset: []
}>()

const processLabel = computed(() => {
  if (props.status === 'loading') return 'Loading engine\u2026'
  if (props.status === 'processing') return 'Processing\u2026'
  return 'Boost & Export MP4'
})
</script>

<template>
  <section class="space-y-3">
    <div class="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        :disabled="!canProcess"
        class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
        @click="emit('process')"
      >
        <svg
          v-if="isBusy"
          class="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" class="opacity-25" />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
          />
        </svg>
        {{ processLabel }}
      </button>

      <button
        v-if="isBusy"
        type="button"
        class="rounded-xl border border-neutral-700 px-5 py-3 text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        @click="emit('cancel')"
      >
        Cancel
      </button>

      <button
        v-else-if="canDownload"
        type="button"
        class="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        @click="emit('download')"
      >
        Download
      </button>
    </div>

    <p v-if="status === 'success' && resultName" class="text-xs text-neutral-400">
      Ready: <span class="text-neutral-200">{{ resultName }}</span>
      <span v-if="resultSize"> &middot; {{ formatBytes(resultSize) }}</span>
    </p>
  </section>
</template>
