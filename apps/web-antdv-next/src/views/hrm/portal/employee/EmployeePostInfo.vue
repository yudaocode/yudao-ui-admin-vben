<script lang="ts" setup>
import type { HrmEmployeeQuitInfoApi } from '#/api/hrm/employee/quit-info';
import type { HrmPortalEmployeeApi } from '#/api/hrm/portal/employee';

import { onMounted, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { Card, Descriptions, DescriptionsItem, Spin } from 'antdv-next';

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
  <Spin :spinning="loading">
    <Card title="岗位信息" :style="{ marginBottom: '15px' }">
      <Descriptions bordered :column="4" size="small">
        <DescriptionsItem label="工号">
          {{ employee.jobNumber || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="部门">
          {{ employee.deptName || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="岗位">
          {{ employee.postName || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="岗位职级">
          {{ employee.postLevel || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="直属上级">
          {{ employee.leaderEmployeeName || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="入职状态">
          <DictTag
            v-if="employee.entryStatus != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS"
            :value="employee.entryStatus"
          />
          <span v-else>-</span>
        </DescriptionsItem>
        <DescriptionsItem label="员工状态">
          <DictTag
            v-if="employee.status != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
            :value="employee.status"
          />
          <span v-else>-</span>
        </DescriptionsItem>
        <DescriptionsItem label="聘用形式">
          <DictTag
            v-if="employee.type != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
            :value="employee.type"
          />
          <span v-else>-</span>
        </DescriptionsItem>
        <DescriptionsItem label="入职时间">
          {{ formatHrmDateTime(employee.entryTime) }}
        </DescriptionsItem>
        <DescriptionsItem label="转正时间">
          {{ formatHrmDateTime(employee.regularTime) }}
        </DescriptionsItem>
        <DescriptionsItem label="试用期">
          {{ employee.probation != null ? `${employee.probation} 个月` : '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="司龄">
          {{ employee.companyAge != null ? `${employee.companyAge} 年` : '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="工作城市">
          {{ employee.workCity || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="工作地点">
          {{ employee.workAddress || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="详细地址" :span="2">
          {{ employee.workDetailAddress || '-' }}
        </DescriptionsItem>
      </Descriptions>
    </Card>

    <Card v-if="quitInfo" :style="{ marginBottom: '15px' }" title="离职信息">
      <Descriptions bordered :column="4" size="small">
        <DescriptionsItem label="计划离职时间">
          {{ formatHrmDateTime(quitInfo.planQuitTime) }}
        </DescriptionsItem>
        <DescriptionsItem label="申请离职日期">
          {{ formatHrmDate(quitInfo.applyQuitTime) }}
        </DescriptionsItem>
        <DescriptionsItem label="薪资结算日期">
          {{ formatHrmDate(quitInfo.salarySettlementTime) }}
        </DescriptionsItem>
        <DescriptionsItem label="离职类型">
          {{ formatHrmEmployeeQuitType(quitInfo.type) }}
        </DescriptionsItem>
        <DescriptionsItem label="离职原因">
          {{ formatHrmEmployeeQuitReason(quitInfo.reason) }}
        </DescriptionsItem>
        <DescriptionsItem label="备注" :span="3">
          {{ quitInfo.remark || '-' }}
        </DescriptionsItem>
      </Descriptions>
    </Card>
  </Spin>
</template>
