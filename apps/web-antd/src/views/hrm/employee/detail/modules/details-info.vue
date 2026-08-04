<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { DICT_TYPE } from '@vben/constants';

import { Descriptions } from 'ant-design-vue';

import { DictTag } from '#/components/dict-tag';
import {
  formatHrmDateTime,
  formatHrmEmployeeIdType,
} from '#/views/hrm/utils/format';
defineProps<{ employee: HrmEmployeeApi.Employee }>();
</script>
<template>
  <Descriptions bordered :column="3" size="small">
    <Descriptions.Item label="员工姓名">
      {{ employee.name || '-' }}
    </Descriptions.Item>
    <Descriptions.Item label="手机号">
      {{ employee.mobile || '-' }}
    </Descriptions.Item>
    <Descriptions.Item label="邮箱">
      {{ employee.email || '-' }}
    </Descriptions.Item>
    <Descriptions.Item label="证件类型">
      {{ formatHrmEmployeeIdType(employee.idType) }}
    </Descriptions.Item>
    <Descriptions.Item label="证件号码">
      {{ employee.idNumber || '-' }}
    </Descriptions.Item>
    <Descriptions.Item label="性别">
      <DictTag
        v-if="employee.sex != null"
        :type="DICT_TYPE.SYSTEM_USER_SEX"
        :value="employee.sex"
      /><span v-else>-</span>
    </Descriptions.Item>
    <Descriptions.Item label="出生时间">
      {{ formatHrmDateTime(employee.birthday) }}
    </Descriptions.Item>
    <Descriptions.Item label="年龄">
      {{ employee.age ?? '-' }}
    </Descriptions.Item>
    <Descriptions.Item label="最高学历">
      <DictTag
        v-if="employee.highestEducation != null"
        :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
        :value="employee.highestEducation"
      /><span v-else>-</span>
    </Descriptions.Item>
    <Descriptions.Item label="户籍地址" :span="3">
      {{ employee.address || '-' }}
    </Descriptions.Item>
  </Descriptions>
</template>
