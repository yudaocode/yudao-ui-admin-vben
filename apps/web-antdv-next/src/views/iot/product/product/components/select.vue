<script lang="ts" setup>
import type { IotProductApi } from '#/api/iot/product/product';

import { onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

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
function handleChange(value?: number) {
  emit('update:modelValue', value);
  emit('change', value);
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
  <Select
    :value="modelValue"
    :options="productList.map((p) => ({ label: p.name, value: p.id }))"
    :loading="loading"
    placeholder="请选择产品"
    allow-clear
    class="w-full"
    @change="handleChange"
  />
</template>
