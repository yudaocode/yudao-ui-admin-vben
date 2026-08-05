<script lang="ts" setup>
import type { HrmEmployeeQuitInfoApi } from '#/api/hrm/employee/quit-info';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { DICT_TYPE } from '@vben/constants';

import { Button, Card, Descriptions, DescriptionsItem } from 'antdv-next';

import { getEmployeeQuitInfo } from '#/api/hrm/employee/quit-info';
import { DictTag } from '#/components/dict-tag';
import {
  formatHrmDateTime,
  formatHrmEmployeeQuitReason,
  formatHrmEmployeeQuitType,
} from '#/views/hrm/utils/format';

const props = defineProps<{ employeeId: number }>();
const emit = defineEmits(['edit']);
const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const quitInfo = ref<HrmEmployeeQuitInfoApi.EmployeeQuitInfo>();

async function getQuitInfo() {
  loading.value = true;
  try {
    quitInfo.value = await getEmployeeQuitInfo(props.employeeId);
  } finally {
    loading.value = false;
  }
}
onMounted(getQuitInfo);
defineExpose({ getQuitInfo });
</script>
<template>
  <Card
    v-if="quitInfo"
    title="离职信息"
    :loading="loading"
    :style="{ marginBottom: '15px' }"
  >
    <template #extra>
      <Button
        v-if="hasAccessByCodes(['hrm:employee:update'])"
        type="link"
        @click="emit('edit')"
      >
        编辑
      </Button>
    </template>
    <Descriptions bordered :column="3" size="small">
      <DescriptionsItem label="计划离职时间">
        {{ formatHrmDateTime(quitInfo.planQuitTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="申请离职日期">
        {{ formatHrmDateTime(quitInfo.applyQuitTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="薪资结算日期">
        {{ formatHrmDateTime(quitInfo.salarySettlementTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="离职类型">
        {{ formatHrmEmployeeQuitType(quitInfo.type) }}
      </DescriptionsItem>
      <DescriptionsItem label="离职原因">
        {{ formatHrmEmployeeQuitReason(quitInfo.reason) }}
      </DescriptionsItem>
      <DescriptionsItem label="原员工状态">
        <DictTag
          v-if="quitInfo.oldEmployeeStatus != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
          :value="quitInfo.oldEmployeeStatus"
        />
        <span v-else>-</span>
      </DescriptionsItem>
      <DescriptionsItem label="备注" :span="3">
        {{ quitInfo.remark || '-' }}
      </DescriptionsItem>
    </Descriptions>
  </Card>
</template>
