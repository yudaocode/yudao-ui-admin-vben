<script lang="ts" setup>
import { computed } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { HRM_PERFORMANCE_RATER_MAX_LEVEL } from '#/views/hrm/utils/constants';
import { formatHrmPerformanceRaterLevel } from '#/views/hrm/utils/format-performance';

defineOptions({ name: 'HrmPerformanceRaterLevelSelect' });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    raterType?: number;
  }>(),
  {
    clearable: false,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择层级',
    raterType: undefined,
  },
);

const emit = defineEmits<{
  change: [value: number | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const levels = Array.from(
  { length: HRM_PERFORMANCE_RATER_MAX_LEVEL },
  (_, index) => index + 1,
);

const options = computed(() =>
  levels.map((level) => ({
    label: formatHrmPerformanceRaterLevel(props.raterType, level),
    value: level,
  })),
);

const selectValue = computed({
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});
</script>

<template>
  <ElSelect
    v-model="selectValue"
    :clearable="clearable"
    :disabled="disabled"
    :placeholder="placeholder"
    class="w-full"
  >
    <ElOption
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </ElSelect>
</template>
