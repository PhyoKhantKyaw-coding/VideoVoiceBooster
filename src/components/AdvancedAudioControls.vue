<script setup lang="ts">
import SliderField from './SliderField.vue'
import { DEFAULT_CUSTOM_SETTINGS } from '../types/video'
import type { CustomAudioSettings } from '../types/video'

const props = defineProps<{
  modelValue: CustomAudioSettings
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CustomAudioSettings]
}>()

type ToggleKey = 'normalize' | 'compressor' | 'denoise' | 'voice' | 'limiter'

function patch(part: Partial<CustomAudioSettings>): void {
  emit('update:modelValue', { ...DEFAULT_CUSTOM_SETTINGS, ...props.modelValue, ...part })
}

function onToggle(key: ToggleKey, event: Event): void {
  const checked = (event.target as HTMLInputElement).checked
  patch({ [key]: checked } as Partial<CustomAudioSettings>)
}

function onFade(key: 'fadeIn' | 'fadeOut', event: Event): void {
  const raw = Number((event.target as HTMLInputElement).value)
  const value = Number.isFinite(raw) ? Math.min(15, Math.max(0, raw)) : 0
  patch({ [key]: value } as Partial<CustomAudioSettings>)
}

function signed(value: number, unit = ' dB'): string {
  return `${value > 0 ? '+' : ''}${value}${unit}`
}
</script>

<template>
  <section
    class="space-y-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 sm:p-6"
    aria-labelledby="custom-heading"
  >
    <div>
      <h2 id="custom-heading" class="text-base font-semibold text-neutral-100">
        Custom processing
      </h2>
      <p class="mt-1 text-xs text-neutral-400">
        Build your own chain. Applied in order: cleanup &rarr; tone &rarr; dynamics
        &rarr; loudness &rarr; boost &rarr; limiter &rarr; fades.
      </p>
    </div>

    <div class="space-y-5">
      <h3 class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        Cleanup &amp; dynamics
      </h3>

      <div class="space-y-2">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-neutral-600 bg-neutral-800 accent-indigo-500"
            :checked="modelValue.normalize"
            :disabled="disabled"
            @change="onToggle('normalize', $event)"
          />
          <span class="text-sm font-medium text-neutral-200">Volume normalization</span>
        </label>
        <SliderField
          label="Target loudness"
          :model-value="modelValue.normalizeTarget"
          :min="-30"
          :max="-5"
          :step="1"
          :display="`${modelValue.normalizeTarget} LUFS`"
          :disabled="disabled || !modelValue.normalize"
          @update:model-value="(v) => patch({ normalizeTarget: v })"
        />
      </div>

      <div class="space-y-2">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-neutral-600 bg-neutral-800 accent-indigo-500"
            :checked="modelValue.compressor"
            :disabled="disabled"
            @change="onToggle('compressor', $event)"
          />
          <span class="text-sm font-medium text-neutral-200">Audio compressor</span>
        </label>
        <SliderField
          label="Amount"
          :model-value="modelValue.compressorAmount"
          :min="0"
          :max="100"
          :step="5"
          :display="`${modelValue.compressorAmount}%`"
          :disabled="disabled || !modelValue.compressor"
          @update:model-value="(v) => patch({ compressorAmount: v })"
        />
      </div>

      <div class="space-y-2">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-neutral-600 bg-neutral-800 accent-indigo-500"
            :checked="modelValue.denoise"
            :disabled="disabled"
            @change="onToggle('denoise', $event)"
          />
          <span class="text-sm font-medium text-neutral-200">Noise reduction</span>
        </label>
        <SliderField
          label="Amount"
          :model-value="modelValue.denoiseAmount"
          :min="0"
          :max="100"
          :step="5"
          :display="`${modelValue.denoiseAmount}%`"
          :disabled="disabled || !modelValue.denoise"
          @update:model-value="(v) => patch({ denoiseAmount: v })"
        />
      </div>

      <div class="space-y-2">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-neutral-600 bg-neutral-800 accent-indigo-500"
            :checked="modelValue.voice"
            :disabled="disabled"
            @change="onToggle('voice', $event)"
          />
          <span class="text-sm font-medium text-neutral-200">Voice enhancement</span>
        </label>
        <SliderField
          label="Presence"
          :model-value="modelValue.voiceAmount"
          :min="0"
          :max="12"
          :step="1"
          :display="signed(modelValue.voiceAmount)"
          :disabled="disabled || !modelValue.voice"
          @update:model-value="(v) => patch({ voiceAmount: v })"
        />
      </div>
    </div>

    <div class="space-y-3">
      <h3 class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        Equalizer
      </h3>
      <div class="grid gap-x-6 gap-y-4 sm:grid-cols-3">
        <SliderField
          label="Bass"
          :model-value="modelValue.bass"
          :min="-12"
          :max="12"
          :step="1"
          :display="signed(modelValue.bass)"
          :disabled="disabled"
          @update:model-value="(v) => patch({ bass: v })"
        />
        <SliderField
          label="Midrange"
          :model-value="modelValue.mid"
          :min="-12"
          :max="12"
          :step="1"
          :display="signed(modelValue.mid)"
          :disabled="disabled"
          @update:model-value="(v) => patch({ mid: v })"
        />
        <SliderField
          label="Treble"
          :model-value="modelValue.treble"
          :min="-12"
          :max="12"
          :step="1"
          :display="signed(modelValue.treble)"
          :disabled="disabled"
          @update:model-value="(v) => patch({ treble: v })"
        />
      </div>
    </div>

    <div class="space-y-2">
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          class="h-4 w-4 rounded border-neutral-600 bg-neutral-800 accent-indigo-500"
          :checked="modelValue.limiter"
          :disabled="disabled"
          @change="onToggle('limiter', $event)"
        />
        <span class="text-sm font-medium text-neutral-200">Peak limiter</span>
      </label>
      <SliderField
        label="Ceiling"
        :model-value="modelValue.limiterCeiling"
        :min="0.5"
        :max="1"
        :step="0.01"
        :display="`${Math.round(modelValue.limiterCeiling * 100)}%`"
        :disabled="disabled || !modelValue.limiter"
        @update:model-value="(v) => patch({ limiterCeiling: v })"
      />
    </div>

    <div class="space-y-3">
      <h3 class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        Fade in / fade out
      </h3>
      <div class="grid grid-cols-2 gap-4">
        <label class="block">
          <span class="text-xs font-medium text-neutral-300">Fade in (s)</span>
          <input
            type="number"
            min="0"
            max="15"
            step="0.5"
            :value="modelValue.fadeIn"
            :disabled="disabled"
            class="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            @input="onFade('fadeIn', $event)"
          />
        </label>
        <label class="block">
          <span class="text-xs font-medium text-neutral-300">Fade out (s)</span>
          <input
            type="number"
            min="0"
            max="15"
            step="0.5"
            :value="modelValue.fadeOut"
            :disabled="disabled"
            class="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            @input="onFade('fadeOut', $event)"
          />
        </label>
      </div>
    </div>
  </section>
</template>
