<script lang="ts" setup>
import type { HrmPerformanceAssessmentApi } from '#/api/hrm/performance/assessment';
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { computed, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  Drawer,
  Empty,
  Input,
  InputNumber,
  message,
  Spin,
  Table,
  Tag,
} from 'antdv-next';

import {
  fillPerformanceAssessmentQuota,
  getPerformanceAssessment,
} from '#/api/hrm/portal/performance/assessment';
import { DictTag } from '#/components/dict-tag';
import { HrmPerformanceStageType } from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmPortalPerformanceQuotaForm' });

const emit = defineEmits<{
  success: [];
}>();

interface DimensionGroup {
  allowEdit?: boolean;
  dimensionId?: number;
  key: string;
  name: string;
  quotas: HrmPerformanceAssessmentApi.AssessmentQuota[];
  weight: number;
}

const drawerVisible = ref(false);
const loading = ref(false);
const submitting = ref(false);
const detail =
  ref<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>({});

const dimensionGroups = computed<DimensionGroup[]>(() => {
  const groups = new Map<string, DimensionGroup>();
  for (const dimension of detail.value.dimensions || []) {
    const key =
      dimension.id === undefined
        ? dimension.name || 'default'
        : String(dimension.id);
    groups.set(key, {
      key,
      dimensionId: dimension.id,
      name: dimension.name || '未命名维度',
      weight: Number(dimension.weight || 0),
      allowEdit: dimension.allowEdit,
      quotas: [],
    });
  }
  for (const quota of detail.value.quotas || []) {
    const key = quota.dimensionId
      ? String(quota.dimensionId)
      : quota.dimensionName || 'default';
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        dimensionId: quota.dimensionId,
        name: quota.dimensionName || '未命名维度',
        weight: Number(quota.dimensionWeight || 0),
        allowEdit: quota.allowEdit,
        quotas: [],
      });
    }
    groups.get(key)?.quotas.push(quota);
  }
  return [...groups.values()];
});

/** 打开弹窗 */
async function open(assessmentId?: number) {
  if (!assessmentId) {
    return;
  }
  drawerVisible.value = true;
  loading.value = true;
  try {
    detail.value = await getPerformanceAssessment(assessmentId);
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });

/** 计算指标权重合计 */
function weightTotal(group: DimensionGroup) {
  return Number(
    group.quotas
      .reduce((total, quota) => total + Number(quota.weight || 0), 0)
      .toFixed(2),
  );
}

/** 新增指标 */
function addQuota(group: DimensionGroup) {
  const remainingWeight = Math.max(
    0,
    Number((100 - weightTotal(group)).toFixed(2)),
  );
  detail.value.quotas ||= [];
  detail.value.quotas.push({
    dimensionId: group.dimensionId,
    preset: false,
    name: '',
    description: '',
    standard: '',
    weight: remainingWeight || undefined,
    scoreType: 1,
  });
}

/** 删除指标 */
function removeQuota(quota: HrmPerformanceAssessmentApi.AssessmentQuota) {
  const index = detail.value.quotas?.indexOf(quota) ?? -1;
  if (index >= 0) {
    detail.value.quotas?.splice(index, 1);
  }
}

/** 校验绩效指标 */
function validateQuota() {
  for (const group of dimensionGroups.value) {
    if (weightTotal(group) !== 100) {
      message.error(`${group.name}的指标权重合计必须等于 100%`);
      return false;
    }
    const customQuotas = group.quotas.filter((quota) => !quota.preset);
    if (
      customQuotas.some(
        (quota) =>
          !quota.name?.trim() ||
          !quota.standard?.trim() ||
          !quota.weight ||
          quota.weight <= 0,
      )
    ) {
      message.error(`请完整填写${group.name}的新增指标`);
      return false;
    }
    const names = group.quotas
      .map((quota) => quota.name?.trim())
      .filter(Boolean);
    if (new Set(names).size !== names.length) {
      message.error(`${group.name}存在重复指标名称`);
      return false;
    }
  }
  return dimensionGroups.value.length > 0;
}

