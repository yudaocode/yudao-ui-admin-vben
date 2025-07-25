<script lang="ts" setup>
import type { ErpPurchaseOrderApi } from '#/api/erp/purchase/order';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createPurchaseOrder,
  getPurchaseOrder,
  updatePurchaseOrder,
} from '#/api/erp/purchase/order';

import { useFormSchema } from '../data';
import PurchaseOrderItemForm from './PurchaseOrderItemForm.vue';

const emit = defineEmits(['success']);
const formData = ref<ErpPurchaseOrderApi.PurchaseOrder>();
const formType = ref('');
const itemFormRef = ref();

const getTitle = computed(() => {
  if (formType.value === 'create') return '添加采购订单';
  if (formType.value === 'update') return '编辑采购订单';
  return '采购订单详情';
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 120,
  },
  wrapperClass: 'grid-cols-3',
  layout: 'vertical',
  schema: useFormSchema(),
  showDefaultActions: false,
  handleValuesChange: (values, changedFields) => {
    if (formData.value && changedFields.includes('discountPercent')) {
      formData.value.discountPercent = values.discountPercent;
    }
  },
});

const handleUpdateItems = (items: ErpPurchaseOrderApi.PurchaseOrderItem[]) => {
  formData.value = modalApi.getData<ErpPurchaseOrderApi.PurchaseOrder>();
  if (formData.value) {
    formData.value.items = items;
  }
};

const handleUpdateDiscountPrice = (discountPrice: number) => {
  if (formData.value) {
    formData.value.discountPrice = discountPrice;
    formApi.setValues({
      discountPrice: formData.value.discountPrice,
    });
  }
};

const handleUpdateTotalPrice = (totalPrice: number) => {
  if (formData.value) {
    formData.value.totalPrice = totalPrice;
    formApi.setValues({
      totalPrice: formData.value.totalPrice,
    });
  }
};

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // 验证子表单
    if (itemFormRef.value && typeof itemFormRef.value.validate === 'function') {
      await itemFormRef.value.validate();
    }
    modalApi.lock();
    // 提交表单
    const data =
      (await formApi.getValues()) as ErpPurchaseOrderApi.PurchaseOrder;
    data.items =
      itemFormRef.value && typeof itemFormRef.value.getData === 'function'
        ? itemFormRef.value.getData()
        : [];
    try {
      await (formType.value === 'create'
        ? createPurchaseOrder(data)
        : updatePurchaseOrder(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success(formType.value === 'create' ? '新增成功' : '更新成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ id?: number; type: string }>();
    if (!data || !data.id) {
      return;
    }
    formType.value = data.type;
    modalApi.lock();
    try {
      formData.value = await getPurchaseOrder(data.id);
      formData.value.orderTime = formatDateTime(formData.value.orderTime);
      // 设置到 values
      await formApi.setValues(formData.value);
      // 初始化子表单
      itemFormRef.value?.init(formData.value.items || []);
    } finally {
      modalApi.unlock();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal
    v-bind="$attrs"
    :title="getTitle"
    class="w-1/2"
    :closable="true"
    :mask-closable="true"
  >
    <Form class="mx-3">
      <template #product="slotProps">
        <PurchaseOrderItemForm
          v-bind="slotProps"
          ref="itemFormRef"
          class="w-full"
          :items="formData?.items ?? []"
          :disabled="formType === 'detail'"
          :discount-percent="formData?.discountPercent ?? 0"
          @update:items="handleUpdateItems"
          @update:discount-price="handleUpdateDiscountPrice"
          @update:total-price="handleUpdateTotalPrice"
        />
      </template>
    </Form>
  </Modal>
</template>
