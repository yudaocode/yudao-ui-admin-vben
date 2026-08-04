<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { DICT_TYPE } from '@vben/constants';

import { ElDescriptions, ElDescriptionsItem } from 'element-plus';

import { DictTag } from '#/components/dict-tag';
import {
  formatHrmDateTime,
  formatHrmEmployeeIdType,
} from '#/views/hrm/utils/format';
defineProps<{ employee: HrmEmployeeApi.Employee }>();
</script>
<template>
  <ElDescriptions bordered :column="3" size="small">
    <ElDescriptionsItem label="员工姓名">
      {{ employee.name || '-' }}
    </ElDescriptionsItem>
    <ElDescriptionsItem label="手机号">
      {{ employee.mobile || '-' }}
    </ElDescriptionsItem>
    <ElDescriptionsItem label="邮箱">
      {{ employee.email || '-' }}
    </ElDescriptionsItem>
    <ElDescriptionsItem label="证件类型">
      {{ formatHrmEmployeeIdType(employee.idType) }}
    </ElDescriptionsItem>
    <ElDescriptionsItem label="证件号码">
      {{ employee.idNumber || '-' }}
    </ElDescriptionsItem>
    <ElDescriptionsItem label="性别">
      <DictTag
        v-if="employee.sex != null"
        :type="DICT_TYPE.SYSTEM_USER_SEX"
        :value="employee.sex"
      /><span v-else>-</span>
    </ElDescriptionsItem>
    <ElDescriptionsItem label="出生时间">
      {{ formatHrmDateTime(employee.birthday) }}
    </ElDescriptionsItem>
    <ElDescriptionsItem label="年龄">
      {{ employee.age ?? '-' }}
    </ElDescriptionsItem>
    <ElDescriptionsItem label="最高学历">
      <DictTag
        v-if="employee.highestEducation != null"
        :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
        :value="employee.highestEducation"
      /><span v-else>-</span>
    </ElDescriptionsItem>
    <ElDescriptionsItem label="户籍地址" :span="3">
      {{ employee.address || '-' }}
    </ElDescriptionsItem>
  </ElDescriptions>
</template>
