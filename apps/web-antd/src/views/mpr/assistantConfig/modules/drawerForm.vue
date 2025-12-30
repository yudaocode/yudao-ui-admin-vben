<script lang="ts" setup>
import type { AssistantConfigApi } from '#/api/mpr/assistantConfig';

import { computed, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createAssistantConfig,
  getAssistantConfigByAssistantId,
  updateAssistantConfig,
} from '#/api/mpr/assistantConfig';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import MessageTemplateFormModel from './messageTemplateModal.vue';
import SelectRuleFormModal from './selectRuleModal.vue';

const emit = defineEmits(['success']);
const formData = ref<AssistantConfigApi.AssistantConfig>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['助理'])
    : $t('ui.actionTitle.create', ['助理']);
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: SelectRuleFormModal,
});

const [TemplateFormModal, templateModalApi] = useVbenModal({
  connectedComponent: MessageTemplateFormModel,
});

function openFormModal(target) {
  if (target === 'rule') {
    // 意向商品选择规则
    formModalApi.setData(formData.value.autoSelectIntendedRule).open();
  } else if (target === 'template') {
    // 管理消息模版
    templateModalApi.setData({ assistantId: formData.value.id }).open();
  }
}
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: useFormSchema(openFormModal),
  showDefaultActions: false,
});

const [Drawer, modalApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data =
      (await formApi.getValues()) as AssistantConfigApi.AssistantConfig;
    try {
      await (formData.value?.id
        ? updateAssistantConfig(data)
        : createAssistantConfig(data));
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
    let data = modalApi.getData<AssistantConfigApi.AssistantConfig>();
    if (!data) {
      return;
    }
    if (data.assistantId) {
      const assistantId = data.assistantId;

      modalApi.lock();
      try {
        data = await getAssistantConfigByAssistantId(assistantId);
        if (!data) {
          data = {};
        }

        data.isTargetFilter = 1;
      } finally {
        modalApi.unlock();
      }
      data.assistantId = assistantId;
    }
    // 设置到 values
    formData.value = data;
    await formApi.setValues(formData.value);
  },
});

async function onFormModalSuccess(values) {
  formData.value = await formApi.getValues();
  formData.value.autoSelectIntendedRule = values;
  formApi.setValues(formData.value, false);
}
async function onTemplateModalSuccess(values) {
  formData.value = await formApi.getValues();
  formData.value.messageTemplateList = values;
  await formApi.setValues(formData.value, false);
}
</script>

<template>
  <Drawer :title="getTitle" class="w-[600px]">
    <FormModal @success="onFormModalSuccess" />
    <TemplateFormModal @success="onTemplateModalSuccess" />
    <Form class="mx-4" />
  </Drawer>
</template>
