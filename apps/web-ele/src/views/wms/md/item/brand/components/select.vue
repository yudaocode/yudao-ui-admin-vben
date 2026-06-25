<script lang="ts" setup>
import type { WmsItemBrandApi } from '#/api/wms/md/item/brand';

import { computed, onMounted, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getItemBrandSimpleList } from '#/api/wms/md/item/brand';

defineOptions({ name: 'WmsItemBrandSelect', inheritAttrs: false });

withDefaults(
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
    placeholder: '请选择商品品牌',
  },
);

const emit = defineEmits<{
  change: [brand: undefined | WmsItemBrandApi.ItemBrand];
  'update:modelValue': [value: number | undefined];
}>();

const loading = ref(false);
const brandList = ref<WmsItemBrandApi.ItemBrand[]>([]);

const options = computed(() =>
  brandList.value
    .filter((brand) => brand.id !== undefined)
    .map((brand) => ({
      label: brand.name,
      value: brand.id!,
    })),
);

/** 选中变化 */
function handleChange(value: number | string | undefined) {
  const brandId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', brandId);
  emit(
    'change',
    brandList.value.find((brand) => brand.id === brandId),
  );
}

/** 查询商品品牌精简列表 */
async function getList() {
  loading.value = true;
  try {
    brandList.value = await getItemBrandSimpleList();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  getList();
});
</script>

<template>
  <ElSelect
    v-bind="$attrs"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    :model-value="modelValue"
    :placeholder="placeholder"
    class="w-full"
    filterable
    @change="handleChange"
  >
    <ElOption
      v-for="option in options"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    />
  </ElSelect>
</template>