/** 提交绩效指标 */
async function submitQuota() {
  if (!detail.value.id || !validateQuota()) {
    return;
  }
  submitting.value = true;
  try {
    await fillPerformanceAssessmentQuota({
      assessmentId: detail.value.id,
      quotas: (detail.value.quotas || []).map(
        ({
          id,
          dimensionId,
          name,
          description,
          standard,
          weight,
          scoreType,
          targetValue,
          actualValue,
          selfScore,
          reviewerScore,
          finalScore,
          comment,
          sort,
        }) => ({
          id,
          dimensionId,
          name,
          description,
          standard,
          weight,
          scoreType,
          targetValue,
          actualValue,
          selfScore,
          reviewerScore,
          finalScore,
          comment,
          sort,
        }),
      ),
    });
    message.success('绩效指标已提交');
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
    :width="960"
    title="制定绩效指标"
  >
    <Spin :spinning="loading">
      <div class="mb-4 flex items-center justify-between gap-4">
        <div>
          <div class="text-xl font-semibold">
            {{ detail.employeeName || '-' }}
          </div>
          <div class="text-muted-foreground mt-1 text-sm">
            {{ detail.name || '-' }}
          </div>
        </div>
        <DictTag
          :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
          :value="detail.stageType ?? 0"
        />
      </div>

      <Alert
        v-if="detail.targetConfirmationResult === 0"
        class="mb-4"
        :message="`目标已退回：${detail.targetConfirmationComment || '请调整后重新提交'}`"
        show-icon
        type="warning"
      />

      <section v-for="group in dimensionGroups" :key="group.key" class="mb-5">
        <div class="mb-2 flex min-h-[42px] items-center justify-between gap-3">
          <div class="font-semibold">
            <div>{{ group.name }}</div>
            <div class="text-muted-foreground mt-1 text-sm">
              维度权重 {{ group.weight }}%
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span
              class="text-sm"
              :class="
                weightTotal(group) === 100 ? 'text-green-600' : 'text-red-500'
              "
            >
              指标权重 {{ weightTotal(group) }}%
            </span>
            <Button
              v-if="group.allowEdit"
              :disabled="
                detail.stageType !== HrmPerformanceStageType.FILL_QUOTA
              "
              @click="addQuota(group)"
            >
              <IconifyIcon icon="lucide:plus" class="mr-1" />
              新增指标
            </Button>
          </div>
        </div>

        <Table
          bordered
          :columns="[
            { title: '指标名称', key: 'name', minWidth: 170 },
            { title: '指标说明', key: 'description', minWidth: 180 },
            { title: '考核标准', key: 'standard', minWidth: 210 },
            { title: '指标权重', key: 'weight', width: 125 },
            { title: '操作', key: 'action', width: 72, align: 'center' },
          ]"
          :data-source="group.quotas"
          :pagination="false"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div
                v-if="record.preset"
                class="flex items-center justify-between gap-2"
              >
                <span>{{ record.name || '-' }}</span>
                <Tag>预置</Tag>
              </div>
              <Input
                v-else
                v-model:value="record.name"
                :maxlength="255"
                placeholder="请输入指标名称"
              />
            </template>
            <template v-else-if="column.key === 'description'">
              <span v-if="record.preset">{{ record.description || '-' }}</span>
              <Input
                v-else
                v-model:value="record.description"
                :maxlength="1000"
                placeholder="请输入指标说明"
              />
            </template>
            <template v-else-if="column.key === 'standard'">
              <span v-if="record.preset">{{ record.standard || '-' }}</span>
              <Input
                v-else
                v-model:value="record.standard"
                :maxlength="1000"
                placeholder="请输入考核标准"
              />
            </template>
            <template v-else-if="column.key === 'weight'">
              <span v-if="record.preset">{{ record.weight || 0 }}%</span>
              <InputNumber
                v-else
                v-model:value="record.weight"
                class="w-full"
                :controls="false"
                :max="100"
                :min="0.01"
                :precision="2"
              />
            </template>
            <template v-else-if="column.key === 'action'">
              <Button
                v-if="!record.preset"
                danger
                type="link"
                @click="removeQuota(record)"
              >
                <IconifyIcon icon="lucide:trash-2" />
              </Button>
            </template>
          </template>
        </Table>
      </section>

      <Empty v-if="!dimensionGroups.length" description="暂无可填写指标" />
    </Spin>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button @click="drawerVisible = false">取消</Button>
        <Button
          :disabled="detail.stageType !== HrmPerformanceStageType.FILL_QUOTA"
          :loading="submitting"
          type="primary"
          @click="submitQuota"
        >
          提交指标
        </Button>
      </div>
    </template>
  </Drawer>
</template>
