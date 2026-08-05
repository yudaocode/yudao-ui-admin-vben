<script lang="ts" setup>
import type { HrmInsuranceEmployeeInfoApi } from '#/api/hrm/insurance/employee-info';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';

import { Button, Card, Descriptions } from 'ant-design-vue';

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
  <Card title="社保资料" :style="{ marginBottom: '15px' }" :loading="loading">
    <template #extra>
      <Button
        v-if="hasAccessByCodes(['hrm:insurance:employee-info:update'])"
        type="link"
        @click="formRef?.open(employeeId, info)"
      >
        编辑
      </Button>
    </template>
    <Descriptions bordered :column="3" size="small">
      <Descriptions.Item label="社保编号">
        {{ info?.socialSecurityNumber || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="公积金编号">
        {{ info?.accumulationFundNumber || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="社保起始月">
        {{ formatHrmMonth(info?.socialSecurityStartMonth) }}
      </Descriptions.Item>
      <Descriptions.Item label="参保方案">
        {{ info?.schemeName || info?.schemeId || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="本地首次缴纳社保">
        {{ formatHrmYesNo(info?.firstSocialSecurity) }}
      </Descriptions.Item>
      <Descriptions.Item label="本地首次缴纳公积金">
        {{ formatHrmYesNo(info?.firstAccumulationFund) }}
      </Descriptions.Item>
    </Descriptions>
    <InsuranceInfoForm ref="formRef" @success="load" />
  </Card>
</template>
