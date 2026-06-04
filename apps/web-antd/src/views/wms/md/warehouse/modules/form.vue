<script lang="ts" setup>
import type { WmsWarehouseApi } from '#/api/wms/md/warehouse';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createWarehouse,
  getWarehouse,
  updateWarehouse,
} from '#/api/wms/md/warehouse';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

defineOptions({ name: 'WmsWarehouseForm' });

const emit = defineEmits(['success']);
const formData = ref<WmsWarehouseApi.Warehouse>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['仓库'])
    : $t('ui.actionTitle.create', ['仓库']);
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
    const data = (await formApi.getValues()) as WmsWarehouseApi.Warehouse;
    try {
      await (formData.value?.id
        ? updateWarehouse(data)
        : createWarehouse(data));
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
    const data = modalApi.getData<WmsWarehouseApi.Warehouse>();
    if (!data || !data.id) {
      await formApi.setValues({ sort: 0 });
      return;
    }
    // 加载数据
    modalApi.lock();
    try {
      formData.value = await getWarehouse(data.id);
      // 设置到 values
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
