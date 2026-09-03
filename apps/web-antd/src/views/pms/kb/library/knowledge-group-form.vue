<script lang="ts" setup>
import type { PmsKnowledgeGroupApi } from '#/api/pms/kb/library/group';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createKnowledgeGroup,
  getKnowledgeGroup,
  updateKnowledgeGroup,
} from '#/api/pms/kb/library/group';
import { $t } from '#/locales';
import { PmsKnowledgeGroupType } from '#/views/pms/kb/utils/constants';

defineOptions({ name: 'PmsKnowledgeGroupForm' });

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const formData = ref<PmsKnowledgeGroupApi.KnowledgeGroup>();

const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['分组'])
    : $t('ui.actionTitle.create', ['分组']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 90,
  },
  layout: 'horizontal',
  // TODO @AI：schema 放到 data.ts 的 useFormSchema，不要写在 vue 里，对齐 system user。
  schema: [
    {
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '请输入分组名称',
      },
      fieldName: 'name',
      label: '分组名称',
      rules: 'required',
    },
  ],
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
    const data: PmsKnowledgeGroupApi.KnowledgeGroup = {
      id: formData.value?.id,
      name: values.name.trim(),
      sort: formData.value?.sort ?? 0,
      type: formData.value?.type ?? PmsKnowledgeGroupType.CUSTOM,
    };
    try {
      await (formData.value?.id
        ? updateKnowledgeGroup(data)
        : createKnowledgeGroup(data));
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
    const data = modalApi.getData() as {
      formType: 'create' | 'update';
      id?: number;
    };
    if (!data.id) {
      formData.value = undefined;
      await formApi.setValues({ name: '' });
      return;
    }
    formData.value = await getKnowledgeGroup(data.id);
    await formApi.setValues({ name: formData.value.name });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
