<script lang="ts" setup>
import type { FmsSubjectApi } from '#/api/fms/config/subject';

import { computed, ref, watch } from 'vue';

import { Select } from 'antdv-next';

import { getSubjectSimpleList } from '#/api/fms/config/subject';
import { useFmsStore } from '#/views/fms/store/fms';
import { FMS_SUBJECT_STATUS } from '#/views/fms/utils/constants';

defineOptions({ name: 'FmsSubjectSelect' });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    filterable?: boolean;
    modelValue?: number;
    options?: FmsSubjectApi.Subject[];
    placeholder?: string;
  }>(),
  {
    clearable: false,
    disabled: false,
    filterable: true,
    modelValue: undefined,
    options: undefined,
    placeholder: '请选择科目',
  },
);

const emit = defineEmits<{
  change: [value: number | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const loading = ref(false); // 会计科目列表的加载中
const subjectList = ref<FmsSubjectApi.Subject[]>([]); // 自动加载的会计科目列表
const subjectOptions = computed(() =>
  flattenSubjects(props.options || subjectList.value),
); // 平铺会计科目列表

/** 平铺科目树 */
function flattenSubjects(subjects: FmsSubjectApi.Subject[]) {
  const result: FmsSubjectApi.Subject[] = [];
  const walk = (nodes: FmsSubjectApi.Subject[]) => {
    for (const node of nodes) {
      result.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(subjects);
  return result;
}

/** 格式化会计科目选项 */
function formatSubjectOption(subject: FmsSubjectApi.Subject) {
  const indent = '　'.repeat(Math.max((subject.level || 1) - 1, 0));
  const statusLabel =
    subject.status === FMS_SUBJECT_STATUS.DISABLED ? '（已停用）' : '';
  return `${indent}${subject.code} ${subject.name}${statusLabel}`;
}

/** 选中变化 */
function handleChange(value: unknown) {
  const subjectId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', subjectId);
  emit('change', subjectId);
}

/** 获得会计科目列表 */
async function getSubjectList() {
  if (props.options) return;
  if (!accountSetId.value) {
    subjectList.value = [];
    return;
  }
  loading.value = true;
  try {
    subjectList.value = await getSubjectSimpleList(accountSetId.value);
  } finally {
    loading.value = false;
  }
}

/** 未传入选项时，监听账套切换并自动加载 */
watch(accountSetId, getSubjectList, { immediate: true });
</script>

<template>
  <Select
    :allow-clear="clearable"
    :disabled="disabled"
    :loading="loading"
    :options="
      subjectOptions.map((subject) => ({
        label: formatSubjectOption(subject),
        value: subject.id,
      }))
    "
    :placeholder="placeholder"
    :show-search="filterable"
    :value="modelValue"
    class="w-full"
    option-filter-prop="label"
    @change="handleChange"
  />
</template>
