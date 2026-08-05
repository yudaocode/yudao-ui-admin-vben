<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { DICT_TYPE } from '@vben/constants';

import { ElCard, ElDescriptions, ElDescriptionsItem } from 'element-plus';

import { DictTag } from '#/components/dict-tag';
import { formatHrmDateTime } from '#/views/hrm/utils/format';

import ChangeRecordList from './change-record-list.vue';
import QuitInfo from './quit-info.vue';

defineProps<{ employee: HrmEmployeeApi.Employee; employeeId: number }>();
const emit = defineEmits<{ editQuit: []; refresh: [] }>();
</script>
<template>
  <!-- 对齐源 ContentWrap：首块无标题，块间距 15px -->
  <ElCard :style="{ marginBottom: '15px' }">
    <ElDescriptions border :column="3" size="small">
      <ElDescriptionsItem label="工号">
        {{ employee.jobNumber || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="所属部门">
        {{ employee.deptName || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="职位名称">
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
      </ElDescriptionsItem>
      <ElDescriptionsItem label="员工状态">
        <DictTag
          v-if="employee.status != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
          :value="employee.status"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="聘用形式">
        <DictTag
          v-if="employee.type != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
          :value="employee.type"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="入职时间">
        {{ formatHrmDateTime(employee.entryTime) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="试用期">
        {{ employee.probation != null ? `${employee.probation} 个月` : '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="转正时间">
        {{ formatHrmDateTime(employee.regularTime) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="离职时间">
        {{ formatHrmDateTime(employee.leaveTime) }}
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
      <ElDescriptionsItem label="招聘渠道">
        {{ employee.channelName || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="司龄起算">
        {{ formatHrmDateTime(employee.companyAgeStartTime) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="司龄">
        {{ employee.companyAge != null ? `${employee.companyAge} 年` : '-' }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </ElCard>
  <ElCard header="异动记录" :style="{ marginBottom: '15px' }">
    <ChangeRecordList
      :employee="employee"
      :employee-id="employeeId"
      @success="emit('refresh')"
    />
  </ElCard>
  <QuitInfo :employee-id="employeeId" @edit="emit('editQuit')" />
</template>
