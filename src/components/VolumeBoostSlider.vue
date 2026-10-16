<script setup lang="ts">
import { computed } from 'vue'
import { gainToDb } from '../utils/format'

const props = defineProps<{
  modelValue: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const MAX = 2000
const MIN = 100
const STEP = 25

const dbLabel = computed(() => gainToDb(props.modelValue))

function handleInput(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  emit('update:modelValue', value)
}
</script>

<template>
  <section
    class="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 sm:p-6"
    aria-labelledby="boost-heading"
  >
    <div class="flex items-baseline justify-between gap-3">
      <div>
        <h2 id="boost-heading" class="text-base font-semibold text-neutral-100">
          Voice boost
        </h2>
        <p class="mt-1 text-xs text-neutral-400">
          Controls the exported audio volume, not the preview player volume.
        </p>
      </div>
      <div class="text-right">
        <span class="block text-2xl font-semibold tabular-nums text-indigo-400">
          {{ modelValue }}%
        </span>
        <span class="block text-xs tabular-nums text-neutral-400">{{ dbLabel }}</span>
      </div>
    </div>

    <div class="mt-5">
      <input
        id="boost-range"
        type="range"
        :min="MIN"
        :max="MAX"
        :step="STEP"
        :value="modelValue"
        :disabled="disabled"
        :aria-valuetext="`${modelValue} percent, ${dbLabel}`"
        class="h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-700 accent-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        @input="handleInput"
      />
      <div class="mt-2 flex justify-between text-[11px] tabular-nums text-neutral-500">
        <span>100%</span>
        <span>500%</span>
        <span>1000%</span>
        <span>1500%</span>
        <span>2000%</span>
      </div>
    </div>

    <p class="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300/90">
      This sets the exported audio level. For the loudest voice use Maximize mode
      &mdash; it lifts quiet speech instead of just scaling it. Very high settings
      sound compressed because everything sits near full scale.
    </p>
  </section>
</template>
