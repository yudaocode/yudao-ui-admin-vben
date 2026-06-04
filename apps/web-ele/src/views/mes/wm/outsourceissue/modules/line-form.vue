<script lang="ts" setup>
import type { MesWmOutsourceIssueLineApi } from '#/api/mes/wm/outsourceissue/line';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createOutsourceIssueLine,
  getOutsourceIssueLine,
  updateOutsourceIssueLine,
} from '#/api/mes/wm/outsourceissue/line';
import { $t } from '#/locales';

import { useLineFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesWmOutsourceIssueLineApi.OutsourceIssueLine>();
const issueId = ref<number>(); // 所属发料单编号

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['物料发料单行'])
    : $t('ui.actionTitle.create', ['物料发料单行']);
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
  schema: useLineFormSchema(),
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
      (await formApi.getValues()) as MesWmOutsourceIssueLineApi.OutsourceIssueLine;
    data.issueId = issueId.value;
    try {
      await (formData.value?.id
        ? updateOutsourceIssueLine({ ...data, id: formData.value.id })
        : createOutsourceIssueLine(data));
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
    const data = modalApi.getData<{
      id?: number;
      issueId: number;
    }>();
    issueId.value = data.issueId;
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getOutsourceIssueLine(data.id);
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
