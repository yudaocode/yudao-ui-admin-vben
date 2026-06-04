<script lang="ts" setup>
import type { MesDvSubjectApi } from '#/api/mes/dv/subject';

import { computed, onMounted, ref } from 'vue';

import { CommonStatusEnum } from '@vben/constants';

import { ElOption, ElSelect } from 'element-plus';

import { getSubjectSimpleList } from '#/api/mes/dv/subject';

defineOptions({ name: 'DvSubjectSelect' });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    type?: number;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择项目',
    type: undefined,
  },
);
const emit = defineEmits<{
  change: [row?: MesDvSubjectApi.Subject];
  'update:modelValue': [value?: number];
}>();
const list = ref<MesDvSubjectApi.Subject[]>([]); // 项目列表
const filteredList = computed(() => {
  // 仅展示启用且类型匹配的项目，避免新建时带出禁用项目
  const result: Array<MesDvSubjectApi.Subject & { disabled?: boolean }> =
    list.value.filter(
      (item) =>
        item.status === CommonStatusEnum.ENABLE &&
        (!props.type || item.type === props.type),
    );
  // 历史数据可能绑定已禁用或其它类型的项目，补充当前选中项用于回显，并禁止重新选择
  if (
    props.modelValue != null &&
    !result.some((item) => item.id === props.modelValue)
  ) {
    const current = list.value.find((item) => item.id === props.modelValue);
    if (current) {
      result.push({ ...current, disabled: true });
    }
  }
  return result;
});

/** 加载项目列表 */
async function getList() {
  list.value = await getSubjectSimpleList();
}

/** 处理选择变化 */
function handleChange(value: number | string | undefined) {
  const subjectId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', subjectId);
  emit('change', list.value.find((item) => item.id === subjectId));
}

onMounted(getList);
</script>

<template>
  <ElSelect
    :clearable="clearable"
    :disabled="disabled"
    :model-value="modelValue"
    :placeholder="placeholder"
    class="w-full"
    filterable
    @change="handleChange"
  >
    <ElOption
      v-for="item in filteredList"
      :key="item.id"
      :disabled="item.disabled"
      :label="item.name"
      :value="item.id!"
    />
  </ElSelect>
</template>
