<script lang="ts" setup>
import type { MesProCardProcessApi } from '#/api/mes/pro/card/process';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createCardProcess,
  getCardProcess,
  updateCardProcess,
} from '#/api/mes/pro/card/process';
import { $t } from '#/locales';

import { useProcessFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesProCardProcessApi.CardProcess>();
const cardId = ref<number>(); // 所属流转卡编号

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['工序记录'])
    : $t('ui.actionTitle.create', ['工序记录']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 110,
  },
  layout: 'horizontal',
  schema: useProcessFormSchema(),
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
      (await formApi.getValues()) as MesProCardProcessApi.CardProcess;
    data.cardId = cardId.value;
    try {
      await (formData.value?.id
        ? updateCardProcess({ ...data, id: formData.value.id })
        : createCardProcess(data));
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
    const data = modalApi.getData<{ cardId: number; id?: number }>();
    cardId.value = data.cardId;
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getCardProcess(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
  </Modal>
</template>
