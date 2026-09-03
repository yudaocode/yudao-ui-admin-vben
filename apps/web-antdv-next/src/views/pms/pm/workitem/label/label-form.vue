<script lang="ts" setup>
import type { PmsWorkItemLabelApi } from '#/api/pms/pm/workitem/label';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';
// TODO @AI：useVbenForm 从 #/adapter/form 引入，对齐 system user；PMS 里好些 form 都从 @vben/common-ui 拿，三端一并改。

import { useVbenForm } from '#/adapter/form';
import {
  createWorkItemLabel,
  getWorkItemLabelList,
  updateWorkItemLabel,
} from '#/api/pms/pm/workitem/label';
import { $t } from '#/locales';

import { useLabelFormSchema } from './data';

defineOptions({ name: 'PmsWorkItemLabelForm' });

const emit = defineEmits(['success']);

const formData = ref<PmsWorkItemLabelApi.WorkItemLabel>();

const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['标签'])
    : $t('ui.actionTitle.create', ['标签']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useLabelFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const values = await formApi.getValues();
    // id 不属于表单 schema，setValues 会过滤，需要从表单外保存的对象取回
    const data: PmsWorkItemLabelApi.WorkItemLabel = {
      id: formData.value?.id,
      name: values.name,
      color: values.color,
    };
    try {
      await (formData.value?.id
        ? updateWorkItemLabel(data)
        : createWorkItemLabel(data));
      await modalApi.close();
      emit('success');
      message.success(formData.value?.id ? '更新成功' : '创建成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    const data = modalApi.getData() as undefined | { id?: number };
    if (!data?.id) {
      formData.value = undefined;
      await formApi.setValues({ name: '', color: '#409EFF' });
      return;
    }
    // 标签没有独立的详情接口，通过列表反查标签详情
    const label = (await getWorkItemLabelList()).find(
      (item) => item.id === data.id,
    );
    formData.value = label;
    await formApi.setValues(label ?? { name: '', color: '#409EFF' });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[460px]">
    <Form class="mx-4" />
  </Modal>
</template>
