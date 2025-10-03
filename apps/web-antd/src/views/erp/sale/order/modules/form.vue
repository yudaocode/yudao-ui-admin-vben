<script lang="ts" setup>
import type { ErpSaleOrderApi } from '#/api/erp/sale/order';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createSaleOrder,
  getSaleOrder,
  updateSaleOrder,
} from '#/api/erp/sale/order';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import ItemForm from './item-form.vue';

const emit = defineEmits(['success']);
const formData = ref<ErpSaleOrderApi.SaleOrder>();
const formType = ref(''); // 表单类型：'create' | 'edit' | 'detail'
const itemFormRef = ref<InstanceType<typeof ItemForm>>();

/* eslint-disable unicorn/no-nested-ternary */
const getTitle = computed(() =>
  formType.value === 'create'
    ? $t('ui.actionTitle.create', ['销售订单'])
    : formType.value === 'edit'
      ? $t('ui.actionTitle.edit', ['销售订单'])
      : '销售订单详情',
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 120,
    // disabled: !['create', 'edit'].includes(formType.value), // TODO @芋艿：这里晚点处理下；
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

/** 更新商品项 */
const handleUpdateItems = (items: ErpSaleOrderApi.SaleOrderItem[]) => {
  formData.value = modalApi.getData<ErpSaleOrderApi.SaleOrder>();
  if (formData.value) {
    formData.value.items = items;
  }
};

/** 更新优惠金额 */
const handleUpdateDiscountPrice = (discountPrice: number) => {
  if (formData.value) {
    formData.value.discountPrice = discountPrice;
    formApi.setValues({
      discountPrice: formData.value.discountPrice,
    });
  }
};

/** 更新总金额 */
const handleUpdateTotalPrice = (totalPrice: number) => {
  if (formData.value) {
    formData.value.totalPrice = totalPrice;
    formApi.setValues({
      totalPrice: formData.value.totalPrice,
    });
  }
};

/** 创建或更新销售订单 */
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

    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as ErpSaleOrderApi.SaleOrder;
    data.items = formData.value?.items;
    try {
      await (formType.value === 'create'
        ? createSaleOrder(data)
        : updateSaleOrder(data));
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
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ id?: number; type: string }>();
    formType.value = data.type;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getSaleOrder(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
      // TODO @AI：默认账户；缺少；
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    v-bind="$attrs"
    :title="getTitle"
    class="w-3/4"
    :closable="true"
    :mask-closable="true"
    :show-confirm-button="formType !== 'detail'"
  >
    <Form class="mx-3">
      <template #product="slotProps">
        <ItemForm
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
