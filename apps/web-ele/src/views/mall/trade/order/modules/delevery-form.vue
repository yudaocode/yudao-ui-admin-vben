<script lang="ts" setup>
import type { MallOrderApi } from '#/api/mall/trade/order';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { getSimpleDeliveryExpressList } from '#/api/mall/trade/delivery/express';
import { deliveryOrder } from '#/api/mall/trade/order';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const formData = ref<MallOrderApi.DeliveryRequest>();

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
      fieldName: 'expressType',
      label: '发货方式',
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '快递', value: 'express' },
          { label: '无需发货', value: 'none' },
        ],
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      fieldName: 'logisticsId',
      label: '物流公司',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleDeliveryExpressList,
        labelField: 'name',
        valueField: 'id',
      },
      dependencies: {
        triggerFields: ['expressType'],
        show: (values) => values.expressType === 'express',
      },
    },
    {
      fieldName: 'logisticsNo',
      label: '物流单号',
      component: 'Input',
      dependencies: {
        triggerFields: ['expressType'],
        show: (values) => values.expressType === 'express',
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
    const data = (await formApi.getValues()) as MallOrderApi.DeliveryRequest;
    if (data.expressType === 'none') {
      // 无需发货的情况
      data.logisticsId = 0;
      data.logisticsNo = '';
    }
    try {
      await deliveryOrder(data);
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
      if (data.logisticsId === 0) {
        await formApi.setValues({ expressType: 'none' });
      }
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
