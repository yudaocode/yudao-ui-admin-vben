<script setup lang="ts">
import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';
import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { createProduct, getProduct, updateProduct, type IotProductApi } from '#/api/iot/product/product';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

defineOptions({ name: 'IoTProductForm' });

const emit = defineEmits(['success']);
const formData = ref<any>();
const getTitle = computed(() => {
  return formData.value?.id ? '编辑产品' : '新增产品';
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
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
    const data = (await formApi.getValues()) as IotProductApi.Product;
    try {
      await (formData.value?.id ? updateProduct(data) : createProduct(data));
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
    const data = modalApi.getData<any>();
    if (!data || !data.id) {
      // 设置默认值
      await formApi.setValues({
        deviceType: 0, // 默认直连设备
        dataFormat: 1, // 默认 JSON
        validateType: 1, // 默认设备密钥
        status: 0, // 默认启用
      });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getProduct(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/5">
    <Form class="mx-4" />
  </Modal>
</template>
