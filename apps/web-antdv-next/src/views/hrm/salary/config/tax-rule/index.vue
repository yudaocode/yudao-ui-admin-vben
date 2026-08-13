<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryTaxRuleApi } from '#/api/hrm/salary/config/tax-rule';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { message, Tag } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSalaryTaxRule,
  getSalaryTaxRuleList,
} from '#/api/hrm/salary/config/tax-rule';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import { HrmSalaryTaxCycleTypeOptions } from '#/views/hrm/utils/constants';
import { formatHrmYesNo } from '#/views/hrm/utils/format';

import Form from './modules/form.vue';

defineOptions({ name: 'HrmSalaryTaxRule' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function handleRefresh() {
  gridApi.query();
}

function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

function handleEdit(row: HrmSalaryTaxRuleApi.SalaryTaxRule) {
  formModalApi.setData({ type: 'update', id: row.id }).open();
}

async function handleDelete(row: HrmSalaryTaxRuleApi.SalaryTaxRule) {
  await confirm(`确认删除计税规则"${row.name}"吗？`);
  await deleteSalaryTaxRule(row.id!);
  message.success($t('ui.actionMessage.operationSuccess'));
  handleRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'name', title: '方案名称', minWidth: 180 },
      {
        field: 'type',
        title: '个税类型',
        width: 140,
        slots: { default: 'type' },
      },
      {
        field: 'cycleType',
        title: '计税周期',
        minWidth: 360,
        slots: { default: 'cycleType' },
      },
      {
        field: 'taxEnabled',
        title: '是否计税',
        width: 100,
        slots: { default: 'taxEnabled' },
      },
      {
        field: 'threshold',
        title: '起征点',
        width: 120,
        formatter: ({ cellValue }) =>
          cellValue === null ? '-' : `${cellValue}元/月`,
      },
      {
        field: 'decimalScale',
        title: '个税结果保留小数位',
        width: 170,
        formatter: ({ cellValue }) =>
          cellValue === null ? '-' : `保留${cellValue}位小数`,
      },
      {
        field: 'usedGroupCount',
        title: '适用薪资组',
        minWidth: 170,
        formatter: ({ cellValue }) => `${cellValue ?? 0}个薪资组正在使用`,
      },
      {
        title: '操作',
        width: 140,
        fixed: 'right',
        slots: { default: 'actions' },
      },
    ],
    height: 'auto',
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          const list = await getSalaryTaxRuleList();
          return { list, total: list.length };
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<HrmSalaryTaxRuleApi.SalaryTaxRule>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【薪资】计薪设置、薪资档案"
        url="https://doc.iocoder.cn/hrm/salary/config/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增计税规则',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['hrm:salary:tax-rule:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #type="{ row }">
        <DictTag :type="DICT_TYPE.HRM_SALARY_TAX_TYPE" :value="row.type" />
      </template>
      <template #cycleType="{ row }">
        {{
          HrmSalaryTaxCycleTypeOptions.find(
            (item) => item.value === row.cycleType,
          )?.label || '-'
        }}
      </template>
      <template #taxEnabled="{ row }">
        <template v-if="row.taxEnabled == null">-</template>
        <Tag v-else :color="row.taxEnabled ? 'success' : 'default'">
          {{ formatHrmYesNo(row.taxEnabled) }}
        </Tag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              auth: ['hrm:salary:tax-rule:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              auth: ['hrm:salary:tax-rule:delete'],
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
