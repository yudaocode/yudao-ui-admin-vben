<script lang="ts" setup>
import type { MesWmSalesNoticeLineApi } from '#/api/mes/wm/salesnotice/line';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createSalesNoticeLine,
  getSalesNoticeLine,
  updateSalesNoticeLine,
} from '#/api/mes/wm/salesnotice/line';
import { $t } from '#/locales';

import { useLineFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesWmSalesNoticeLineApi.SalesNoticeLine>();
const noticeId = ref<number>(); // 所属通知单编号

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['发货通知单行'])
    : $t('ui.actionTitle.create', ['发货通知单行']);
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
      (await formApi.getValues()) as MesWmSalesNoticeLineApi.SalesNoticeLine;
    data.noticeId = noticeId.value;
    try {
      await (formData.value?.id
        ? updateSalesNoticeLine({ ...data, id: formData.value.id })
        : createSalesNoticeLine(data));
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
    const data = modalApi.getData<{ id?: number; noticeId: number }>();
    noticeId.value = data.noticeId;
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getSalesNoticeLine(data.id);
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
