<script lang="ts" setup>
import type { HrmSalaryChangeRecordApi } from '#/api/hrm/salary/change-record';

import { onMounted, ref } from 'vue';

import { Card, Table } from 'antdv-next';

import { getSalaryChangeRecordList } from '#/api/hrm/salary/change-record';
import { formatHrmDateTime } from '#/views/hrm/utils/format';
const props = defineProps<{ employeeId: number }>();
const loading = ref(false);
const list = ref<HrmSalaryChangeRecordApi.ChangeRecord[]>([]);
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
  <Card title="调薪记录" :style="{ marginBottom: '15px' }">
    <Table
      bordered
      size="small"
      :loading="loading"
      :data-source="list"
      :pagination="false"
      :row-key="(r) => r.id as any"
      :columns="
        [
          { title: '记录类型', dataIndex: 'recordType' },
          { title: '调整原因', dataIndex: 'changeReason' },
          {
            title: '生效时间',
            dataIndex: 'effectTime',
            customRender: ({ text }: any) => formatHrmDateTime(text),
          },
          { title: '备注', dataIndex: 'remark' },
        ] as any
      "
    />
  </Card>
</template>
