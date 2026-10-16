<script setup lang="ts">
import VideoStage from './components/VideoStage.vue'
import VolumeBoostSlider from './components/VolumeBoostSlider.vue'
import EnhancementSelect from './components/EnhancementSelect.vue'
import AdvancedAudioControls from './components/AdvancedAudioControls.vue'
import ExportControls from './components/ExportControls.vue'
import ProcessingProgress from './components/ProcessingProgress.vue'
import { useVideoBooster } from './composables/useVideoBooster'

const {
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
  canDownload,
  loadVideo,
  clearVideo,
  setBoost,
  setEnhancement,
  setCustomSettings,
  process,
  cancel,
  download,
} = useVideoBooster()
</script>

<template>
  <div
    class="flex min-h-dvh flex-col bg-neutral-950 text-neutral-100"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <header
      class="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur"
      style="padding-top: env(safe-area-inset-top)"
    >
      <div class="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <span
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
        </span>
        <div class="min-w-0">
          <h1 class="truncate text-base font-semibold tracking-tight sm:text-xl">
            Video Voice Booster
          </h1>
          <p class="truncate text-xs text-neutral-500">
            Upload, boost, export &mdash; all in your browser
          </p>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-10">
      <VideoStage
        :video="video"
        :result="result"
        :error="errorMessage"
        :disabled="isBusy"
        @select="loadVideo"
        @remove="clearVideo"
      />

      <template v-if="hasVideo">
        <VolumeBoostSlider
          :model-value="boostPercent"
          :disabled="isBusy"
          @update:model-value="setBoost"
        />

        <EnhancementSelect
          :model-value="enhancement"
          :disabled="isBusy"
          @update:model-value="setEnhancement"
        />

        <AdvancedAudioControls
          v-if="enhancement === 'custom'"
          :model-value="customSettings"
          :disabled="isBusy"
          @update:model-value="setCustomSettings"
        />

        <ExportControls
          :status="status"
          :can-process="canProcess"
          :can-download="canDownload"
          :is-busy="isBusy"
          :result-name="result?.fileName"
          :result-size="result?.size"
          @process="process"
          @cancel="cancel"
          @download="download"
        />
      </template>

      <ProcessingProgress
        :status="status"
        :progress="progress"
        :error-message="errorMessage"
      />
    </main>

    <footer class="border-t border-neutral-800 px-4 py-5 text-center text-xs text-neutral-600 sm:px-6">
      Powered by FFmpeg.wasm &middot; No uploads, no accounts, no tracking
    </footer>
  </div>
</template>
