<script lang="ts" setup>
import type { OaSealApi } from '#/api/oa/seal';

import { computed, onMounted, ref, watch } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getSealPage } from '#/api/oa/seal/apply';

defineOptions({ name: 'OaSealSelect' });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    selectedSeal?: OaSealApi.Seal;
  }>(),
  {
    disabled: false,
    clearable: true,
    modelValue: undefined,
    placeholder: '请输入印章名称搜索',
    selectedSeal: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const list = ref<OaSealApi.Seal[]>([]); // 可申请的印章列表
const loading = ref(false); // 列表的加载中
const currentSeal = ref<OaSealApi.Seal>(); // 已选印章，用于搜索结果之外的回显

/** 下拉印章，已选印章不在搜索结果中时补充回显 */
const sealOptions = computed(() => {
  const seals = [...list.value];
  const selected = currentSeal.value;
  if (
    selected?.id &&
    selected.id === props.modelValue &&
    !seals.some((seal) => seal.id === selected.id)
  ) {
    seals.unshift(selected);
  }
  return seals;
});

/** 选中变化 */
function handleChange(value: unknown) {
  currentSeal.value = sealOptions.value.find((seal) => seal.id === value);
  emit('update:modelValue', typeof value === 'number' ? value : undefined);
}

/** 查询可申请的印章 */
async function getList(name: string) {
  loading.value = true;
  try {
    const params = { pageNo: 1, pageSize: 20, name };
    const data = await getSealPage(params);
    list.value = data.list;
  } finally {
    loading.value = false;
  }
}

/** 回显申请关联的印章，无需印章管理查询权限 */
watch(
  () => props.selectedSeal,
  (seal) => {
    if (seal?.id && seal.name && currentSeal.value?.id !== seal.id) {
      currentSeal.value = seal;
    }
  },
  { immediate: true },
);

/** 初始化 */
onMounted(() => {
  getList('');
});
</script>

<template>
  <ElSelect
    :model-value="modelValue"
    :disabled="disabled"
    :clearable="clearable"
    :loading="loading"
    :placeholder="placeholder"
    filterable
    remote
    :remote-method="getList"
    @update:model-value="handleChange"
  >
    <ElOption
      v-for="seal in sealOptions"
      :key="seal.id"
      :value="seal.id!"
      :label="`${seal.no} / ${seal.name}`"
    />
  </ElSelect>
</template>
