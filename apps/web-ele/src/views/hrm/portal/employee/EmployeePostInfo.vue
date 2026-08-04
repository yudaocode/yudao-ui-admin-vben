<script lang="ts" setup>
import type { HrmEmployeeQuitInfoApi } from '#/api/hrm/employee/quit-info';
import type { HrmPortalEmployeeApi } from '#/api/hrm/portal/employee';

import { onMounted, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { ElCard, ElDescriptions, ElDescriptionsItem } from 'element-plus';

import { getEmployeeQuitInfo } from '#/api/hrm/portal/employee/quit-info';
import { DictTag } from '#/components/dict-tag';
import {
  formatHrmDate,
  formatHrmDateTime,
  formatHrmEmployeeQuitReason,
  formatHrmEmployeeQuitType,
} from '#/views/hrm/utils/format';

defineOptions({ name: 'HrmPortalEmployeePostInfo' });

defineProps<{
  employee: HrmPortalEmployeeApi.PortalEmployee;
}>();

const loading = ref(false);
const quitInfo = ref<HrmEmployeeQuitInfoApi.EmployeeQuitInfo>();

/** 获得当前员工离职信息 */
async function getQuitInfo() {
  loading.value = true;
  try {
    quitInfo.value = await getEmployeeQuitInfo();
  } finally {
    loading.value = false;
  }
}

defineExpose({ getQuitInfo });

onMounted(() => {
  getQuitInfo();
});
</script>

<template>
  <div v-loading="loading">
    <ElCard shadow="never" :style="{ marginBottom: '15px' }">
      <template #header>
        <span class="font-semibold">岗位信息</span>
      </template>
      <ElDescriptions border :column="4" size="small">
        <ElDescriptionsItem label="工号">
          {{ employee.jobNumber || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="部门">
          {{ employee.deptName || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="岗位">
          {{ employee.postName || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="岗位职级">
          {{ employee.postLevel || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="直属上级">
          {{ employee.leaderEmployeeName || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="入职状态">
          <DictTag
            v-if="employee.entryStatus != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS"
            :value="employee.entryStatus"
          />
          <span v-else>-</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="员工状态">
          <DictTag
            v-if="employee.status != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
            :value="employee.status"
          />
          <span v-else>-</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="聘用形式">
          <DictTag
            v-if="employee.type != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
            :value="employee.type"
          />
          <span v-else>-</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="入职时间">
          {{ formatHrmDateTime(employee.entryTime?.valueOf()) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="转正时间">
          {{ formatHrmDateTime(employee.regularTime?.valueOf()) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="试用期">
          {{ employee.probation != null ? `${employee.probation} 个月` : '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="司龄">
          {{ employee.companyAge != null ? `${employee.companyAge} 年` : '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="工作城市">
          {{ employee.workCity || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="工作地点">
          {{ employee.workAddress || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="详细地址" :span="2">
          {{ employee.workDetailAddress || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>

    <ElCard v-if="quitInfo" shadow="never" :style="{ marginBottom: '15px' }">
      <template #header>
        <span class="font-semibold">离职信息</span>
      </template>
      <ElDescriptions border :column="4" size="small">
        <ElDescriptionsItem label="计划离职时间">
          {{ formatHrmDateTime(quitInfo.planQuitTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="申请离职日期">
          {{ formatHrmDate(quitInfo.applyQuitTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="薪资结算日期">
          {{ formatHrmDate(quitInfo.salarySettlementTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="离职类型">
          {{ formatHrmEmployeeQuitType(quitInfo.type) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="离职原因">
          {{ formatHrmEmployeeQuitReason(quitInfo.reason) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="备注" :span="3">
          {{ quitInfo.remark || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>
  </div>
</template>
