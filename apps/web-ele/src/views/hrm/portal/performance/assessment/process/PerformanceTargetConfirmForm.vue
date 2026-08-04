<script lang="ts" setup>
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { ref } from 'vue';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDrawer,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  confirmPerformanceAssessmentTarget,
  getPerformanceAssessment,
} from '#/api/hrm/portal/performance/assessment';

defineOptions({ name: 'HrmPortalPerformanceTargetConfirmForm' });

const emit = defineEmits<{
  success: [];
}>();

const drawerVisible = ref(false);
const loading = ref(false);
const submitting = ref(false);
const detail =
  ref<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>({});
const comment = ref('');

/** 打开弹窗 */
async function open(assessmentId?: number, stageId?: number) {
  if (!assessmentId || !stageId) {
    return;
  }
  drawerVisible.value = true;
  loading.value = true;
  comment.value = '';
  try {
    detail.value = await getPerformanceAssessment(assessmentId, stageId);
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });

/** 提交目标确认 */
async function submitConfirm(pass: number) {
  if (!detail.value.id) {
    return;
  }
  if (pass === 0 && !comment.value.trim()) {
    ElMessage.error('退回指标时请填写原因');
    return;
  }
  submitting.value = true;
  try {
    await confirmPerformanceAssessmentTarget({
      assessmentId: detail.value.id,
      pass,
      comment:
        comment.value.trim() || (pass === 1 ? '指标确认通过' : undefined),
    });
    ElMessage.success(pass === 1 ? '指标已确认' : '指标已退回');
    drawerVisible.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <ElDrawer
    v-model="drawerVisible"
    destroy-on-close
    size="920px"
    title="确认绩效指标"
  >
    <div v-loading="loading">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <div class="text-xl font-semibold">
            {{ detail.employeeName || '-' }}
          </div>
          <div class="text-muted-foreground mt-1 text-sm">
            {{ detail.name || '-' }}
          </div>
        </div>
        <ElTag type="warning">待指标确认</ElTag>
      </div>

      <ElDescriptions border class="mb-4" :column="3" size="small">
        <ElDescriptionsItem label="工号">
          {{ detail.jobNumber || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="确认人">
          {{ detail.targetConfirmationEmployeeName || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="指标数">
          {{ detail.quotas?.length || 0 }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElTable border :data="detail.quotas || []" row-key="id" size="small">
        <ElTableColumn label="维度" min-width="120" prop="dimensionName" />
        <ElTableColumn label="指标" min-width="160" prop="name" />
        <ElTableColumn label="指标说明" min-width="180" prop="description" />
        <ElTableColumn label="考核标准" min-width="210" prop="standard" />
        <ElTableColumn align="center" label="权重" width="130">
          <template #default="{ row }">
            {{ row.dimensionWeight || 0 }}% / {{ row.weight || 0 }}%
          </template>
        </ElTableColumn>
      </ElTable>

      <ElInput
        v-model="comment"
        class="mt-4"
        maxlength="1000"
        placeholder="填写确认意见；退回时必填"
        :rows="3"
        show-word-limit
        type="textarea"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="drawerVisible = false">取消</ElButton>
        <ElButton :loading="submitting" type="danger" @click="submitConfirm(0)">
          退回指标
        </ElButton>
        <ElButton
          :loading="submitting"
          type="primary"
          @click="submitConfirm(1)"
        >
          确认通过
        </ElButton>
      </div>
    </template>
  </ElDrawer>
</template>
