<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPortalInsuranceRecordApi } from '#/api/hrm/portal/insurance/record';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { Descriptions, DescriptionsItem } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getInsuranceRecord } from '#/api/hrm/portal/insurance/record';
import { DictTag } from '#/components/dict-tag';
import { HrmInsuranceSchemeType } from '#/views/hrm/utils/constants';
import { formatHrmMoney } from '#/views/hrm/utils/format';

import { buildProjectFooterMethod, useProjectGridColumns } from '../data';

defineOptions({ name: 'HrmPortalInsuranceRecordDetail' });

const record = ref<HrmPortalInsuranceRecordApi.PortalInsuranceRecord>();
const personalTotal = computed(
  () =>
    Number(record.value?.personalInsuranceAmount || 0) +
    Number(record.value?.personalProvidentFundAmount || 0),
);
const corporateTotal = computed(
  () =>
    Number(record.value?.corporateInsuranceAmount || 0) +
    Number(record.value?.corporateProvidentFundAmount || 0),
);

const [ProjectGrid, projectGridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useProjectGridColumns(false),
    data: [],
    minHeight: 180,
    pagerConfig: { enabled: false },
    showFooter: true,
    footerMethod: buildProjectFooterMethod(),
    rowConfig: { keyField: 'schemeProjectId', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<HrmPortalInsuranceRecordApi.SchemeProject>,
});

const [Modal, modalApi] = useVbenModal({
  footer: false,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      record.value = undefined;
      return;
    }
    const { id, month } = modalApi.getData() as { id: number; month?: number };
    modalApi.setState({ title: `${month || ''} 月社保表` });
    modalApi.lock();
    try {
      record.value = await getInsuranceRecord(id);
      projectGridApi.setGridOptions({
        columns: useProjectGridColumns(
          record.value.schemeType === HrmInsuranceSchemeType.PROPORTION,
        ),
      });
      await nextTick();
      await projectGridApi.grid.reloadData(record.value.projects || []);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-[1060px]">
    <Descriptions bordered class="mb-4" :column="2" size="small">
      <DescriptionsItem label="参保方案">
        {{ record?.schemeName || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="方案类型">
        <DictTag
          v-if="record?.schemeType"
          :type="DICT_TYPE.HRM_INSURANCE_SCHEME_TYPE"
          :value="record.schemeType"
        />
        <span v-else>-</span>
      </DescriptionsItem>
      <DescriptionsItem label="个人缴纳">
        ¥ {{ formatHrmMoney(personalTotal) }}
      </DescriptionsItem>
      <DescriptionsItem label="公司缴纳">
        ¥ {{ formatHrmMoney(corporateTotal) }}
      </DescriptionsItem>
      <DescriptionsItem label="本月合计" :span="2">
        <b class="text-primary text-base">
          ¥ {{ formatHrmMoney(personalTotal + corporateTotal) }}
        </b>
      </DescriptionsItem>
    </Descriptions>
    <ProjectGrid class="w-full" />
  </Modal>
</template>
