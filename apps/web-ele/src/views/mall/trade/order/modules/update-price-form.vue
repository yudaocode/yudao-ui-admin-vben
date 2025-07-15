<script lang="ts" setup>
import type { MallOrderApi } from '#/api/mall/trade/order';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { floatToFixed2 } from '@vben/utils';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { updateOrderPrice } from '#/api/mall/trade/order';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const formData = ref<MallOrderApi.DeliveryRequest>();
const newPayPrice = ref<string>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    // TODO @xingyu：发货默认选中第一个？
    {
      fieldName: 'payPrice',
      label: '应付金额(总)',
      component: 'Input',
      componentProps: {
        placeholder: '请输入应付金额(总)',
        disabled: true,
        formatter: (value: string) => `${floatToFixed2(value)}元`,
      },
    },
    {
      fieldName: 'adjustPrice',
      label: '订单调价',
      component: 'InputNumber',
      componentProps: {
        class: 'w-100%',
        placeholder: '请输入订单调价',
        step: 0.1,
        precision: 2,
        onChange: async (value: number) => {
          const { payPrice } = await formApi.getValues();
          await formApi.setValues({
            newPayPrice: (payPrice + value * 100).toFixed(2),
          });
        },
      },
      description: '订单调价。 正数，加价；负数，减价',
    },
    {
      fieldName: 'newPayPrice',
      label: '调价后',
      component: 'Input',
      componentProps: {
        disabled: true,
        formatter: (value: string) => `${floatToFixed2(value)}元`,
      },
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MallOrderApi.PriceRequest;
    if (data.adjustPrice) {
      data.adjustPrice = data.adjustPrice * 100;
    }
    try {
      await updateOrderPrice(data);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
    const data = modalApi.getData<MallOrderApi.Order>();
    if (!data) {
      return;
    }
    modalApi.lock();
    try {
      newPayPrice.value = data.payPrice?.toString();
      data.adjustPrice = data.adjustPrice ? data.adjustPrice / 100 : 0;
      await formApi.setValues({
        id: data.id,
        payPrice: data.payPrice,
        adjustPrice: data.adjustPrice,
        newPayPrice: newPayPrice.value,
      });
      // 设置到 values
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-1/3" title="发货">
    <Form class="mx-4" />
  </Modal>
</template>
