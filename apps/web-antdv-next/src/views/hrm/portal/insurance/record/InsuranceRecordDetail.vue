<script lang="ts" setup>
import type { HrmPortalInsuranceRecordApi } from '#/api/hrm/portal/insurance/record';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { Descriptions, DescriptionsItem, Spin, Table } from 'antdv-next';

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

const projectColumns = computed(() => {
  const columns = [
    { title: '缴纳项目', dataIndex: 'name', key: 'name', minWidth: 150 },
    {
      title: '缴纳基数',
      dataIndex: 'baseAmount',
      key: 'baseAmount',
      align: 'right' as const,
      width: 130,
    },
  ];
  if (record.value?.schemeType === HrmInsuranceSchemeType.PROPORTION) {
    columns.push(
      {
        title: '个人比例',
        dataIndex: 'personalRate',
        key: 'personalRate',
        align: 'right' as const,
        width: 110,
      },
      {
        title: '个人金额',
        dataIndex: 'personalAmount',
        key: 'personalAmount',
        align: 'right' as const,
        width: 130,
      },
      {
        title: '公司比例',
        dataIndex: 'corporateRate',
        key: 'corporateRate',
        align: 'right' as const,
        width: 110,
      },
    );
  } else {
    columns.push({
      title: '个人金额',
      dataIndex: 'personalAmount',
      key: 'personalAmount',
      align: 'right' as const,
      width: 130,
    });
  }
  columns.push(
    {
      title: '公司金额',
      dataIndex: 'corporateAmount',
      key: 'corporateAmount',
      align: 'right' as const,
      width: 130,
    },
    {
      title: '合计',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right' as const,
      width: 130,
    },
  );
  return columns;
});

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
    <Spin :spinning="loading">
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

      <Table
        bordered
        :columns="projectColumns"
        :data-source="record?.projects || []"
        :pagination="false"
        row-key="schemeProjectId"
        size="small"
      >
        <template #bodyCell="{ column, record: row }">
          <template v-if="column.key === 'baseAmount'">
            ¥ {{ formatHrmMoney(row.baseAmount) }}
          </template>
          <template v-else-if="column.key === 'personalRate'">
            {{ formatHrmRate(row.personalRate) }}
          </template>
          <template v-else-if="column.key === 'corporateRate'">
            {{ formatHrmRate(row.corporateRate) }}
          </template>
          <template v-else-if="column.key === 'personalAmount'">
            ¥ {{ formatHrmMoney(row.personalAmount) }}
          </template>
          <template v-else-if="column.key === 'corporateAmount'">
            ¥ {{ formatHrmMoney(row.corporateAmount) }}
          </template>
          <template v-else-if="column.key === 'totalAmount'">
            ¥
            {{
              formatHrmMoney(
                (row.personalAmount || 0) + (row.corporateAmount || 0),
              )
            }}
          </template>
        </template>
        <template #summary>
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell :index="0">合计</Table.Summary.Cell>
              <Table.Summary.Cell :index="1" />
              <Table.Summary.Cell
                v-if="record?.schemeType === HrmInsuranceSchemeType.PROPORTION"
                :index="2"
              />
              <Table.Summary.Cell :index="3" align="right">
                ¥
                {{
                  formatHrmMoney(
                    (record?.projects || []).reduce(
                      (sum, item) => sum + Number(item.personalAmount || 0),
                      0,
                    ),
                  )
                }}
              </Table.Summary.Cell>
              <Table.Summary.Cell
                v-if="record?.schemeType === HrmInsuranceSchemeType.PROPORTION"
                :index="4"
              />
              <Table.Summary.Cell align="right">
                ¥
                {{
                  formatHrmMoney(
                    (record?.projects || []).reduce(
                      (sum, item) => sum + Number(item.corporateAmount || 0),
                      0,
                    ),
                  )
                }}
              </Table.Summary.Cell>
              <Table.Summary.Cell align="right">
                ¥
                {{
                  formatHrmMoney(
                    (record?.projects || []).reduce(
                      (sum, item) =>
                        sum +
                        Number(item.personalAmount || 0) +
                        Number(item.corporateAmount || 0),
                      0,
                    ),
                  )
                }}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        </template>
      </Table>
    </Spin>
  </Modal>
</template>
