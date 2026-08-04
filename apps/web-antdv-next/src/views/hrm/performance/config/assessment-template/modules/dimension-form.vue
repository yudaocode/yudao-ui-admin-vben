<script lang="ts" setup>
import type { HrmPerformanceAssessmentTemplateApi } from '#/api/hrm/performance/config/assessment-template';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Checkbox,
  Form,
  FormItem,
  Input,
  InputNumber,
  Select,
} from 'antdv-next';

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
      <FormItem label="维度名称" required>
        <Input
          v-model:value="formData.name"
          :maxlength="50"
          placeholder="请输入维度名称"
        />
      </FormItem>
      <FormItem label="指标类型" required>
        <Select
          v-model:value="formData.quotaType"
          :options="[
            { label: '业绩指标', value: HrmPerformanceQuotaType.PERFORMANCE },
            { label: '行为态度指标', value: HrmPerformanceQuotaType.BEHAVIOR },
          ]"
          placeholder="请选择指标类型"
        />
      </FormItem>
      <FormItem label="维度权重(%)" required>
        <InputNumber
          v-model:value="formData.weight"
          :max="100"
          :min="0"
          :precision="2"
          class="w-full"
          placeholder="请输入维度权重"
        />
      </FormItem>
      <FormItem label="备注">
        <Input.TextArea
          v-model:value="formData.remark"
          :maxlength="200"
          :rows="2"
          placeholder="请输入备注"
        />
      </FormItem>
      <FormItem>
        <Checkbox v-model:checked="formData.allowEdit">
          允许员工填写指标
        </Checkbox>
      </FormItem>
    </Form>
  </Modal>
</template>
