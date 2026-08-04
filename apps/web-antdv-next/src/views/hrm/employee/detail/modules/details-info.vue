<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { DICT_TYPE } from '@vben/constants';

import { Descriptions, DescriptionsItem } from 'antdv-next';

import { DictTag } from '#/components/dict-tag';
import {
  formatHrmDateTime,
  formatHrmEmployeeIdType,
} from '#/views/hrm/utils/format';
defineProps<{ employee: HrmEmployeeApi.Employee }>();
</script>
<template>
  <Descriptions bordered :column="3" size="small">
    <DescriptionsItem label="员工姓名">
      {{ employee.name || '-' }}
    </DescriptionsItem>
    <DescriptionsItem label="手机号">
      {{ employee.mobile || '-' }}
    </DescriptionsItem>
    <DescriptionsItem label="邮箱">
      {{ employee.email || '-' }}
    </DescriptionsItem>
    <DescriptionsItem label="证件类型">
      {{ formatHrmEmployeeIdType(employee.idType) }}
    </DescriptionsItem>
    <DescriptionsItem label="证件号码">
      {{ employee.idNumber || '-' }}
    </DescriptionsItem>
    <DescriptionsItem label="性别">
      <DictTag
        v-if="employee.sex != null"
        :type="DICT_TYPE.SYSTEM_USER_SEX"
        :value="employee.sex"
      /><span v-else>-</span>
    </DescriptionsItem>
    <DescriptionsItem label="出生时间">
      {{ formatHrmDateTime(employee.birthday) }}
    </DescriptionsItem>
    <DescriptionsItem label="年龄">
      {{ employee.age ?? '-' }}
    </DescriptionsItem>
    <DescriptionsItem label="最高学历">
      <DictTag
        v-if="employee.highestEducation != null"
        :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
        :value="employee.highestEducation"
      /><span v-else>-</span>
    </DescriptionsItem>
    <DescriptionsItem label="户籍地址" :span="3">
      {{ employee.address || '-' }}
    </DescriptionsItem>
  </Descriptions>
</template>
