<script lang="ts" setup>
import type { ErpSupplierApi } from '#/api/erp/purchase/supplier';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createSupplier,
  getSupplier,
  updateSupplier,
} from '#/api/erp/purchase/supplier';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const formType = ref<'create' | 'update'>('create');
const supplierId = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
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
    const data = (await formApi.getValues()) as ErpSupplierApi.Supplier;
    try {
      if (formType.value === 'create') {
        await createSupplier(data);
        message.success($t('ui.actionMessage.createSuccess'));
      } else {
        await updateSupplier(data);
        message.success($t('ui.actionMessage.updateSuccess'));
      }
      // 关闭并提示
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ id?: number; type: 'create' | 'update' }>();
    if (!data) {
      return;
    }
    formType.value = data.type;
    supplierId.value = data.id;

    modalApi.lock();
    try {
      if (data.type === 'update' && data.id) {
        // 编辑模式，加载数据
        const supplierData = await getSupplier(data.id);
        await formApi.setValues(supplierData);
      }
    } finally {
      modalApi.unlock();
    }
  },
});

defineExpose({
  modalApi,
});
</script>

<template>
  <Modal
    :title="formType === 'create' ? '新增供应商' : '编辑供应商'"
    class="w-3/5"
  >
    <Form class="mx-4" />
  </Modal>
</template>
