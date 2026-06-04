<script lang="ts" setup>
import type { MesWmPackageLineApi } from '#/api/mes/wm/packages/line';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createPackageLine,
  getPackageLine,
  updatePackageLine,
} from '#/api/mes/wm/packages/line';
import { $t } from '#/locales';

import { useLineFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesWmPackageLineApi.PackageLine>();
const packageId = ref<number>();

const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['装箱明细'])
    : $t('ui.actionTitle.create', ['装箱明细']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useLineFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MesWmPackageLineApi.PackageLine;
    data.packageId = packageId.value;
    try {
      await (formData.value?.id
        ? updatePackageLine({ ...data, id: formData.value.id })
        : createPackageLine(data));
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
    const data = modalApi.getData<{ id?: number; packageId: number }>();
    packageId.value = data.packageId;
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getPackageLine(data.id);
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
    <Form />
  </Modal>
</template>
