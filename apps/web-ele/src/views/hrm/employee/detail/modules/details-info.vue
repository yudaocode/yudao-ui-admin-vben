<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import {
  ElCollapse,
  ElCollapseItem,
  ElDescriptions,
  ElDescriptionsItem,
} from 'element-plus';

import { DictTag } from '#/components/dict-tag';
import {
  formatHrmDateTime,
  formatHrmEmployeeIdType,
} from '#/views/hrm/utils/format';

defineProps<{ employee: HrmEmployeeApi.Employee }>();

const activeNames = ref(['basicInfo', 'systemInfo']);
</script>
<template>
  <ElCollapse v-model="activeNames">
    <ElCollapseItem name="basicInfo" title="基本信息">
      <ElDescriptions :column="3" border size="small">
        <ElDescriptionsItem label="员工姓名">
          {{ employee.name || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="手机号">
          {{ employee.mobile || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="性别">
          <DictTag
            v-if="employee.sex != null"
            :type="DICT_TYPE.SYSTEM_USER_SEX"
            :value="employee.sex"
          /><span v-else>-</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="年龄">
          {{ employee.age ?? '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="国家或地区">
          {{ employee.country || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="民族">
          {{ employee.nation || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="证件类型">
          {{ formatHrmEmployeeIdType(employee.idType) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="证件号码">
          {{ employee.idNumber || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="邮箱">
          {{ employee.email || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="籍贯">
          {{ employee.nativePlace || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="出生时间">
          {{ formatHrmDateTime(employee.birthday) }}
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
    </ElCollapseItem>
    <ElCollapseItem name="systemInfo" title="系统信息">
      <ElDescriptions :column="3" border size="small">
        <ElDescriptionsItem label="后台账号">
          {{ employee.userNickname || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="账号编号">
          {{ employee.userId || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="候选人编号">
          {{ employee.candidateId || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间">
          {{ formatHrmDateTime(employee.createTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="备注" :span="3">
          {{ employee.remark || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCollapseItem>
  </ElCollapse>
</template>
