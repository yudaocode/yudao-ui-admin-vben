<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { WmsMerchantApi } from '#/api/wms/md/merchant';

import { computed, onMounted, ref, watch } from 'vue';

import {
  CustomerMerchantTypeList,
  SupplierMerchantTypeList,
} from '@vben/constants';

import { Select } from 'ant-design-vue';

import { getMerchantSimpleList } from '#/api/wms/md/merchant';

defineOptions({ name: 'WmsMerchantSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    customer?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    supplier?: boolean;
  }>(),
  {
    allowClear: true,
    customer: false,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择往来企业',
    supplier: false,
  },
);

const emit = defineEmits<{
  change: [merchant: undefined | WmsMerchantApi.Merchant];
  'update:modelValue': [value: number | undefined];
}>();

const loading = ref(false);
const merchantList = ref<WmsMerchantApi.Merchant[]>([]);

const options = computed(() =>
  merchantList.value
    .filter((merchant) => merchant.id !== undefined)
    .map((merchant) => ({
      label: merchant.name,
      value: merchant.id,
    })),
);

/** 选中变化 */
function handleChange(value: SelectValue) {
  const merchantId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', merchantId);
  emit(
    'change',
    merchantList.value.find((merchant) => merchant.id === merchantId),
  );
}

/** 查询往来企业精简列表 */
async function getList() {
  let types: number[] | undefined;
  if (props.supplier) {
    types = SupplierMerchantTypeList;
  } else if (props.customer) {
    types = CustomerMerchantTypeList;
  }
  loading.value = true;
  try {
    merchantList.value = await getMerchantSimpleList(
      types ? { types } : undefined,
    );
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.supplier, props.customer],
  () => {
    getList();
  },
);

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
