<script lang="ts" setup>
import type { Demo02CategoryApi } from '#/api/infra/demo/demo02';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createDemo02Category, getDemo02Category, updateDemo02Category } from '#/api/infra/demo/demo02';
import { $t } from '#/locales';
import { computed, ref } from 'vue';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<Demo02CategoryApi.Demo02Category>();
const parentId = ref<number>(); // 新增下级时的父级 ID

const getTitle = computed(() => {
  if (formData.value?.id) {
    return $t('ui.actionTitle.edit', ['示例分类']);
  }
  return parentId.value ? $t('ui.actionTitle.create', ['下级示例分类']) : $t('ui.actionTitle.create', ['示例分类']);
});

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as Demo02CategoryApi.Demo02Category;
    try {
      await (formData.value?.id ? updateDemo02Category(data) : createDemo02Category(data));
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
      return;
    }
    // 加载数据
    let data = modalApi.getData<Demo02CategoryApi.Demo02Category>();
    if (!data) {
      return;
    }

    // 处理新增下级的情况
    // TODO @puhui999：按照 dept 或者 menu 的 form 处理风格，可以更简洁一点；可能 parentId 也不用啦
    if (!data.id && data.parentId) {
      parentId.value = data.parentId;
      formData.value = { parentId: parentId.value } as Demo02CategoryApi.Demo02Category;
      await formApi.setValues(formData.value);
      return;
    }

    if (data.id) {
      // 编辑
      modalApi.lock();
      try {
        data = await getDemo02Category(data.id);
        formData.value = data;
        await formApi.setValues(formData.value);
      } finally {
        modalApi.lock(false);
      }
    } else {
      // 新增
      formData.value = { parentId: 0 } as Demo02CategoryApi.Demo02Category;
      await formApi.setValues(formData.value || {});
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
