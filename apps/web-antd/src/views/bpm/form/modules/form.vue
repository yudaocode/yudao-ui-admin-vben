<script lang="ts" setup>
import type { FcDesigner } from '@form-create/antd-designer';

import type { BpmFormApi } from '#/api/bpm/form';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createForm, updateForm } from '#/api/bpm/form';
import { $t } from '#/locales';
import { encodeConf, encodeFields } from '#/utils';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const designerComponent = ref<InstanceType<typeof FcDesigner>>();
const formData = ref<BpmFormApi.FormVO>();
const editorAction = ref<string>();

const getTitle = computed(() => {
  if (!formData.value?.id) {
    return $t('ui.actionTitle.create', ['流程表单']);
  }
  return editorAction.value === 'copy'
    ? $t('ui.actionTitle.copy', ['流程表单'])
    : $t('ui.actionTitle.edit', ['流程表单']);
});

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    modalApi.lock();
    try {
      const data = (await formApi.getValues()) as BpmFormApi.FormVO;

      data.conf = encodeConf(designerComponent);
      data.fields = encodeFields(designerComponent);

      const saveForm = async () => {
        if (!formData.value?.id) {
          return createForm(data);
        }
        return editorAction.value === 'copy'
          ? createForm(data)
          : updateForm(data);
      };

      await saveForm();
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
      designerComponent.value = undefined;
      return;
    }

    const data = modalApi.getData<any>();
    if (!data) return;

    designerComponent.value = data.designer;
    formData.value = data.formConfig;
    editorAction.value = data.action;

    if (editorAction.value === 'copy' && formData.value) {
      formData.value = {
        ...formData.value,
        name: `${formData.value.name}_copy`,
        id: undefined,
      };
    }

    try {
      if (formData.value) {
        await formApi.setValues(formData.value);
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[600px]">
    <Form class="mx-4" />
  </Modal>
</template>
