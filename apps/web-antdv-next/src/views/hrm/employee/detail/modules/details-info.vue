<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import {
  Collapse,
  CollapsePanel,
  Descriptions,
  DescriptionsItem,
} from 'antdv-next';

import { DictTag } from '#/components/dict-tag';
import {
  formatHrmDateTime,
  formatHrmEmployeeIdType,
} from '#/views/hrm/utils/format';

defineProps<{ employee: HrmEmployeeApi.Employee }>();

const activeKeys = ref(['basicInfo', 'systemInfo']);
</script>
<template>
  <Collapse v-model:active-key="activeKeys" ghost>
    <CollapsePanel key="basicInfo" header="基本信息">
      <Descriptions bordered :column="3" size="small">
        <DescriptionsItem label="员工姓名">
          {{ employee.name || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="手机号">
          {{ employee.mobile || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="性别">
          <DictTag
            v-if="employee.sex != null"
            :type="DICT_TYPE.SYSTEM_USER_SEX"
            :value="employee.sex"
          /><span v-else>-</span>
        </DescriptionsItem>
        <DescriptionsItem label="年龄">
          {{ employee.age ?? '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="国家或地区">
          {{ employee.country || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="民族">
          {{ employee.nation || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="证件类型">
          {{ formatHrmEmployeeIdType(employee.idType) }}
        </DescriptionsItem>
        <DescriptionsItem label="证件号码">
          {{ employee.idNumber || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="邮箱">
          {{ employee.email || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="籍贯">
          {{ employee.nativePlace || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="出生时间">
          {{ formatHrmDateTime(employee.birthday) }}
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
    </CollapsePanel>
    <CollapsePanel key="systemInfo" header="系统信息">
      <Descriptions bordered :column="3" size="small">
        <DescriptionsItem label="后台账号">
          {{ employee.userNickname || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="账号编号">
          {{ employee.userId || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="候选人编号">
          {{ employee.candidateId || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="创建时间">
          {{ formatHrmDateTime(employee.createTime) }}
        </DescriptionsItem>
        <DescriptionsItem label="备注" :span="3">
          {{ employee.remark || '-' }}
        </DescriptionsItem>
      </Descriptions>
    </CollapsePanel>
  </Collapse>
</template>
