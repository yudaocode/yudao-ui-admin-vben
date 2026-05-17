<script lang="ts" setup>
import { ElInputNumber } from 'element-plus';

type NumberRangeValue = [number | undefined, number | undefined];

const props = withDefaults(
  defineProps<{
    maxPlaceholder?: string;
    min?: number;
    minPlaceholder?: string;
    modelValue?: NumberRangeValue;
    precision?: number;
  }>(),
  {
    maxPlaceholder: '最大值',
    min: undefined,
    minPlaceholder: '最小值',
    modelValue: undefined,
    precision: 2,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: NumberRangeValue | undefined];
}>();

function normalizeValue(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
  }
  return undefined;
}

function updateValue(index: 0 | 1, value: unknown) {
  const next: NumberRangeValue = [
    props.modelValue?.[0] ?? undefined,
    props.modelValue?.[1] ?? undefined,
  ];
  next[index] = normalizeValue(value);
  emit(
    'update:modelValue',
    next[0] === undefined && next[1] === undefined ? undefined : next,
  );
}
</script>

<template>
  <div class="flex w-full items-center gap-2">
    <ElInputNumber
      :controls="false"
      :min="min"
      :model-value="modelValue?.[0]"
      :placeholder="minPlaceholder"
      :precision="precision"
      class="min-w-0 flex-1"
      @update:model-value="updateValue(0, $event)"
    />
    <span class="shrink-0 text-muted-foreground">至</span>
    <ElInputNumber
      :controls="false"
      :min="min"
      :model-value="modelValue?.[1]"
      :placeholder="maxPlaceholder"
      :precision="precision"
      class="min-w-0 flex-1"
      @update:model-value="updateValue(1, $event)"
    />
  </div>
</template>
