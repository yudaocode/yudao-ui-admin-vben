<script lang="ts" setup>
import type { Demo03StudentApi } from '#/api/infra/demo/demo03/erp';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createDemo03Course, getDemo03Course, updateDemo03Course } from '#/api/infra/demo/demo03/erp';
import { $t } from '#/locales';
import { computed, ref } from 'vue';

import { useDemo03CourseFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<Demo03StudentApi.Demo03Course>();
const getTitle = computed(() => {
  return formData.value?.id ? $t('ui.actionTitle.edit', ['学生课程']) : $t('ui.actionTitle.create', ['学生课程']);
});

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useDemo03CourseFormSchema(),
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
    const data = (await formApi.getValues()) as Demo03StudentApi.Demo03Course;
    data.studentId = formData.value?.studentId;
    try {
      await (formData.value?.id ? updateDemo03Course(data) : createDemo03Course(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
        key: 'action_process_msg',
      });
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }

    // 加载数据
    let data = modalApi.getData<Demo03StudentApi.Demo03Course>();
    if (!data) {
      return;
    }
    if (data.id) {
      modalApi.lock();
      try {
        data = await getDemo03Course(data.id);
      } finally {
        modalApi.lock(false);
      }
    }
    // 设置到 values
    formData.value = data;
    await formApi.setValues(formData.value);
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
