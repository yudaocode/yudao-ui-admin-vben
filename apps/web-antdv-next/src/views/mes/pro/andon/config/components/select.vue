<script lang="ts" setup>
import type { MesProAndonConfigApi } from '#/api/mes/pro/andon/config';

import { computed, onMounted, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { Select } from 'antdv-next';

import { getAndonConfigList } from '#/api/mes/pro/andon/config';
import DictTag from '#/components/dict-tag/dict-tag.vue';

/** MES 安灯配置选择器：纯下拉，前端按 reason 过滤 */
defineOptions({ name: 'AndonConfigSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    allowClear: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择呼叫原因',
  },
);

const emit = defineEmits<{
  change: [item: MesProAndonConfigApi.AndonConfig | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const allList = ref<MesProAndonConfigApi.AndonConfig[]>([]);
const selectOptions = computed(() =>
  allList.value.map((item) => ({
    label: item.reason,
    value: item.id,
    raw: item,
  })),
);

const selectValue = computed({
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value);
  },
});

/** 前端过滤：按 reason 模糊匹配 */
function handleFilter(input: string, option: any) {
  const keyword = input.toLowerCase();
  const item = option?.raw as MesProAndonConfigApi.AndonConfig | undefined;
  return Boolean(item?.reason?.toLowerCase().includes(keyword));
}

/** 选中变化 */
function handleChange(value: any) {
  const nextValue = value === undefined ? undefined : Number(value);
  const item = allList.value.find((o) => o.id === nextValue);
  emit('change', item);
}

onMounted(async () => {
  allList.value = (await getAndonConfigList()) || [];
});
</script>

<template>
  <Select
    v-bind="$attrs"
    v-model:value="selectValue"
    :allow-clear="allowClear"
    :disabled="disabled"
    :filter-option="handleFilter"
    :placeholder="placeholder"
    class="w-full"
    show-search
    :options="selectOptions"
    @change="handleChange"
  >
    <template #optionRender="{ option }">
      <div class="flex items-center gap-2">
        <span>{{ option.data.raw.reason }}</span>
        <DictTag
          :type="DICT_TYPE.MES_PRO_ANDON_LEVEL"
          :value="option.data.raw.level"
        />
      </div>
    </template>
  </Select>
</template>
