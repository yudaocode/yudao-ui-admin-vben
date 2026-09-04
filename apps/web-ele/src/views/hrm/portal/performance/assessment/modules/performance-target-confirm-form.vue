<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { ElMessage as message } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  confirmPerformanceAssessmentTarget,
  getPerformanceAssessment,
} from '#/api/hrm/portal/performance/assessment';

import { useTargetConfirmGridColumns } from '../data';

defineOptions({ name: 'HrmPortalPerformanceTargetConfirmForm' });

const emit = defineEmits<{ success: [] }>();
const submitting = ref(false);
const detail =
  ref<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>({});
const comment = ref('');

type PerformanceQuota = NonNullable<
  HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment['quotas']
>[number];

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useTargetConfirmGridColumns(),
    data: [],
    minHeight: 240,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<PerformanceQuota>,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { assessmentId, stageId } = drawerApi.getData() as {
      assessmentId?: number;
      stageId?: number;
    };
    if (!assessmentId || !stageId) {
      await drawerApi.close();
      return;
    }
    comment.value = '';
    drawerApi.lock();
    try {
      detail.value = await getPerformanceAssessment(assessmentId, stageId);
      await nextTick();
      await gridApi.grid.reloadData(detail.value.quotas || []);
    } finally {
      drawerApi.unlock();
    }
  },
});

/** 提交目标确认 */
async function submitConfirm(pass: number) {
  if (!detail.value.id) return;
  if (pass === 0 && !comment.value.trim()) {
    message.error('退回指标时请填写原因');
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
    message.success(pass === 1 ? '指标已确认' : '指标已退回');
    await drawerApi.close();
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Drawer class="w-[920px]" title="确认绩效指标">
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
    <Grid class="w-full">
      <template #weight="{ row }">
        {{ row.dimensionWeight || 0 }}% / {{ row.weight || 0 }}%
      </template>
    </Grid>
    <ElInput
      v-model="comment"
      class="mt-4"
      :maxlength="1000"
      placeholder="填写确认意见；退回时必填"
      :rows="3"
      show-word-limit
      type="textarea"
    />
    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="drawerApi.close()">取消</ElButton>
        <ElButton type="danger" :loading="submitting" @click="submitConfirm(0)">
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
  </Drawer>
</template>
