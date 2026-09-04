<script lang="ts" setup>
import type { HrmInsuranceEmployeeInfoApi } from '#/api/hrm/insurance/employee-info';

import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElCard, ElDescriptions, ElDescriptionsItem } from 'element-plus';

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
  <ElCard
    v-loading="loading"
    header="社保资料"
    :style="{ marginBottom: '15px' }"
    shadow="never"
  >
    <template #extra>
      <TableAction
        :actions="[
          {
            label: '编辑',
            type: 'primary',
            link: true,
            icon: ACTION_ICON.EDIT,
            auth: ['hrm:insurance:employee-info:update'],
            onClick: openForm,
          },
        ]"
      />
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
    <FormModal @success="load" />
  </ElCard>
</template>
