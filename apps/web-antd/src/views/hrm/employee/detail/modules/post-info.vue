<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { DICT_TYPE } from '@vben/constants';

import { Card, Descriptions } from 'ant-design-vue';

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
      <Descriptions.Item label="工号">
        {{ employee.jobNumber || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="所属部门">
        {{ employee.deptName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="职位名称">
        {{ employee.postName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="岗位职级">
        {{ employee.postLevel || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="直属上级">
        {{ employee.leaderEmployeeName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="入职状态">
        <DictTag
          v-if="employee.entryStatus != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS"
          :value="employee.entryStatus"
        />
      </Descriptions.Item>
      <Descriptions.Item label="员工状态">
        <DictTag
          v-if="employee.status != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
          :value="employee.status"
        />
      </Descriptions.Item>
      <Descriptions.Item label="聘用形式">
        <DictTag
          v-if="employee.type != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
          :value="employee.type"
        />
      </Descriptions.Item>
      <Descriptions.Item label="入职时间">
        {{ formatHrmDateTime(employee.entryTime) }}
      </Descriptions.Item>
      <Descriptions.Item label="试用期">
        {{ employee.probation != null ? `${employee.probation} 个月` : '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="转正时间">
        {{ formatHrmDateTime(employee.regularTime) }}
      </Descriptions.Item>
      <Descriptions.Item label="离职时间">
        {{ formatHrmDateTime(employee.leaveTime) }}
      </Descriptions.Item>
      <Descriptions.Item label="工作城市">
        {{ employee.workCity || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="工作地点">
        {{ employee.workAddress || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="详细地址" :span="2">
        {{ employee.workDetailAddress || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="招聘渠道">
        {{ employee.channelName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="司龄起算">
        {{ formatHrmDateTime(employee.companyAgeStartTime) }}
      </Descriptions.Item>
      <Descriptions.Item label="司龄">
        {{ employee.companyAge != null ? `${employee.companyAge} 年` : '-' }}
      </Descriptions.Item>
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
