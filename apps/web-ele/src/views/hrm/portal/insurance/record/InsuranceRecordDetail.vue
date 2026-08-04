<script lang="ts" setup>
import type { HrmPortalInsuranceRecordApi } from '#/api/hrm/portal/insurance/record';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { getInsuranceRecord } from '#/api/hrm/portal/insurance/record';
import { DictTag } from '#/components/dict-tag';
import { HrmInsuranceSchemeType } from '#/views/hrm/utils/constants';
import { formatHrmMoney, formatHrmRate } from '#/views/hrm/utils/format';

defineOptions({ name: 'HrmPortalInsuranceRecordDetail' });

const loading = ref(false);
const record = ref<HrmPortalInsuranceRecordApi.PortalInsuranceRecord>();

const personalTotal = computed(
  () =>
    (record.value?.personalInsuranceAmount || 0) +
    (record.value?.personalProvidentFundAmount || 0),
);
const corporateTotal = computed(
  () =>
    (record.value?.corporateInsuranceAmount || 0) +
    (record.value?.corporateProvidentFundAmount || 0),
);

const showProportionColumns = computed(
  () => record.value?.schemeType === HrmInsuranceSchemeType.PROPORTION,
);

function getSummary({
  columns,
  data,
}: {
  columns: { property?: string }[];
  data: HrmPortalInsuranceRecordApi.Project[];
}) {
  return columns.map((column, index) => {
    if (index === 0) {
      return '合计';
    }
    if (column.property === 'personalAmount') {
      return `¥ ${formatHrmMoney(
        data.reduce((sum, item) => sum + Number(item.personalAmount || 0), 0),
      )}`;
    }
    if (column.property === 'corporateAmount') {
      return `¥ ${formatHrmMoney(
        data.reduce((sum, item) => sum + Number(item.corporateAmount || 0), 0),
      )}`;
    }
    if (column.property === 'totalAmount') {
      return `¥ ${formatHrmMoney(
        data.reduce(
          (sum, item) =>
            sum +
            Number(item.personalAmount || 0) +
            Number(item.corporateAmount || 0),
          0,
        ),
      )}`;
    }
    return '';
  });
}

const [Modal, modalApi] = useVbenModal({
  footer: false,
  onOpenChange(isOpen) {
    if (!isOpen) {
      record.value = undefined;
    }
  },
});

/** 打开社保记录详情 */
async function open(
  summary: HrmPortalInsuranceRecordApi.PortalInsuranceRecord,
) {
  record.value = { ...summary, projects: [] };
  modalApi.setState({ title: `${summary.month || ''} 月社保表` });
  modalApi.open();
  loading.value = true;
  try {
    record.value = await getInsuranceRecord(summary.id);
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Modal class="w-[1060px]">
    <div v-loading="loading">
      <ElDescriptions border class="mb-4" :column="2" size="small">
        <ElDescriptionsItem label="参保方案">
          {{ record?.schemeName || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="方案类型">
          <DictTag
            v-if="record?.schemeType"
            type="hrm_insurance_scheme_type"
            :value="record.schemeType"
          />
          <span v-else>-</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="个人缴纳">
          ¥ {{ formatHrmMoney(personalTotal) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="公司缴纳">
          ¥ {{ formatHrmMoney(corporateTotal) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="本月合计" :span="2">
          <b class="text-primary text-base">
            ¥ {{ formatHrmMoney(personalTotal + corporateTotal) }}
          </b>
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElTable
        border
        :data="record?.projects || []"
        row-key="schemeProjectId"
        show-summary
        size="small"
        :summary-method="getSummary"
      >
        <ElTableColumn label="缴纳项目" min-width="150" prop="name" />
        <ElTableColumn
          align="right"
          label="缴纳基数"
          prop="baseAmount"
          width="130"
        >
          <template #default="{ row }">
            ¥ {{ formatHrmMoney(row.baseAmount) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-if="showProportionColumns"
          align="right"
          label="个人比例"
          prop="personalRate"
          width="110"
        >
          <template #default="{ row }">
            {{ formatHrmRate(row.personalRate) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          align="right"
          label="个人金额"
          prop="personalAmount"
          width="130"
        >
          <template #default="{ row }">
            ¥ {{ formatHrmMoney(row.personalAmount) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-if="showProportionColumns"
          align="right"
          label="公司比例"
          prop="corporateRate"
          width="110"
        >
          <template #default="{ row }">
            {{ formatHrmRate(row.corporateRate) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          align="right"
          label="公司金额"
          prop="corporateAmount"
          width="130"
        >
          <template #default="{ row }">
            ¥ {{ formatHrmMoney(row.corporateAmount) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          align="right"
          label="合计"
          prop="totalAmount"
          width="130"
        >
          <template #default="{ row }">
            ¥
            {{
              formatHrmMoney(
                (row.personalAmount || 0) + (row.corporateAmount || 0),
              )
            }}
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </Modal>
</template>
