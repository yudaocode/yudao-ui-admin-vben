<script lang="ts" setup>
import type { WmsItemCategoryApi } from '#/api/wms/md/item/category';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum } from '@vben/constants';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createItemCategory,
  getItemCategory,
  updateItemCategory,
} from '#/api/wms/md/item/category';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

defineOptions({ name: 'WmsItemCategoryForm' });

const emit = defineEmits(['success']);
const formData = ref<WmsItemCategoryApi.ItemCategory>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['商品分类'])
    : $t('ui.actionTitle.create', ['商品分类']);
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
    const data = (await formApi.getValues()) as WmsItemCategoryApi.ItemCategory;
    try {
      await (formData.value?.id
        ? updateItemCategory(data)
        : createItemCategory(data));
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
    formApi.setState({ schema: useFormSchema(formApi) });
    const data = modalApi.getData<WmsItemCategoryApi.ItemCategory>();
    if (!data || !data.id) {
      formData.value = data;
      await formApi.setValues({
        sort: 0,
        status: CommonStatusEnum.ENABLE,
        ...data,
      });
      return;
    }
    // 加载数据
    modalApi.lock();
    try {
      formData.value = await getItemCategory(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/4">
    <Form class="mx-4" />
  </Modal>
</template>
