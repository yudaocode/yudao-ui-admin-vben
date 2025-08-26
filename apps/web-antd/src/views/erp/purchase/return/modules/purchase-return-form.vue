<script lang="ts" setup>
import type { ErpPurchaseOrderApi } from '#/api/erp/purchase/order';
import type { ErpPurchaseReturnApi } from '#/api/erp/purchase/return';

import { computed, nextTick, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createPurchaseReturn,
  getPurchaseReturn,
  updatePurchaseReturn,
} from '#/api/erp/purchase/return';

import { useFormSchema } from '../data';
import PurchaseReturnItemForm from './purchase-return-item-form.vue';
import SelectPurchaseOrderForm from './select-purchase-order-form.vue';

const emit = defineEmits(['success']);
const formData = ref<
  ErpPurchaseReturnApi.PurchaseReturn & {
    accountId?: number;
    discountedPrice?: number;
    discountPercent?: number;
    fileUrl?: string;
    orderId?: number;
    orderNo?: string;
    supplierId?: number;
  }
>({
  id: undefined,
  no: undefined,
  accountId: undefined,
  returnTime: undefined,
  remark: undefined,
  fileUrl: undefined,
  discountPercent: 0,
  supplierId: undefined,
  discountPrice: 0,
  totalPrice: 0,
  otherPrice: 0,
  discountedPrice: 0,
  items: [],
});
const formType = ref('');
const itemFormRef = ref();

const getTitle = computed(() => {
  if (formType.value === 'create') return '添加采购退货';
  if (formType.value === 'update') return '编辑采购退货';
  return '采购退货详情';
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
  schema: useFormSchema(formType.value),
  showDefaultActions: false,
  handleValuesChange: (values, changedFields) => {
    if (formData.value && changedFields.includes('otherPrice')) {
      formData.value.otherPrice = values.otherPrice;
      formData.value.totalPrice =
        (formData.value.discountedPrice || 0) +
        (formData.value.otherPrice || 0);

      formApi.setValues(formData.value, false);
    }
  },
});

// 更新采购退货项
const handleUpdateItems = async (
  items: ErpPurchaseReturnApi.PurchaseReturnItem[],
) => {
  if (formData.value) {
    const data =
      (await formApi.getValues()) as ErpPurchaseReturnApi.PurchaseReturn;
    formData.value = { ...data, items };
    formApi.setValues(formData.value, false);
  }
};

// 选择采购订单
const handleUpdateOrder = (order: ErpPurchaseOrderApi.PurchaseOrder) => {
  formData.value = {
    ...formData.value,
    orderId: order.id,
    orderNo: order.no!,
    supplierId: order.supplierId!,
    accountId: order.accountId!,
    remark: order.remark!,
    discountPercent: order.discountPercent!,
    fileUrl: order.fileUrl!,
  };
  // 将订单项设置到入库单项
  order.items!.forEach((item: any) => {
    item.totalCount = item.count;
    item.count = item.inCount - item.returnCount;
    item.orderItemId = item.id;
    item.id = undefined;
  });
  formData.value.items = order.items!.filter(
    (item) => item.count && item.count > 0,
  ) as ErpPurchaseReturnApi.PurchaseReturnItem[];

  formApi.setValues(formData.value, false);
};

watch(
  () => formData.value.items!,
  (newItems: ErpPurchaseReturnApi.PurchaseReturnItem[]) => {
    if (newItems && newItems.length > 0) {
      // 计算每个产品的总价、税额和总价
      newItems.forEach((item) => {
        item.totalProductPrice = (item.productPrice || 0) * (item.count || 0);
        item.taxPrice =
          (item.totalProductPrice || 0) * ((item.taxPercent || 0) / 100);
        item.totalPrice = (item.totalProductPrice || 0) + (item.taxPrice || 0);
      });
      // 计算总价
      const totalPrice = newItems.reduce((sum, item) => {
        return sum + (item.totalProductPrice || 0) + (item.taxPrice || 0);
      }, 0);
      formData.value.totalPrice = totalPrice;
    } else {
      formData.value.totalPrice = 0;
    }
    // 优惠金额
    formData.value.discountPrice =
      ((formData.value.totalPrice || 0) *
        (formData.value.discountPercent || 0)) /
      100;
    // 优惠后价格
    formData.value.discountedPrice =
      formData.value.totalPrice - formData.value.discountPrice;

    // 计算最终价格(包含其他费用)
    formData.value.totalPrice =
      formData.value.discountedPrice + (formData.value.otherPrice || 0);
    formApi.setValues(formData.value, false);
  },
  { immediate: true },
);

