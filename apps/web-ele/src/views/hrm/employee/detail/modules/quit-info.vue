<script lang="ts" setup>
import type { HrmEmployeeQuitInfoApi } from '#/api/hrm/employee/quit-info';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { DICT_TYPE } from '@vben/constants';

import {
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
} from 'element-plus';

import { getEmployeeQuitInfo } from '#/api/hrm/employee/quit-info';
import { DictTag } from '#/components/dict-tag';
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
  <ElCard v-if="quitInfo" v-loading="loading" :style="{ marginBottom: '15px' }">
    <template #header>
      <div class="flex items-center justify-between">
        <span>离职信息</span>
        <ElButton
          v-if="hasAccessByCodes(['hrm:employee:update'])"
          link
          type="primary"
          @click="emit('edit')"
        >
          编辑
        </ElButton>
      </div>
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
      <ElDescriptionsItem label="原员工状态">
        <DictTag
          v-if="quitInfo.oldEmployeeStatus != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
          :value="quitInfo.oldEmployeeStatus"
        />
        <span v-else>-</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem :span="3" label="备注">
        {{ quitInfo.remark || '-' }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </ElCard>
</template>
