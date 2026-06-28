<!-- 产品选择器组件 -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { Select } from 'antdv-next';

import { getSimpleProductList } from '#/api/iot/product/product';
import { DictTag } from '#/components/dict-tag';

/** 产品选择器组件 */
defineOptions({ name: 'ProductSelector' });

defineProps<{
  modelValue?: number;
}>();

const emit = defineEmits<{
  (e: 'change' | 'update:modelValue', value?: number): void;
}>();

const productLoading = ref(false); // 产品加载状态
const productList = ref<any[]>([]); // 产品列表
const productOptions = computed(() =>
  productList.value.map((product) => ({
    label: product.name,
    value: product.id,
    raw: product,
  })),
);

/**
 * 处理选择变化事件
 * @param value 选中的产品 ID
 */
function handleChange(value?: number) {
  emit('update:modelValue', value);
  emit('change', value);
}

/** 获取产品列表 */
async function getProductList() {
  try {
    productLoading.value = true;
    const res = await getSimpleProductList();
    productList.value = res || [];
  } catch (error) {
    console.error('获取产品列表失败:', error);
    productList.value = [];
  } finally {
    productLoading.value = false;
  }
}

/** 组件挂载时获取产品列表 */
onMounted(() => {
  getProductList();
});
</script>

<template>
  <Select
    :value="modelValue"
    @change="(value: any) => handleChange(value)"
    placeholder="请选择产品"
    show-search
    allow-clear
    class="w-full"
    option-label-prop="label"
    option-filter-prop="label"
    :loading="productLoading"
    :options="productOptions"
  >
    <template #optionRender="{ option }">
      <div class="py-[4px] flex w-full items-center justify-between">
        <div class="flex-1">
          <div class="text-[14px] font-medium mb-[2px] text-foreground">
            {{ option.data.raw.name }}
          </div>
          <div class="text-[12px] text-muted-foreground">
            {{ option.data.raw.productKey }}
          </div>
        </div>
        <DictTag
          :type="DICT_TYPE.IOT_PRODUCT_STATUS"
          :value="option.data.raw.status"
        />
      </div>
    </template>
  </Select>
</template>
