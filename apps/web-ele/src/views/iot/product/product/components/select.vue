<script lang="ts" setup>
import type { IotProductApi } from '#/api/iot/product/product';

import { onMounted, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getSimpleProductList } from '#/api/iot/product/product';

/** 产品下拉选择器组件 */
defineOptions({ name: 'ProductSelect' });

const props = defineProps<{
  deviceType?: number; // 设备类型过滤
  modelValue?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value?: number): void;
  (e: 'change', value?: number): void;
}>();

const loading = ref(false);
const productList = ref<IotProductApi.Product[]>([]);

/** 处理选择变化 */
function handleChange(value: any) {
  emit('update:modelValue', value as number | undefined);
  emit('change', value as number | undefined);
}

/** 获取产品列表 */
async function getProductList() {
  try {
    loading.value = true;
    productList.value = (await getSimpleProductList(props.deviceType)) || [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  getProductList();
});
</script>

<template>
  <ElSelect
    :model-value="modelValue"
    :loading="loading"
    placeholder="请选择产品"
    clearable
    filterable
    class="w-full"
    @change="handleChange"
  >
    <ElOption
      v-for="p in productList"
      :key="p.id!"
      :label="p.name"
      :value="p.id!"
    />
  </ElSelect>
</template>
