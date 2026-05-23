<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { WmsItemBrandApi } from '#/api/wms/md/item/brand';

import { computed, onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getItemBrandSimpleList } from '#/api/wms/md/item/brand';

defineOptions({ name: 'WmsItemBrandSelect', inheritAttrs: false });

withDefaults(
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
      value: brand.id,
    })),
);

/** 选中变化 */
function handleChange(value: SelectValue) {
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
  <Select
    v-bind="$attrs"
    :allow-clear="allowClear"
    :disabled="disabled"
    :loading="loading"
    :options="options"
    :placeholder="placeholder"
    :value="modelValue"
    class="w-full"
    option-filter-prop="label"
    show-search
    @change="handleChange"
  />
</template>
