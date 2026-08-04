<script lang="ts" setup>
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { ref } from 'vue';

import {
  Button,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Input,
  message,
  Spin,
  Table,
  Tag,
} from 'antdv-next';

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
    drawerVisible.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Drawer
    v-model:open="drawerVisible"
    :destroy-on-close="true"
    :width="920"
    title="确认绩效指标"
  >
    <Spin :spinning="loading">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <div class="text-xl font-semibold">
            {{ detail.employeeName || '-' }}
          </div>
          <div class="text-muted-foreground mt-1 text-sm">
            {{ detail.name || '-' }}
          </div>
        </div>
        <Tag color="warning">待指标确认</Tag>
      </div>

      <Descriptions bordered class="mb-4" :column="3" size="small">
        <DescriptionsItem label="工号">
          {{ detail.jobNumber || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="确认人">
          {{ detail.targetConfirmationEmployeeName || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="指标数">
          {{ detail.quotas?.length || 0 }}
        </DescriptionsItem>
      </Descriptions>

      <Table
        bordered
        :columns="[
          {
            title: '维度',
            dataIndex: 'dimensionName',
            key: 'dimensionName',
            minWidth: 120,
          },
          { title: '指标', dataIndex: 'name', key: 'name', minWidth: 160 },
          {
            title: '指标说明',
            dataIndex: 'description',
            key: 'description',
            minWidth: 180,
          },
          {
            title: '考核标准',
            dataIndex: 'standard',
            key: 'standard',
            minWidth: 210,
          },
          { title: '权重', key: 'weight', width: 130, align: 'center' },
        ]"
        :data-source="detail.quotas || []"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'weight'">
            {{ record.dimensionWeight || 0 }}% / {{ record.weight || 0 }}%
          </template>
        </template>
      </Table>

      <Input.TextArea
        v-model:value="comment"
        class="mt-4"
        :maxlength="1000"
        placeholder="填写确认意见；退回时必填"
        :rows="3"
        show-count
      />
    </Spin>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button @click="drawerVisible = false">取消</Button>
        <Button danger :loading="submitting" @click="submitConfirm(0)">
          退回指标
        </Button>
        <Button :loading="submitting" type="primary" @click="submitConfirm(1)">
          确认通过
        </Button>
      </div>
    </template>
  </Drawer>
</template>
