<script lang="ts" setup>
import type { MesDvMachineryTypeApi } from '#/api/mes/dv/machinery/type';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createMachineryType,
  getMachineryType,
  updateMachineryType,
} from '#/api/mes/dv/machinery/type';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesDvMachineryTypeApi.MachineryType>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['设备类型'])
    : $t('ui.actionTitle.create', ['设备类型']);
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
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MesDvMachineryTypeApi.MachineryType;
    try {
      await (formData.value?.id
        ? updateMachineryType(data)
        : createMachineryType(data));
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
    const data = modalApi.getData<MesDvMachineryTypeApi.MachineryType>();
    formApi.setState({
      schema: useFormSchema(data?.id ? 'update' : 'create', formApi),
    });
    if (!data || !data.id) {
      formData.value = data || undefined;
      if (data) {
        // 设置上级类型
        await formApi.setValues(data);
      }
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getMachineryType(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/3">
    <Form class="mx-4" />
  </Modal>
</template>
