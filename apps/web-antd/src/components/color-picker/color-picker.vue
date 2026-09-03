<script lang="ts" setup>
import { computed } from 'vue';

defineOptions({ name: 'ColorPicker' });

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    modelValue?: string;
  }>(),
  { disabled: false, modelValue: '' },
);

const emit = defineEmits<{
  change: [value: string];
  'update:modelValue': [value: string];
}>();

/** input[type=color] 需要合法的六位 hex 值，空值时仅回退展示，不改动外部值。 */
const colorValue = computed(() =>
  /^#[0-9a-f]{6}$/i.test(props.modelValue)
    ? props.modelValue
    : '#000000',
);

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  emit('update:modelValue', value);
  emit('change', value);
}
</script>

<template>
  <input
    :disabled="disabled"
    :value="colorValue"
    class="h-8 w-14 cursor-pointer rounded border border-solid border-border bg-background p-0.5 disabled:cursor-not-allowed"
    type="color"
    @input="handleInput"
  />
</template>
