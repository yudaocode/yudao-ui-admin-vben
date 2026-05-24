<script lang="ts" setup>
import type { MesDvMachineryTypeApi } from '#/api/mes/dv/machinery/type';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createMachineryType,
  getMachineryType,
  updateMachineryType,
} from '#/api/mes/dv/machinery/type';
import { $t } from '#/locales';

import { useFormSchema } from '../data';


const emit = defineEmits(['success']);
const formMode = ref<'create' | 'update'>('create'); // 表单模式
const getTitle = computed(() => (formMode.value === 'create' ? '新增设备类型' : '修改设备类型'));

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

/** 表单 schema 需要 formApi 引用，所以通过 setState 设置 schema */
formApi.setState({ schema: useFormSchema(formApi) });

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
      await (data.id ? updateMachineryType(data) : createMachineryType(data));
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    await formApi.resetForm();
    const data = modalApi.getData<{ id?: number; parentId?: number; type?: 'create' | 'update' }>();
    formMode.value = data?.type || 'create';
    if (!data?.id) {
      await formApi.setValues({ parentId: data?.parentId ?? 0 });
      return;
    }
    modalApi.lock();
    try {
      await formApi.setValues(await getMachineryType(data.id));
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
