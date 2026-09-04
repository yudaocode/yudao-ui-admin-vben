<script lang="ts" setup>
import type { HrmPerformanceAssessmentTemplateApi } from '#/api/hrm/performance/config/assessment-template';

import { ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { useDimensionFormSchema } from '../data';

defineOptions({ name: 'HrmPerformanceAssessmentDimensionForm' });

const emit = defineEmits<{
  confirm: [value: HrmPerformanceAssessmentTemplateApi.AssessmentDimension];
}>();

const quotas = ref<HrmPerformanceAssessmentTemplateApi.AssessmentQuota[]>([]);

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 112 },
  layout: 'horizontal',
  schema: useDimensionFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    emit('confirm', {
      ...(await formApi.getValues()),
      quotas: quotas.value,
    } as HrmPerformanceAssessmentTemplateApi.AssessmentDimension);
    await modalApi.close();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const dimension = modalApi.getData() as
      | HrmPerformanceAssessmentTemplateApi.AssessmentDimension
      | undefined;
    quotas.value = [...(dimension?.quotas || [])];
    await formApi.resetForm();
    if (dimension) await formApi.setValues(dimension);
  },
});
</script>

<template>
  <Modal class="w-[560px]" title="考核维度">
    <Form class="mx-4" />
  </Modal>
</template>
