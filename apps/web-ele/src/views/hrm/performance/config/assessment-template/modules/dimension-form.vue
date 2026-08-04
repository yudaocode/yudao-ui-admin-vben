<script lang="ts" setup>
import type { HrmPerformanceAssessmentTemplateApi } from '#/api/hrm/performance/config/assessment-template';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElCheckbox as Checkbox,
  ElFormItem,
  ElForm as Form,
  ElInput as Input,
  ElInputNumber as InputNumber,
  ElSelect as Select,
} from 'element-plus';

import { HrmPerformanceQuotaType } from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmPerformanceAssessmentDimensionForm' });

const emit = defineEmits<{
  confirm: [value: HrmPerformanceAssessmentTemplateApi.AssessmentDimension];
}>();

const formData =
  ref<HrmPerformanceAssessmentTemplateApi.AssessmentDimension>(createDefault());

const [Modal, modalApi] = useVbenModal({
  onConfirm() {
    emit('confirm', { ...formData.value, quotas: formData.value.quotas || [] });
    modalApi.close();
  },
});

function createDefault(): HrmPerformanceAssessmentTemplateApi.AssessmentDimension {
  return {
    name: '',
    quotaType: HrmPerformanceQuotaType.PERFORMANCE,
    weight: undefined,
    remark: '',
    allowEdit: false,
    quotas: [],
  };
}

function open(
  dimension?: HrmPerformanceAssessmentTemplateApi.AssessmentDimension,
) {
  formData.value = dimension
    ? { ...dimension, quotas: [...(dimension.quotas || [])] }
    : createDefault();
  modalApi.open();
}

defineExpose({ open });
</script>

<template>
  <Modal class="w-[560px]" title="考核维度">
    <Form class="mx-4" layout="vertical">
      <ElFormItem label="维度名称" required>
        <Input
          v-model="formData.name"
          :maxlength="50"
          placeholder="请输入维度名称"
        />
      </ElFormItem>
      <ElFormItem label="指标类型" required>
        <Select
          v-model="formData.quotaType"
          :options="[
            { label: '业绩指标', value: HrmPerformanceQuotaType.PERFORMANCE },
            { label: '行为态度指标', value: HrmPerformanceQuotaType.BEHAVIOR },
          ]"
          placeholder="请选择指标类型"
        />
      </ElFormItem>
      <ElFormItem label="维度权重(%)" required>
        <InputNumber
          v-model="formData.weight"
          :max="100"
          :min="0"
          :precision="2"
          class="w-full"
          placeholder="请输入维度权重"
        />
      </ElFormItem>
      <ElFormItem label="备注">
        <Input
          type="textarea"
          v-model="formData.remark"
          :maxlength="200"
          :rows="2"
          placeholder="请输入备注"
        />
      </ElFormItem>
      <ElFormItem>
        <Checkbox v-model="formData.allowEdit">允许员工填写指标</Checkbox>
      </ElFormItem>
    </Form>
  </Modal>
</template>
