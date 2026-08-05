<script lang="ts" setup>
import type { HrmEmployeeQuitInfoApi } from '#/api/hrm/employee/quit-info';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';

import {
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
} from 'element-plus';

import { getEmployeeQuitInfo } from '#/api/hrm/employee/quit-info';
import {
  formatHrmDateTime,
  formatHrmEmployeeQuitReason,
  formatHrmEmployeeQuitType,
} from '#/views/hrm/utils/format';
const props = defineProps<{ employeeId: number }>();
const emit = defineEmits(['edit']);
const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const quitInfo = ref<HrmEmployeeQuitInfoApi.EmployeeQuitInfo>();
async function getQuitInfo() {
  loading.value = true;
  try {
    quitInfo.value = await getEmployeeQuitInfo(props.employeeId);
  } finally {
    loading.value = false;
  }
}
onMounted(getQuitInfo);
defineExpose({ getQuitInfo });
</script>
<template>
  <ElCard
    v-if="quitInfo"
    title="离职信息"
    :loading="loading"
    :style="{ marginBottom: '15px' }"
  >
    <template #extra>
      <ElButton
        v-if="hasAccessByCodes(['hrm:employee:update'])"
        link
        type="primary"
        @click="emit('edit')"
      >
        编辑
      </ElButton>
    </template>
    <ElDescriptions border :column="3" size="small">
      <ElDescriptionsItem label="计划离职时间">
        {{ formatHrmDateTime(quitInfo.planQuitTime) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="申请离职日期">
        {{ formatHrmDateTime(quitInfo.applyQuitTime) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="薪资结算日期">
        {{ formatHrmDateTime(quitInfo.salarySettlementTime) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="离职类型">
        {{ formatHrmEmployeeQuitType(quitInfo.type) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="离职原因">
        {{ formatHrmEmployeeQuitReason(quitInfo.reason) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="备注">
        {{ quitInfo.remark || '-' }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </ElCard>
</template>
