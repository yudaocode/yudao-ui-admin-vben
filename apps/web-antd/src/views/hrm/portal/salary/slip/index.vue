<script lang="ts" setup>
import type { SalarySlipFilterValues } from './data';

import type { HrmPortalSalarySlipApi } from '#/api/hrm/portal/salary/slip';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Card, Empty, Spin, Tag } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  getSalarySlipList,
  markSalarySlipRead,
} from '#/api/hrm/portal/salary/slip';
import { HrmSalarySlipSort } from '#/views/hrm/utils/constants';
import { checkHrmPortalAccess } from '#/views/hrm/utils/employee';

import { buildSalarySlipListParams, useFilterFormSchema } from './data';
import SalarySlipGrid from './modules/slip-grid.vue';

defineOptions({ name: 'HrmPortalSalarySlip' });

const router = useRouter();
const accessible = ref(false);
const loading = ref(false);
const slips = ref<HrmPortalSalarySlipApi.PortalSalarySlip[]>([]);

/** 加载工资条 */
async function loadSlips(values?: SalarySlipFilterValues) {
  loading.value = true;
  try {
    const data =
      (await getSalarySlipList(
        buildSalarySlipListParams(
          values ?? { sort: HrmSalarySlipSort.RECENT_SEND },
        ),
      )) || [];
    slips.value = data;
    const unreadIds = data
      .filter((slip) => slip.readStatus === 0)
      .map((slip) => slip.id);
    if (unreadIds.length > 0) {
      await markSalarySlipRead(unreadIds);
    }
  } finally {
    loading.value = false;
  }
}

const [FilterForm, filterFormApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useFilterFormSchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
  handleSubmit: loadSlips,
  handleReset: () => loadSlips({ sort: HrmSalarySlipSort.RECENT_SEND }),
});

/** 页面激活时刷新工资条 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router);
  if (accessible.value) await filterFormApi.submitForm();
});
</script>

<template>
  <Page v-if="accessible">
    <Spin :spinning="loading">
      <Card class="mb-4" title="我的工资条">
        <FilterForm />
      </Card>

      <template v-if="slips.length">
        <Card
          v-for="(slip, index) in slips"
          :key="slip.id"
          :class="index ? 'mt-5' : ''"
        >
          <div class="mb-3 flex items-center gap-2 font-semibold">
            <span>{{ slip.year }} 年 {{ slip.month }} 月工资条</span>
            <Tag v-if="slip.readStatus === 0" color="error">新工资条</Tag>
          </div>
          <SalarySlipGrid :slip="slip" />
        </Card>
      </template>
      <Card v-else><Empty description="暂无工资条" /></Card>
    </Spin>
  </Page>
</template>
