<script lang="ts" setup>
import type { HrmInsuranceEmployeeInfoApi } from '#/api/hrm/insurance/employee-info';

import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Card, Descriptions, DescriptionsItem } from 'antdv-next';

import { ACTION_ICON, TableAction } from '#/adapter/vxe-table';
import { getInsuranceEmployeeInfo } from '#/api/hrm/insurance/employee-info';
import { formatHrmMonth, formatHrmYesNo } from '#/views/hrm/utils/format';

import InsuranceInfoForm from './insurance-info-form.vue';

const props = defineProps<{ employeeId: number }>();
const loading = ref(false);
const info = ref<HrmInsuranceEmployeeInfoApi.InsuranceEmployeeInfo>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: InsuranceInfoForm,
  destroyOnClose: true,
});

async function load() {
  loading.value = true;
  try {
    info.value = await getInsuranceEmployeeInfo(props.employeeId);
  } finally {
    loading.value = false;
  }
}

function openForm() {
  formModalApi
    .setData({ employeeId: props.employeeId, row: info.value })
    .open();
}

onMounted(load);
</script>

<template>
  <Card title="社保资料" :style="{ marginBottom: '15px' }" :loading="loading">
    <template #extra>
      <TableAction
        :actions="[
          {
            label: '编辑',
            type: 'link',
            icon: ACTION_ICON.EDIT,
            auth: ['hrm:insurance:employee-info:update'],
            onClick: openForm,
          },
        ]"
      />
    </template>
    <Descriptions bordered :column="3" size="small">
      <DescriptionsItem label="社保编号">
        {{ info?.socialSecurityNumber || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="公积金编号">
        {{ info?.accumulationFundNumber || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="社保起始月">
        {{ formatHrmMonth(info?.socialSecurityStartMonth) }}
      </DescriptionsItem>
      <DescriptionsItem label="参保方案">
        {{ info?.schemeName || info?.schemeId || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="本地首次缴纳社保">
        {{ formatHrmYesNo(info?.firstSocialSecurity) }}
      </DescriptionsItem>
      <DescriptionsItem label="本地首次缴纳公积金">
        {{ formatHrmYesNo(info?.firstAccumulationFund) }}
      </DescriptionsItem>
    </Descriptions>
    <FormModal @success="load" />
  </Card>
</template>
