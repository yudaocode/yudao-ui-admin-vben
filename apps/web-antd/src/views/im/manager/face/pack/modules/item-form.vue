<script lang="ts" setup>
import type { ImManagerFacePackItemVO } from '#/api/im/manager/face/item';

import { computed, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createManagerFacePackItem,
  getManagerFacePackItem,
  updateManagerFacePackItem,
} from '#/api/im/manager/face/item';
import { $t } from '#/locales';
import { probeImageSize } from '#/views/im/manager/utils/format';

import { useItemFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<ImManagerFacePackItemVO>();
const packId = ref(0);
const lastUrl = ref('');
const getTitle = computed(() => {
  return formData.value?.id ? '修改表情' : '新增表情';
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useItemFormSchema(),
  showDefaultActions: false,
});

/** 回填图片尺寸 */
async function applyImageSize(url?: string) {
  if (!url || url === lastUrl.value) {
    return;
  }
  lastUrl.value = url;
  try {
    const size = await probeImageSize(url);
    await formApi.setFieldValue('width', size.width);
    await formApi.setFieldValue('height', size.height);
  } catch {
    message.warning('图片尺寸探测失败，请手动填写宽高');
  }
}

watch(
  () => formApi.form.values?.url,
  (url) => {
    void applyImageSize(url as string | undefined);
  },
);

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const data = (await formApi.getValues()) as ImManagerFacePackItemVO;
    try {
      data.packId = data.packId || packId.value;
      await (formData.value?.id
        ? updateManagerFacePackItem(data)
        : createManagerFacePackItem(data));
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
      lastUrl.value = '';
      await formApi.resetForm();
      return;
    }
    const data = modalApi.getData<{ id?: number; packId: number }>();
    packId.value = data?.packId || 0;
    await formApi.setValues({ packId: packId.value, sort: 0 });
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getManagerFacePackItem(data.id);
      lastUrl.value = formData.value.url;
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
