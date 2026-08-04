<script lang="ts" setup>
import type { HrmPerformanceAssessmentTemplateApi } from '#/api/hrm/performance/config/assessment-template';

import { ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import {
  createPerformanceAssessmentTemplate,
  getPerformanceAssessmentTemplate,
  updatePerformanceAssessmentTemplate,
} from '#/api/hrm/performance/config/assessment-template';
import { $t } from '#/locales';
import {
  HrmPerformanceScoreCalculation,
  HrmPerformanceUpperLimitType,
} from '#/views/hrm/utils/constants';

import ConfigEditor from '../components/config-editor.vue';
import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const configData =
  ref<HrmPerformanceAssessmentTemplateApi.PerformanceAssessmentTemplate>(
    createDefault(),
  );
const configEditorRef = ref<InstanceType<typeof ConfigEditor>>();
const formType = ref<'create' | 'update'>('create');

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 112 },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    if (!configEditorRef.value?.validate()) return;
    modalApi.lock();
    const values = await formApi.getValues();
    const data: HrmPerformanceAssessmentTemplateApi.PerformanceAssessmentTemplate =
      {
        ...configData.value,
        ...values,
      };
    try {
      await (formType.value === 'create'
        ? createPerformanceAssessmentTemplate(data)
        : updatePerformanceAssessmentTemplate(data));
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const payload = modalApi.getData<{
      id?: number;
      type: 'create' | 'update';
    }>();
    formType.value = payload?.type || 'create';
    if (payload?.id) {
      modalApi.lock();
      try {
        configData.value = await getPerformanceAssessmentTemplate(payload.id);
        await formApi.setValues(configData.value);
      } finally {
        modalApi.unlock();
      }
    } else {
      configData.value = createDefault();
      await formApi.setValues(configData.value);
    }
  },
});

function createDefault(): HrmPerformanceAssessmentTemplateApi.PerformanceAssessmentTemplate {
  return {
    name: '',
    illustrate: '',
    scoreCalculation: HrmPerformanceScoreCalculation.WEIGHTED,
    upperLimitType: HrmPerformanceUpperLimitType.UNIFIED,
    upperLimitScore: 100,
    dimensions: [],
  };
}

function open(type: 'create' | 'update', id?: number) {
  modalApi.setData({ type, id }).open();
}

defineExpose({ open });
</script>

<template>
  <Modal
    :title="
      formType === 'create'
        ? $t('ui.actionTitle.create', ['考核指标模板'])
        : $t('ui.actionTitle.edit', ['考核指标模板'])
    "
    class="w-[1120px]"
  >
    <Form class="mx-4" />
    <ConfigEditor ref="configEditorRef" v-model="configData" class="mx-4" />
  </Modal>
</template>
