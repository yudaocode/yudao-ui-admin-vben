<script lang="ts" setup>
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { computed, ref } from 'vue';

import { Empty, FormItem, Spin } from 'antdv-next';

import { getPerformanceAssessmentTemplate } from '#/api/hrm/performance/config/assessment-template';
import ConfigEditor from '#/views/hrm/performance/config/assessment-template/components/config-editor.vue';
import TemplateSelect from '#/views/hrm/performance/config/assessment-template/components/template-select.vue';
import {
  cloneAssessmentConfig,
  createDefaultAssessmentConfig,
} from '#/views/hrm/utils/performance';

defineOptions({ name: 'HrmPerformancePlanIndicatorForm' });

const props = defineProps<{ disabled: boolean }>();
const model = defineModel<HrmPerformancePlanApi.PerformancePlan>({
  required: true,
});
const templateLoading = ref(false);
const configEditorRef = ref<InstanceType<typeof ConfigEditor>>();

const assessmentConfig = computed({
  get: () => model.value.assessmentConfig || createDefaultAssessmentConfig(),
  set: (value) => {
    model.value.assessmentConfig = value;
  },
});

async function handleAssessmentTemplateChange(templateId?: number) {
  model.value.assessmentConfig = createDefaultAssessmentConfig();
  if (!templateId) return;
  templateLoading.value = true;
  try {
    const template = await getPerformanceAssessmentTemplate(templateId);
    if (model.value.assessmentTemplateId !== templateId) return;
    model.value.assessmentConfig = cloneAssessmentConfig(template);
  } finally {
    templateLoading.value = false;
  }
}

function validate() {
  return (
    Boolean(model.value.assessmentTemplateId) &&
    Boolean(configEditorRef.value?.validate())
  );
}

defineExpose({ validate });
</script>

<template>
  <div class="mx-auto max-w-[1200px]">
    <Spin :spinning="templateLoading">
      <ConfigEditor
        ref="configEditorRef"
        v-model="assessmentConfig"
        :disabled="props.disabled"
        :show-dimensions="Boolean(model.assessmentTemplateId)"
      >
        <template #after-score-config>
          <FormItem class="mt-4" label="考核指标模板" required>
            <TemplateSelect
              v-model="model.assessmentTemplateId"
              @update:model-value="handleAssessmentTemplateChange"
            />
          </FormItem>
        </template>
      </ConfigEditor>
      <Empty
        v-if="!model.assessmentTemplateId"
        description="请选择考核指标模板"
      />
    </Spin>
  </div>
</template>