/**
 * 创建或更新采购退货
 */
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    await nextTick();

    const itemFormInstance = Array.isArray(itemFormRef.value)
      ? itemFormRef.value[0]
      : itemFormRef.value;
    if (itemFormInstance && typeof itemFormInstance.validate === 'function') {
      try {
        const isValid = await itemFormInstance.validate();
        if (!isValid) {
          message.error('子表单验证失败');
          return;
        }
      } catch (error: any) {
        message.error(error.message || '子表单验证失败');
        return;
      }
    } else {
      message.error('子表单验证方法不存在');
      return;
    }

    // 验证产品清单不能为空
    if (!formData.value?.items || formData.value.items.length === 0) {
      message.error('产品清单不能为空，请至少添加一个产品');
      return;
    }

    modalApi.lock();
    // 提交表单
    const data: ErpPurchaseReturnApi.PurchaseReturn = await formApi.getValues();
    data.items = formData.value?.items?.map((item) => ({
      ...item,
      // 解决新增采购退货报错
      id: undefined,
    }));
    try {
      await (formType.value === 'create'
        ? createPurchaseReturn(data)
        : updatePurchaseReturn(data));
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
      formData.value = {
        id: undefined,
        no: undefined,
        accountId: undefined,
        returnTime: undefined,
        remark: undefined,
        fileUrl: undefined,
        discountPercent: 0,
        supplierId: undefined,
        discountPrice: 0,
        totalPrice: 0,
        otherPrice: 0,
        items: [],
      };
      formApi.setValues(formData.value, false);
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ id?: number; type: string }>();
    if (!data) {
      return;
    }
    formType.value = data.type;
    formApi.updateSchema(useFormSchema(formType.value));

    if (!data.id) {
      // 初始化空的表单数据
      formData.value = {
        id: undefined,
        no: undefined,
        accountId: undefined,
        returnTime: undefined,
        remark: undefined,
        fileUrl: undefined,
        discountPercent: 0,
        supplierId: undefined,
        discountPrice: 0,
        totalPrice: 0,
        otherPrice: 0,
        items: [],
      } as unknown as ErpPurchaseReturnApi.PurchaseReturn;
      await nextTick();
      const itemFormInstance = Array.isArray(itemFormRef.value)
        ? itemFormRef.value[0]
        : itemFormRef.value;
      if (itemFormInstance && typeof itemFormInstance.init === 'function') {
        itemFormInstance.init([]);
      }
      return;
    }

    modalApi.lock();
    try {
      formData.value = await getPurchaseReturn(data.id);

      // 设置到 values
      await formApi.setValues(formData.value, false);
      // 初始化子表单
      await nextTick();
      const itemFormInstance = Array.isArray(itemFormRef.value)
        ? itemFormRef.value[0]
        : itemFormRef.value;
      if (itemFormInstance && typeof itemFormInstance.init === 'function') {
        itemFormInstance.init(formData.value.items || []);
      }
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
    class="w-2/3"
    :closable="true"
    :mask-closable="true"
    :show-confirm-button="formType !== 'detail'"
  >
    <Form class="mx-3">
      <template #product="slotProps">
        <PurchaseReturnItemForm
          v-bind="slotProps"
          ref="itemFormRef"
          class="w-full"
          :items="formData?.items ?? []"
          :disabled="formType === 'detail'"
          @update:items="handleUpdateItems"
        />
      </template>
      <template #orderNo="slotProps">
        <SelectPurchaseOrderForm
          v-bind="slotProps"
          :order-no="formData?.orderNo"
          @update:order="handleUpdateOrder"
        />
      </template>
    </Form>
  </Modal>
</template>
