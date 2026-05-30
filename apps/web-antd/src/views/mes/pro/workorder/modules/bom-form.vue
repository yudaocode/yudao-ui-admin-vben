<script lang="ts" setup>
import type { MesProWorkOrderBomApi } from '#/api/mes/pro/workorder/bom';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createWorkOrderBom,
  getWorkOrderBom,
  updateWorkOrderBom,
} from '#/api/mes/pro/workorder/bom';
import { $t } from '#/locales';

import { useBomFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesProWorkOrderBomApi.WorkOrderBom>();
const workOrderId = ref<number>(); // 所属工单编号

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['BOM 物料'])
    : $t('ui.actionTitle.create', ['BOM 物料']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data =
      (await formApi.getValues()) as MesProWorkOrderBomApi.WorkOrderBom;
    data.workOrderId = workOrderId.value;
    try {
      await (formData.value?.id
        ? updateWorkOrderBom({ ...data, id: formData.value.id })
        : createWorkOrderBom(data));
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
    const data = modalApi.getData<{
      id?: number;
      productId?: number;
      workOrderId: number;
    }>();
    workOrderId.value = data.workOrderId;
    formApi.setState({
      schema: useBomFormSchema(!data.id, data.productId, formApi),
    });
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getWorkOrderBom(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/5">
    <Form class="mx-4" />
  </Modal>
</template>
