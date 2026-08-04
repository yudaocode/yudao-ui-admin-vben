<script lang="ts" setup>
import type { HrmSalaryEmployeeInfoApi } from '#/api/hrm/salary/employee-info';

import { DICT_TYPE } from '@vben/constants';

import {
  ElCard,
  ElCol,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElRow,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { DictTag } from '#/components/dict-tag';
import { formatHrmDate, formatHrmMoney } from '#/views/hrm/utils/format';

defineOptions({ name: 'HrmSalaryEmployeeInfoDetails' });

defineProps<{
  salaryEmployee: HrmSalaryEmployeeInfoApi.SalaryEmployeeInfo;
}>();
</script>

<template>
  <template v-if="salaryEmployee.id">
    <ElCard class="mb-4">
      <ElDescriptions border :column="3">
        <ElDescriptionsItem label="正式工资">
          {{ formatHrmMoney(salaryEmployee.regularSalary) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="试用期工资">
          {{ formatHrmMoney(salaryEmployee.probationSalary) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="生效日期">
          {{ formatHrmDate(salaryEmployee.effectTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="调整原因">
          <DictTag
            v-if="salaryEmployee.changeReason != null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
            :value="salaryEmployee.changeReason"
          />
          <span v-else>-</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="档案状态">
          <DictTag
            v-if="salaryEmployee.changeType != null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_TYPE"
            :value="salaryEmployee.changeType"
          />
          <span v-else>-</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="备注">
          {{ salaryEmployee.remark || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>

    <ElRow :gutter="16">
      <ElCol :span="12">
        <ElCard class="mb-4" header="正式工资明细">
          <ElTable
            border
            size="small"
            :data="salaryEmployee.salaryOptions || []"
          >
            <ElTableColumn label="薪资项" min-width="160" prop="name" />
            <ElTableColumn
              align="center"
              label="编码"
              prop="code"
              width="110"
            />
            <ElTableColumn align="right" label="金额" width="130">
              <template #default="{ row }">
                {{ formatHrmMoney(row.value) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </ElCol>
      <ElCol :span="12">
        <ElCard class="mb-4" header="试用期工资明细">
          <ElTable
            border
            size="small"
            :data="salaryEmployee.probationSalaryOptions || []"
          >
            <ElTableColumn label="薪资项" min-width="160" prop="name" />
            <ElTableColumn
              align="center"
              label="编码"
              prop="code"
              width="110"
            />
            <ElTableColumn align="right" label="金额" width="130">
              <template #default="{ row }">
                {{ formatHrmMoney(row.value) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </ElCol>
    </ElRow>
  </template>

  <ElCard v-else>
    <ElEmpty description="该员工尚未定薪" />
  </ElCard>
</template>
