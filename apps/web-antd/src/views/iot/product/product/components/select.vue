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
  <Select
    :value="modelValue"
    :options="
      productList.map((product) => ({
        label: product.name,
        value: product.id,
      }))
    "
    :loading="loading"
    placeholder="请选择产品"
    allow-clear
    class="w-full"
    option-filter-prop="label"
    show-search
    @change="handleChange"
  />
</template>
