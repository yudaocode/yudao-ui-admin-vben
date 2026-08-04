<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { computed } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { Card } from 'antdv-next';

import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';

import { useHeaderSchema } from '../../data';

const props = withDefaults(
  defineProps<{ employee: HrmEmployeeApi.Employee; loading?: boolean }>(),
  { loading: false },
);
const headerData = computed(() => props.employee);
const [Descriptions] = useDescription({
  bordered: false,
  column: 5,
  layout: 'vertical',
  schema: useHeaderSchema(),
});
</script>
<template>
  <div>
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2.5">
          <span class="break-all text-xl font-bold">{{
            employee.name || '-'
          }}</span>
          <DictTag
            v-if="employee.entryStatus != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS"
            :value="employee.entryStatus"
          />
          <DictTag
            v-if="employee.status != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
            :value="employee.status"
          />
        </div>
        <div class="text-muted-foreground mt-1.5 text-sm">
          员工编号：{{ employee.id || '-' }}
        </div>
      </div>
      <div><slot></slot></div>
    </div>
    <Card
      :style="{ marginTop: '10px', marginBottom: '15px' }"
      :loading="loading"
    >
      <Descriptions :data="headerData" />
    </Card>
  </div>
</template>
