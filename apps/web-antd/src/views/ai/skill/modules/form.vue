<script lang="ts" setup>
import type { AiSkillApi } from '#/api/ai/skill';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Alert, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createSkill, getSkill, updateSkill } from '#/api/ai/skill';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<AiSkillApi.Skill>();
const isUpdate = ref(false); // 是否为修改
const getTitle = computed(() => {
  return isUpdate.value
    ? $t('ui.actionTitle.edit', ['技能'])
    : $t('ui.actionTitle.create', ['技能']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 100,
  },
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
    const data = (await formApi.getValues()) as AiSkillApi.Skill;
    try {
      await (isUpdate.value ? updateSkill(data) : createSkill(data));
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
    // 根据新增/修改，切换名称、描述的可编辑状态
    const data = modalApi.getData() as AiSkillApi.Skill;
    isUpdate.value = !!data?.id;
    formApi.setState({ schema: useFormSchema(isUpdate.value) });
    if (!data || !data.id) {
      return;
    }
    // 加载数据
    modalApi.lock();
    try {
      formData.value = await getSkill(data.id);
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
    <Alert
      v-if="!isUpdate"
      class="mx-4 mb-4"
      type="info"
      show-icon
      message="创建后将自动生成 SKILL.md、scripts/、reference/，可在“文件管理”中继续编辑"
    />
    <Form class="mx-4" />
  </Modal>
</template>
