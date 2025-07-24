<script lang="ts" setup>
import type { ErpPurchaseOrderApi } from '#/api/erp/purchase/order';

import { computed, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { erpPriceMultiply, formatDateTime } from '@vben/utils';

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
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

/** 计算 discountPrice、totalPrice 价格 */
watch(
  () => [formData.value?.items, formData.value?.discountPercent],
  () => {
    if (!formData.value?.items) {
      return;
    }
    // 计算 discountPrice 价格
    let totalPrice = 0;
    formData.value.items.forEach((item) => {
      totalPrice += item.totalPrice || 0;
    });
    formData.value.discountPrice = erpPriceMultiply(
      totalPrice,
      formData.value.discountPercent / 100,
    );
    formData.value.totalPrice = totalPrice - formData.value.discountPrice;
    // 更新表单值
    formApi.setValues({
      discountPrice: formData.value.discountPrice,
      totalPrice: formData.value.totalPrice,
    });
  },
  { deep: true },
);

const handleUpdateItems = (items: ErpPurchaseOrderApi.PurchaseOrderItem[]) => {
  if (formData.value) {
    formData.value.items = items;
  }
};

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    await itemFormRef.value?.validate();
    modalApi.lock();
    // 提交表单
    const data =
      (await formApi.getValues()) as ErpPurchaseOrderApi.PurchaseOrder;
    data.items = itemFormRef.value?.getData();
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
    <Form />

    <!-- Tab卡片 -->
    <div class="border-border bg-card mt-4 rounded-lg border p-2">
      <a-tabs default-active-key="1">
        <a-tab-pane key="1" tab="订单产品清单">
          <div class="p-4">
            <PurchaseOrderItemForm
              ref="itemFormRef"
              :items="formData?.items || []"
              :disabled="formType === 'detail'"
              @update:items="handleUpdateItems"
            />
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </Modal>
</template>
