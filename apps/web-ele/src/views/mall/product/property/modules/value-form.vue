<script lang="ts" setup>
import type { MallPropertyApi } from '#/api/mall/product/property';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createPropertyValue,
  getPropertyValue,
  updatePropertyValue,
} from '#/api/mall/product/property';
import { $t } from '#/locales';

import { useValueFormSchema } from '../data';

defineOptions({ name: 'MallPropertyValueForm' });

const emit = defineEmits(['success']);
const formData = ref<MallPropertyApi.PropertyValue>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['属性值'])
    : $t('ui.actionTitle.create', ['属性值']);
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
  schema: useValueFormSchema(),
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
    const data = (await formApi.getValues()) as MallPropertyApi.PropertyValue;
    try {
      await (formData.value?.id
        ? updatePropertyValue(data)
        : createPropertyValue(data));
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
    const data = modalApi.getData<
      MallPropertyApi.PropertyValue | { propertyId?: string }
    >();

    // 如果有ID，表示是编辑
    if (data && 'id' in data && data.id) {
      modalApi.lock();
      try {
        formData.value = await getPropertyValue(data.id as number);
        // 设置到 values
        if (formData.value) {
          await formApi.setValues(formData.value);
        }
      } finally {
        modalApi.unlock();
      }
    } else if (data && 'propertyId' in data && data.propertyId) {
      // 新增时，如果传入了propertyId，则需要设置
      await formApi.setValues({
        propertyId: data.propertyId,
      });
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
