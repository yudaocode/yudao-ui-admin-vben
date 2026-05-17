<script lang="ts" setup>
import { InputNumber } from 'ant-design-vue';

type NumberRangeValue = [number | undefined, number | undefined];

const props = withDefaults(
  defineProps<{
    maxPlaceholder?: string;
    min?: number;
    minPlaceholder?: string;
    precision?: number;
    value?: NumberRangeValue;
  }>(),
  {
    maxPlaceholder: '最大值',
    min: undefined,
    minPlaceholder: '最小值',
    precision: 2,
    value: undefined,
  },
);

const emit = defineEmits<{
  'update:value': [value: NumberRangeValue | undefined];
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
    props.value?.[0] ?? undefined,
    props.value?.[1] ?? undefined,
  ];
  next[index] = normalizeValue(value);
  emit(
    'update:value',
    next[0] === undefined && next[1] === undefined ? undefined : next,
  );
}
</script>

<template>
  <div class="flex w-full items-center gap-2">
    <InputNumber
      :controls="false"
      :min="min"
      :placeholder="minPlaceholder"
      :precision="precision"
      :value="value?.[0]"
      class="min-w-0 flex-1"
      @update:value="updateValue(0, $event)"
    />
    <span class="shrink-0 text-muted-foreground">至</span>
    <InputNumber
      :controls="false"
      :min="min"
      :placeholder="maxPlaceholder"
      :precision="precision"
      :value="value?.[1]"
      class="min-w-0 flex-1"
      @update:value="updateValue(1, $event)"
    />
  </div>
</template>
