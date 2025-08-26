<script lang="ts" setup>
import type { ErpPurchaseOrderApi } from '#/api/erp/purchase/order';

import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, message, Modal } from 'ant-design-vue';

import SelectPurchaseOrderGrid from './select-purchase-order-grid.vue';

const props = defineProps({
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
  'update:order': [order: ErpPurchaseOrderApi.PurchaseOrder];
}>();
const order = ref<ErpPurchaseOrderApi.PurchaseOrder>();
const open = ref<boolean>(false);
const handleSelectOrder = (selectorder: ErpPurchaseOrderApi.PurchaseOrder) => {
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
          :style="{ cursor: props.disabled ? 'not-allowed' : 'pointer' }"
          @click="() => !props.disabled && (open = true)"
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
    <SelectPurchaseOrderGrid @select-row="handleSelectOrder" />
  </Modal>
</template>
