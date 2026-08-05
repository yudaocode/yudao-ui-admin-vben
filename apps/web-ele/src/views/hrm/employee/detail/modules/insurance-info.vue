<script lang="ts" setup>
import type { HrmInsuranceEmployeeInfoApi } from '#/api/hrm/insurance/employee-info';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';

import {
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
} from 'element-plus';

import { getInsuranceEmployeeInfo } from '#/api/hrm/insurance/employee-info';
import { formatHrmMonth, formatHrmYesNo } from '#/views/hrm/utils/format';

import InsuranceInfoForm from './insurance-info-form.vue';
const props = defineProps<{ employeeId: number }>();
const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const info = ref<HrmInsuranceEmployeeInfoApi.InsuranceEmployeeInfo>();
const formRef = ref<InstanceType<typeof InsuranceInfoForm>>();
async function load() {
  loading.value = true;
  try {
    info.value = await getInsuranceEmployeeInfo(props.employeeId);
  } finally {
    loading.value = false;
  }
}
onMounted(load);
</script>
<template>
  <ElCard
    header="社保资料"
    :style="{ marginBottom: '15px' }"
    :loading="loading"
  >
    <template #extra>
      <ElButton
        v-if="hasAccessByCodes(['hrm:insurance:employee-info:update'])"
        link
        type="primary"
        @click="formRef?.open(employeeId, info)"
      >
        编辑
      </ElButton>
    </template>
    <ElDescriptions border :column="3" size="small">
      <ElDescriptionsItem label="社保编号">
        {{ info?.socialSecurityNumber || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="公积金编号">
        {{ info?.accumulationFundNumber || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="社保起始月">
        {{ formatHrmMonth(info?.socialSecurityStartMonth) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="参保方案">
        {{ info?.schemeName || info?.schemeId || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="本地首次缴纳社保">
        {{ formatHrmYesNo(info?.firstSocialSecurity) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="本地首次缴纳公积金">
        {{ formatHrmYesNo(info?.firstAccumulationFund) }}
      </ElDescriptionsItem>
    </ElDescriptions>
    <InsuranceInfoForm ref="formRef" @success="load" />
  </ElCard>
</template>
