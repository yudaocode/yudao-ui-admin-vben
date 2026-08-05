<script lang="ts" setup>
import type { HrmSalaryEmployeeInfoApi } from '#/api/hrm/salary/employee-info';

import { onMounted, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { Card, Descriptions, Empty } from 'ant-design-vue';

import { getSalaryEmployeeInfo } from '#/api/hrm/salary/employee-info';
import { DictTag } from '#/components/dict-tag';
import { formatHrmDate, formatHrmMoney } from '#/views/hrm/utils/format';
const props = defineProps<{ employeeId: number }>();
const loading = ref(false);
const salaryInfo = ref<HrmSalaryEmployeeInfoApi.SalaryEmployeeInfo>();
onMounted(async () => {
  loading.value = true;
  try {
    salaryInfo.value = await getSalaryEmployeeInfo(props.employeeId);
  } finally {
    loading.value = false;
  }
});
</script>
<template>
  <Card
    title="当前薪资档案"
    :style="{ marginBottom: '15px' }"
    :loading="loading"
  >
    <Descriptions v-if="salaryInfo" bordered :column="3" size="small">
      <Descriptions.Item label="转正工资">
        {{ formatHrmMoney(salaryInfo.regularSalary) }}
      </Descriptions.Item>
      <Descriptions.Item label="试用工资">
        {{ formatHrmMoney(salaryInfo.probationSalary) }}
      </Descriptions.Item>
      <Descriptions.Item label="调整日期">
        {{ formatHrmDate(salaryInfo.effectTime) }}
      </Descriptions.Item>
      <Descriptions.Item label="调整类型">
        <DictTag
          v-if="salaryInfo.changeType != null"
          :type="DICT_TYPE.HRM_SALARY_CHANGE_TYPE"
          :value="salaryInfo.changeType"
        />
      </Descriptions.Item>
      <Descriptions.Item label="调整原因">
        <DictTag
          v-if="salaryInfo.changeReason != null"
          :type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
          :value="salaryInfo.changeReason"
        />
      </Descriptions.Item>
      <Descriptions.Item label="备注">
        {{ salaryInfo.remark || '-' }}
      </Descriptions.Item>
    </Descriptions>
    <Empty v-else description="暂无薪资档案" />
  </Card>
</template>
