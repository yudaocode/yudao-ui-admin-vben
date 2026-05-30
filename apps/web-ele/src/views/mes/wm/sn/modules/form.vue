<script lang="ts" setup>
import type { MesWmSnApi } from '#/api/mes/wm/sn';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { generateSnCodes } from '#/api/mes/wm/sn';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
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
    const data = (await formApi.getValues()) as MesWmSnApi.SnGenerate;
    try {
      await generateSnCodes(data);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success('生成成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    await formApi.resetForm();
    await formApi.setValues({ count: 100 });
  },
});
</script>

<template>
  <Modal :title="$t('ui.actionTitle.create', ['SN 码'])" class="w-1/2">
    <Form class="mx-4" />
  </Modal>
</template>
