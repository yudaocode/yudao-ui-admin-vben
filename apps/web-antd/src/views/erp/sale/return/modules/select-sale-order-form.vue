<script lang="ts" setup>
import type { ErpSaleOrderApi } from '#/api/erp/sale/order';

import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, message, Modal } from 'ant-design-vue';

import SelectSaleOrderGrid from './select-sale-order-grid.vue';

defineProps({
  orderNo: {
    type: String,
    default: () => undefined,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits<{
  'update:order': [order: ErpSaleOrderApi.SaleOrder];
}>();
const order = ref<ErpSaleOrderApi.SaleOrder>();
const open = ref<boolean>(false);
const handleSelectOrder = (selectorder: ErpSaleOrderApi.SaleOrder) => {
  order.value = selectorder;
};

const handleOk = () => {
  if (!order.value) {
    message.warning('请选择一个采购订单');
    return;
  }
  emit('update:order', order.value);
  open.value = false;
};
</script>

<template>
  <Input
    v-bind="$attrs"
    readonly
    :value="orderNo"
    :disabled="disabled"
    @click="() => !disabled && (open = true)"
  >
    <template #addonAfter>
      <div>
        <IconifyIcon
          class="h-full w-6 cursor-pointer"
          icon="ant-design:setting-outlined"
          :style="{ cursor: disabled ? 'not-allowed' : 'pointer' }"
          @click="() => !disabled && (open = true)"
        />
      </div>
    </template>
  </Input>
  <Modal
    v-model:open="open"
    title="选择关联订单"
    class="!w-[50vw]"
    :show-confirm-button="true"
    @ok="handleOk"
  >
    <SelectSaleOrderGrid @select-row="handleSelectOrder" />
  </Modal>
</template>
