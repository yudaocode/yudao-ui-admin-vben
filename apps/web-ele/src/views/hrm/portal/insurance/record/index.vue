<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPortalInsuranceRecordApi } from '#/api/hrm/portal/insurance/record';

import { nextTick, onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import dayjs from 'dayjs';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getInsuranceRecordList } from '#/api/hrm/portal/insurance/record';
import { DictTag } from '#/components/dict-tag';
import { checkHrmPortalAccess } from '#/views/hrm/utils/employee';

import { useGridColumns, useGridFormSchema } from './data';
import InsuranceRecordDetail from './modules/insurance-record-detail.vue';

defineOptions({ name: 'HrmPortalInsurance' });

const router = useRouter();
const accessible = ref(false);
const firstYear = ref<number>();

function isYearDisabled(value: unknown) {
  return (
    firstYear.value !== undefined &&
    dayjs(value as string).year() < firstYear.value
  );
}

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: InsuranceRecordDetail,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(isYearDisabled),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: { enabled: false },
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async (_params: any, formValues: any) =>
          getInsuranceRecordList({ year: Number(formValues.year) }),
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<HrmPortalInsuranceRecordApi.PortalInsuranceRecord>,
});

function openDetail(record: any) {
  detailModalApi.setData({ id: record.id, month: record.month }).open();
}

/** 页面激活时刷新参保记录 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router);
  if (!accessible.value) return;

  gridApi.setLoading(true);
  try {
    const records = (await getInsuranceRecordList()) || [];
    const years = records.map((record) => record.year);
    const activeYear = years.length > 0 ? Math.max(...years) : dayjs().year();
    firstYear.value = years.length > 0 ? Math.min(...years) : undefined;
    await gridApi.formApi.setFieldValue('year', String(activeYear));
    await nextTick();
    await gridApi.grid.reloadData(
      records.filter((record) => record.year === activeYear),
    );
  } finally {
    gridApi.setLoading(false);
  }
});
</script>

<template>
  <Page v-if="accessible" auto-content-height>
    <Grid table-title="社保管理">
      <template #schemeName="{ row }">
        <div>{{ row.schemeName || '-' }}</div>
        <div v-if="row.schemeCity" class="text-muted-foreground mt-1 text-xs">
          {{ row.schemeCity }}
        </div>
      </template>
      <template #schemeType="{ row }">
        <DictTag
          v-if="row.schemeType"
          :type="DICT_TYPE.HRM_INSURANCE_SCHEME_TYPE"
          :value="row.schemeType"
        />
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '查看详情',
              type: 'primary',
              link: true,
              onClick: () => openDetail(row),
            },
          ]"
        />
      </template>
    </Grid>
    <DetailModal />
  </Page>
</template>
