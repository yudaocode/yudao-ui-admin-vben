<script lang="ts" setup>
import type { ErpSaleOrderApi } from '#/api/erp/sale/order';
import type { ErpSaleOutApi } from '#/api/erp/sale/out';

import { computed, nextTick, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createSaleOut, getSaleOut, updateSaleOut } from '#/api/erp/sale/out';

import { useFormSchema } from '../data';
import ItemForm from './item-form.vue';
import SelectSaleOrderForm from './select-sale-order-form.vue';

const emit = defineEmits(['success']);
const formData = ref<
  ErpSaleOutApi.SaleOut & {
    accountId?: number;
    customerId?: number;
    discountedPrice?: number;
    discountPercent?: number;
    fileUrl?: string;
    order?: ErpSaleOrderApi.SaleOrder;
    orderId?: number;
    orderNo?: string;
  }
>({
  id: undefined,
  no: undefined,
  accountId: undefined,
  outTime: undefined,
  remark: undefined,
  fileUrl: undefined,
  discountPercent: 0,
  customerId: undefined,
  discountPrice: 0,
  totalPrice: 0,
  otherPrice: 0,
  discountedPrice: 0,
  items: [],
});
const formType = ref(''); // 表单类型：'create' | 'edit' | 'detail'
const itemFormRef = ref<InstanceType<typeof ItemForm>>();

/* eslint-disable unicorn/no-nested-ternary */
const getTitle = computed(() =>
  formType.value === 'create'
    ? $t('ui.actionTitle.create', ['销售出库'])
    : formType.value === 'edit'
      ? $t('ui.actionTitle.edit', ['销售出库'])
      : '销售出库详情',
);

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
      // TODO @芋艿：是否需要，去掉？
      formApi.setValues(formData.value, false);
    }
  },
});

/** 更新销售出库项 */
const handleUpdateItems = async (items: ErpSaleOutApi.SaleOutItem[]) => {
  if (formData.value) {
    const data = await formApi.getValues();
    formData.value = { ...data, items };
    // TODO @芋艿：是否需要，去掉？
    await formApi.setValues(formData.value, false);
  }
};

/** 选择销售订单 */
// TODO @AI：不确定
const handleUpdateOrder = (order: ErpSaleOrderApi.SaleOrder) => {
  formData.value = {
    ...formData.value,
    orderId: order.id,
    orderNo: order.no!,
    customerId: order.customerId!,
    accountId: order.accountId!,
    remark: order.remark!,
    discountPercent: order.discountPercent!,
    fileUrl: order.fileUrl!,
  };
  // 将订单项设置到出库单项
  order.items!.forEach((item: any) => {
    item.totalCount = item.count;
    item.count = item.totalCount - item.outCount;
    item.orderItemId = item.id;
    item.id = undefined;
  });
  formData.value.items = order.items!.filter(
    (item) => item.count && item.count > 0,
  ) as ErpSaleOutApi.SaleOutItem[];

  formApi.setValues(formData.value, false);
};

// TODO @AI：不确定
// watch(
//   () => formData.value.items!,
//   (newItems: ErpSaleOutApi.SaleOutItem[]) => {
//     if (newItems && newItems.length > 0) {
//       // 计算每个产品的总价、税额和总价
//       newItems.forEach((item) => {
//         item.totalProductPrice = (item.productPrice || 0) * (item.count || 0);
//         item.taxPrice =
//           (item.totalProductPrice || 0) * ((item.taxPercent || 0) / 100);
//         item.totalPrice = (item.totalProductPrice || 0) + (item.taxPrice || 0);
//       });
//       // 计算总价
//       formData.value.totalPrice = newItems.reduce((sum, item) => {
//         return sum + (item.totalProductPrice || 0) + (item.taxPrice || 0);
//       }, 0);
//     } else {
//       formData.value.totalPrice = 0;
//     }
//     // 优惠金额
//     formData.value.discountPrice =
//       ((formData.value.totalPrice || 0) *
//         (formData.value.discountPercent || 0)) /
//       100;
//     // 优惠后价格
//     formData.value.discountedPrice =
//       formData.value.totalPrice - formData.value.discountPrice;
//
//     // 计算最终价格(包含其他费用)
//     formData.value.totalPrice =
//       formData.value.discountedPrice + (formData.value.otherPrice || 0);
//     formApi.setValues(formData.value, false);
//   },
//   { immediate: true },
// );

/** 创建或更新销售出库 */
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const itemFormInstance = Array.isArray(itemFormRef.value)
      ? itemFormRef.value[0]
      : itemFormRef.value;
    try {
      itemFormInstance.validate();
    } catch (error: any) {
      message.error(error.message || '子表单验证失败');
      return;
    }

    // 验证产品清单不能为空
    // TODO @芋艿：需要校验么？
    if (!formData.value?.items || formData.value.items.length === 0) {
      message.error('产品清单不能为空，请至少添加一个产品');
      return;
    }

    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as ErpSaleOutApi.SaleOut;
    data.items = formData.value?.items?.map((item) => ({
      ...item,
      // 解决新增销售出库报错
      id: undefined,
    }));
    try {
      await (formType.value === 'create'
        ? createSaleOut(data)
        : updateSaleOut(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
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
        outTime: undefined,
        remark: undefined,
        fileUrl: undefined,
        discountPercent: 0,
        customerId: undefined,
        discountPrice: 0,
        totalPrice: 0,
        otherPrice: 0,
        items: [],
      };
      await formApi.setValues(formData.value, false);
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
        outTime: undefined,
        remark: undefined,
        fileUrl: undefined,
        discountPercent: 0,
        customerId: undefined,
        discountPrice: 0,
        totalPrice: 0,
        otherPrice: 0,
        items: [],
      } as unknown as ErpSaleOutApi.SaleOut;
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
      formData.value = await getSaleOut(data.id);

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
    :title="getTitle"
    class="w-3/4"
    :show-confirm-button="formType !== 'detail'"
  >
    <Form class="mx-3">
      <template #items>
        <ItemForm
          ref="itemFormRef"
          :items="formData?.items ?? []"
          :disabled="formType === 'detail'"
          @update:items="handleUpdateItems"
        />
      </template>
      <template #orderNo>
        <SelectSaleOrderForm
          :order-no="formData?.orderNo"
          @update:order="handleUpdateOrder"
        />
      </template>
    </Form>
  </Modal>
</template>
