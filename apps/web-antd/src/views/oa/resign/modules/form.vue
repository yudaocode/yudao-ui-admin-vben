<script lang="ts" setup>
import type { OaResignApplyApi } from '#/api/oa/resign';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createResignApply,
  getResignApply,
  updateResignApply,
} from '#/api/oa/resign';
import { $t } from '#/locales';
import { UserSelect } from '#/views/system/user/components';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaResignApplyApi.ResignApply>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['离职申请'])
    : $t('ui.actionTitle.create', ['离职申请']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 160,
  },
  wrapperClass: 'grid-cols-1',
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
    const data = (await formApi.getValues()) as OaResignApplyApi.ResignApply;
    try {
      await (formData.value?.id
        ? updateResignApply(data)
        : createResignApply(data));
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
    const data = modalApi.getData() as OaResignApplyApi.ResignApply;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getResignApply(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[800px]">
    <Form class="mx-4">
      <template #handoverUserId="slotProps">
        <UserSelect
          :model-value="slotProps.componentField.modelValue"
          placeholder="请选择工作交接人"
          @update:model-value="slotProps.componentField['onUpdate:modelValue']"
        />
      </template>
    </Form>
  </Modal>
</template>
