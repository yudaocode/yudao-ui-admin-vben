<script lang="ts" setup>
import type { MesWmReturnIssueLineApi } from '#/api/mes/wm/returnissue/line';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createReturnIssueLine,
  getReturnIssueLine,
  updateReturnIssueLine,
} from '#/api/mes/wm/returnissue/line';
import { $t } from '#/locales';

import { useLineFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesWmReturnIssueLineApi.ReturnIssueLine>();
const issueId = ref<number>(); // 所属退料单编号

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['生产退料单行'])
    : $t('ui.actionTitle.create', ['生产退料单行']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-3',
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
      (await formApi.getValues()) as MesWmReturnIssueLineApi.ReturnIssueLine;
    data.issueId = issueId.value;
    try {
      await (formData.value?.id
        ? updateReturnIssueLine({ ...data, id: formData.value.id })
        : createReturnIssueLine(data));
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
    formApi.setState({ schema: useLineFormSchema(formApi) });
    // 加载数据
    const data = modalApi.getData<{ id?: number; issueId: number }>();
    issueId.value = data.issueId;
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getReturnIssueLine(data.id);
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
