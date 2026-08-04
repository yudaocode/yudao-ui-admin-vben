<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { DICT_TYPE } from '@vben/constants';

import { Card, Descriptions, DescriptionsItem } from 'antdv-next';

import { DictTag } from '#/components/dict-tag';
import { formatHrmDateTime } from '#/views/hrm/utils/format';

import ChangeRecordList from './change-record-list.vue';
import QuitInfo from './quit-info.vue';

defineProps<{ employee: HrmEmployeeApi.Employee; employeeId: number }>();
const emit = defineEmits<{ editQuit: []; refresh: [] }>();
</script>
<template>
  <!-- 对齐源 ContentWrap：首块无标题，块间距 15px -->
  <Card :style="{ marginBottom: '15px' }">
    <Descriptions bordered :column="3" size="small">
      <DescriptionsItem label="工号">
        {{ employee.jobNumber || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="所属部门">
        {{ employee.deptName || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="职位名称">
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
      </DescriptionsItem>
      <DescriptionsItem label="员工状态">
        <DictTag
          v-if="employee.status != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
          :value="employee.status"
        />
      </DescriptionsItem>
      <DescriptionsItem label="聘用形式">
        <DictTag
          v-if="employee.type != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
          :value="employee.type"
        />
      </DescriptionsItem>
      <DescriptionsItem label="入职时间">
        {{ formatHrmDateTime(employee.entryTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="试用期">
        {{ employee.probation != null ? `${employee.probation} 个月` : '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="转正时间">
        {{ formatHrmDateTime(employee.regularTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="离职时间">
        {{ formatHrmDateTime(employee.leaveTime) }}
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
      <DescriptionsItem label="招聘渠道">
        {{ employee.channelName || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="司龄起算">
        {{ formatHrmDateTime(employee.companyAgeStartTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="司龄">
        {{ employee.companyAge != null ? `${employee.companyAge} 年` : '-' }}
      </DescriptionsItem>
    </Descriptions>
  </Card>
  <Card title="异动记录" :style="{ marginBottom: '15px' }">
    <ChangeRecordList
      :employee="employee"
      :employee-id="employeeId"
      @success="emit('refresh')"
    />
  </Card>
  <QuitInfo :employee-id="employeeId" @edit="emit('editQuit')" />
</template>
