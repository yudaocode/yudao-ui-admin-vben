<script lang="ts" setup>
import type { OaSupplyItemApi } from '#/api/oa/supply/item';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createSupplyItem,
  getSupplyItem,
  updateSupplyItem,
} from '#/api/oa/supply/item';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaSupplyItemApi.SupplyItem>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['办公用品'])
    : $t('ui.actionTitle.create', ['办公用品']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 90,
  },
  wrapperClass: 'grid-cols-2',
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
    const data = (await formApi.getValues()) as OaSupplyItemApi.SupplyItem;
    try {
      await (formData.value?.id
        ? updateSupplyItem(data)
        : createSupplyItem(data));
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
    const data = modalApi.getData() as OaSupplyItemApi.SupplyItem;
    if (!data || !data.id) {
      // 新增时，默认带入列表筛选的类别
      if (data?.category) {
        await formApi.setValues({ category: data.category });
      }
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getSupplyItem(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/2">
    <Form class="mx-4" />
  </Modal>
</template>
