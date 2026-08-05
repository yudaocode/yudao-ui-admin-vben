<script lang="ts" setup>
import type { HrmSalaryChangeRecordApi } from '#/api/hrm/salary/change-record';

import { onMounted, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { ElCard, ElTable, ElTableColumn } from 'element-plus';

import { getSalaryChangeRecordList } from '#/api/hrm/salary/change-record';
import { DictTag } from '#/components/dict-tag';
import { HrmSalaryRecordType } from '#/views/hrm/utils/constants';
import { formatHrmDateTime, formatHrmMoney } from '#/views/hrm/utils/format';

const props = defineProps<{ employeeId: number }>();
const loading = ref(false);
const list = ref<HrmSalaryChangeRecordApi.SalaryChangeRecord[]>([]);

onMounted(async () => {
  loading.value = true;
  try {
    list.value = await getSalaryChangeRecordList(props.employeeId);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <ElCard :style="{ marginBottom: '15px' }" header="定薪/调薪记录">
    <ElTable v-loading="loading" :data="list" border row-key="id" size="small">
      <ElTableColumn label="生效日期" min-width="120">
        <template #default="{ row }">
          {{ formatHrmDateTime(row.effectTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="类型" min-width="90">
        <template #default="{ row }">
          {{ row.recordType === HrmSalaryRecordType.FIXED ? '定薪' : '调薪' }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="原因" min-width="90">
        <template #default="{ row }">
          <DictTag
            v-if="row.changeReason != null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
            :value="row.changeReason"
          />
          <span v-else>-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn align="right" label="调整前" min-width="120">
        <template #default="{ row }">
          {{ formatHrmMoney(row.beforeTotal) }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="right" label="调整后" min-width="120">
        <template #default="{ row }">
          {{ formatHrmMoney(row.afterTotal) }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="right" label="试用调整前" min-width="120">
        <template #default="{ row }">
          {{ formatHrmMoney(row.probationBeforeTotal) }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="right" label="试用调整后" min-width="120">
        <template #default="{ row }">
          {{ formatHrmMoney(row.probationAfterTotal) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" min-width="110">
        <template #default="{ row }">
          <DictTag
            v-if="row.status != null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_RECORD_STATUS"
            :value="row.status"
          />
          <span v-else>-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="备注" min-width="160" prop="remark" />
    </ElTable>
  </ElCard>
</template>
