<script lang="ts" setup>
import type { MesProAndonConfigApi } from '#/api/mes/pro/andon/config';

import { computed, onMounted, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { ElOption, ElSelect } from 'element-plus';

import { getAndonConfigList } from '#/api/mes/pro/andon/config';
import DictTag from '#/components/dict-tag/dict-tag.vue';

/** MES 安灯配置选择器：纯下拉，前端按 reason 过滤 */
defineOptions({ name: 'AndonConfigSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    clearable: true,
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
const filteredList = ref<MesProAndonConfigApi.AndonConfig[]>([]);

const selectValue = computed({
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value);
  },
});

/** 前端过滤：按 reason 模糊匹配 */
function handleFilter(query: string) {
  if (!query) {
    filteredList.value = allList.value;
    return;
  }
  const keyword = query.toLowerCase();
  filteredList.value = allList.value.filter((item) =>
    item.reason?.toLowerCase().includes(keyword),
  );
}

/** 选中变化 */
function handleChange(value: number | undefined) {
  const item = allList.value.find((o) => o.id === value);
  emit('change', item);
}

onMounted(async () => {
  allList.value = (await getAndonConfigList()) || [];
  filteredList.value = allList.value;
});
</script>

<template>
  <ElSelect
    v-bind="$attrs"
    v-model="selectValue"
    :clearable="clearable"
    :disabled="disabled"
    :filter-method="handleFilter"
    :placeholder="placeholder"
    class="w-full"
    filterable
    @change="handleChange"
  >
    <ElOption
      v-for="item in filteredList"
      :key="item.id"
      :label="item.reason"
      :value="item.id!"
    >
      <div class="flex items-center gap-2">
        <span>{{ item.reason }}</span>
        <DictTag :type="DICT_TYPE.MES_PRO_ANDON_LEVEL" :value="item.level" />
      </div>
    </ElOption>
  </ElSelect>
</template>
