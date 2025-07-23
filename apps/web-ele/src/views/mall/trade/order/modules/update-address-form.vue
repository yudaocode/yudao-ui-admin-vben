<script lang="ts" setup>
import type { MallOrderApi } from '#/api/mall/trade/order';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { updateOrderAddress } from '#/api/mall/trade/order';
import { getAreaTree } from '#/api/system/area';
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
      fieldName: 'receiverName',
      label: '收件人',
      component: 'Input',
      componentProps: {
        placeholder: '请输入收件人名称',
      },
    },
    {
      fieldName: 'receiverMobile',
      label: '手机号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入收件人手机号',
      },
    },
    {
      fieldName: 'receiverAreaId',
      label: '所在地',
      component: 'ApiTreeSelect',
      componentProps: {
        api: () => getAreaTree(),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择收件人所在地',
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'receiverDetailAddress',
      label: '详细地址',
      component: 'Input',
      componentProps: {
        placeholder: '请输入收件人详细地址',
        type: 'textarea',
        rows: 3,
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
    const data = (await formApi.getValues()) as MallOrderApi.AddressRequest;
    try {
      await updateOrderAddress(data);
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
      await formApi.setValues({
        id: data.id,
        receiverName: data.receiverName,
        receiverMobile: data.receiverMobile,
        receiverAreaId: data.receiverAreaId,
        receiverDetailAddress: data.receiverDetailAddress,
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
