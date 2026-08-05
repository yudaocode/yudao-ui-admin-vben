<script lang="ts" setup>
import type { FormInstance, Rule } from 'antdv-next';

import type { HrmPerformanceAssessmentApi } from '#/api/hrm/performance/assessment';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Checkbox,
  CheckboxGroup,
  Form,
  FormItem,
  Input,
  message,
  Spin,
} from 'antdv-next';

import {
  getPerformanceAssessment,
  submitPerformanceAssessmentAppeal,
} from '#/api/hrm/portal/performance/assessment';
import { FileUpload } from '#/components/upload';
import { HrmPerformanceAssessmentStageStatus } from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmPortalPerformanceAppealForm' });

const emit = defineEmits<{
  success: [];
}>();

interface AppealFormData {
  appealFileUrls: string[];
  appealReason: string;
  assessmentId?: number;
  reviewStageIds: number[];
}

const formRef = ref<FormInstance>();
const formLoading = ref(false);
const completedReviewStages = ref<
  HrmPerformanceAssessmentApi.AssessmentStage[]
>([]);
const formData = ref<AppealFormData>({
  assessmentId: undefined,
  appealReason: '',
  appealFileUrls: [],
  reviewStageIds: [],
});

const formRules: Record<string, Rule[]> = {
  reviewStageIds: [
    { required: true, message: '请选择需要退回的评分节点', trigger: 'change' },
  ],
  appealReason: [
    { required: true, message: '申诉原因不能为空', trigger: 'blur' },
  ],
};

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await submitForm();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      resetForm();
    }
  },
  title: '提交绩效申诉',
});

/** 打开弹窗 */
async function open(assessmentId: number) {
  modalApi.open();
  formLoading.value = true;
  resetForm();
  formData.value.assessmentId = assessmentId;
  try {
    const assessment = await getPerformanceAssessment(assessmentId);
    completedReviewStages.value = (assessment.reviewStages || []).filter(
      (stage) =>
        stage.id !== null &&
        stage.status === HrmPerformanceAssessmentStageStatus.PROCESSED,
    );
    const latestStage =
      completedReviewStages.value[completedReviewStages.value.length - 1];
    formData.value.reviewStageIds = latestStage?.id ? [latestStage.id] : [];
  } finally {
    formLoading.value = false;
  }
}

defineExpose({ open });

/** 提交表单 */
async function submitForm() {
  if (!formRef.value) {
    return;
  }
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  if (!formData.value.assessmentId) {
    return;
  }
  modalApi.lock();
  try {
    await submitPerformanceAssessmentAppeal({
      assessmentId: formData.value.assessmentId,
      appealReason: formData.value.appealReason,
      appealFileUrls: formData.value.appealFileUrls,
      reviewStageIds: formData.value.reviewStageIds,
    });
    message.success('绩效申诉已提交');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 重置表单 */
async function resetForm() {
  formData.value = {
    assessmentId: undefined,
    appealReason: '',
    appealFileUrls: [],
    reviewStageIds: [],
  };
  completedReviewStages.value = [];
  await nextTick();
  formRef.value?.resetFields();
}
</script>

<template>
  <Modal class="w-[680px]">
    <Spin :spinning="formLoading">
      <Form
        ref="formRef"
        :label-col="{ style: { width: '110px' } }"
        :model="formData"
        :rules="formRules"
      >
        <FormItem label="退回评分节点" name="reviewStageIds">
          <CheckboxGroup v-model:value="formData.reviewStageIds">
            <Checkbox
              v-for="stage in completedReviewStages"
              :key="stage.id"
              :value="stage.id"
            >
              {{ stage.name || '评分阶段' }}
              <span v-if="stage.handlerName">（{{ stage.handlerName }}）</span>
            </Checkbox>
          </CheckboxGroup>
        </FormItem>
        <FormItem label="申诉原因" name="appealReason">
          <Input.TextArea
            v-model:value="formData.appealReason"
            :maxlength="500"
            placeholder="请输入申诉原因"
            :rows="4"
            show-count
          />
        </FormItem>
        <FormItem label="申诉附件" name="appealFileUrls">
          <FileUpload
            v-model="formData.appealFileUrls"
            directory="hrm/performance/appeal"
            :max-number="1"
            :max-size="20"
          />
        </FormItem>
      </Form>
    </Spin>
  </Modal>
</template>
