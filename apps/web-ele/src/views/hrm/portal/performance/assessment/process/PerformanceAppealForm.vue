<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { HrmPerformanceAssessmentApi } from '#/api/hrm/performance/assessment';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElCheckbox,
  ElCheckboxGroup,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
} from 'element-plus';

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

const formRules: FormRules = {
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
    ElMessage.success('绩效申诉已提交');
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
    <div v-loading="formLoading">
      <ElForm
        ref="formRef"
        label-width="110px"
        :model="formData"
        :rules="formRules"
      >
        <ElFormItem label="退回评分节点" prop="reviewStageIds">
          <ElCheckboxGroup v-model="formData.reviewStageIds">
            <ElCheckbox
              v-for="stage in completedReviewStages"
              :key="stage.id"
              :label="stage.id"
              :value="stage.id"
            >
              {{ stage.name || '评分阶段' }}
              <span v-if="stage.handlerName">（{{ stage.handlerName }}）</span>
            </ElCheckbox>
          </ElCheckboxGroup>
        </ElFormItem>
        <ElFormItem label="申诉原因" prop="appealReason">
          <ElInput
            v-model="formData.appealReason"
            maxlength="500"
            placeholder="请输入申诉原因"
            :rows="4"
            show-word-limit
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="申诉附件" prop="appealFileUrls">
          <FileUpload
            v-model="formData.appealFileUrls"
            directory="hrm/performance/appeal"
            :max-number="1"
            :max-size="20"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
