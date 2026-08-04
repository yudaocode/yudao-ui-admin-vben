<script lang="ts" setup>
import type { HrmSalaryChangeRecordApi } from '#/api/hrm/salary/change-record';

import { onMounted, ref } from 'vue';

import { ElCard, ElTable, ElTableColumn } from 'element-plus';

import { getSalaryChangeRecordList } from '#/api/hrm/salary/change-record';
import { formatHrmDateTime } from '#/views/hrm/utils/format';

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
  <ElCard :style="{ marginBottom: '15px' }" header="调薪记录">
    <ElTable v-loading="loading" :data="list" border row-key="id" size="small">
      <ElTableColumn label="记录类型" min-width="100" prop="recordType" />
      <ElTableColumn label="调整原因" min-width="120" prop="changeReason" />
      <ElTableColumn label="生效时间" min-width="120">
        <template #default="{ row }">
          {{ formatHrmDateTime(row.effectTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="备注" min-width="160" prop="remark" />
    </ElTable>
  </ElCard>
</template>
