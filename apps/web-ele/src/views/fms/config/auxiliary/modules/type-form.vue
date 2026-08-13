<script lang="ts" setup>
import type { FmsAuxiliaryTypeApi } from '#/api/fms/config/auxiliary/type';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import {
  createAuxiliaryType,
  updateAuxiliaryType,
} from '#/api/fms/config/auxiliary/type';
import { $t } from '#/locales';
import { useFmsStore } from '#/views/fms/store/fms';

import { useTypeFormSchema } from '../data';

defineOptions({ name: 'FmsAuxiliaryTypeForm' });

const emit = defineEmits(['success']);

const fmsStore = useFmsStore();

const formData = ref<FmsAuxiliaryTypeApi.AuxiliaryType>(); // 编辑时的类别
const getTitle = computed(() =>
  formData.value?.id ? '编辑类别' : '新增类别',
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useTypeFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const accountSetId = fmsStore.getAccountSetId;
    if (!accountSetId) {
      return;
    }
    modalApi.lock();
    const values = await formApi.getValues();
    const data: FmsAuxiliaryTypeApi.AuxiliaryType = formData.value?.id
      ? { ...formData.value, name: values.name }
      : { accountSetId, name: values.name };
    try {
      await (formData.value?.id
        ? updateAuxiliaryType(data)
        : createAuxiliaryType(data));
      await modalApi.close();
      emit('success');
      ElMessage.success(
        $t(
          formData.value?.id
            ? 'ui.actionMessage.updateSuccess'
            : 'ui.actionMessage.createSuccess',
        ),
      );
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    const data = modalApi.getData<FmsAuxiliaryTypeApi.AuxiliaryType>();
    formData.value = data?.id ? data : undefined;
    await formApi.setValues({ name: data?.name ?? '' });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[420px]">
    <Form class="mx-4" />
  </Modal>
</template>
