<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallBrokerageWithdrawApi } from '#/api/mall/trade/brokerage/withdraw';

import { h } from 'vue';

import { confirm, Page, prompt } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { ElInput, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  approveBrokerageWithdraw,
  getBrokerageWithdrawPage,
  rejectBrokerageWithdraw,
} from '#/api/mall/trade/brokerage/withdraw';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import {
  BrokerageWithdrawStatusEnum,
  BrokerageWithdrawTypeEnum,
  DICT_TYPE,
} from '#/utils';

import { useGridColumns, useGridFormSchema } from './data';

/** 分销佣金提现 */
defineOptions({ name: 'BrokerageWithdraw' });

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 审核通过 */
async function handleApprove(row: MallBrokerageWithdrawApi.BrokerageWithdraw) {
  await confirm('确定要审核通过吗？');
  await approveBrokerageWithdraw(row.id);
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  onRefresh();
}

/** 审核驳回 */
function handleReject(row: MallBrokerageWithdrawApi.BrokerageWithdraw) {
  prompt({
    component: () => {
      return h(ElInput, {
        placeholder: '请输入驳回原因',
        allowClear: true,
        rules: [{ required: true, message: '请输入驳回原因' }],
      });
    },
    content: '请输入驳回原因',
    title: '驳回',
    modelPropName: 'value',
  }).then(async (val) => {
    if (val) {
      await rejectBrokerageWithdraw({
        id: row.id as number,
        auditReason: val,
      });
      onRefresh();
    }
  });
}

/** 重新转账 */
async function handleRetryTransfer(
  row: MallBrokerageWithdrawApi.BrokerageWithdraw,
) {
  await confirm('确定要重新转账吗？');
  await approveBrokerageWithdraw(row.id);
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  onRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    cellConfig: {
      height: 80,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getBrokerageWithdrawPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<MallBrokerageWithdrawApi.BrokerageWithdraw>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="佣金提现列表">
      <template #withdraw-info="{ row }">
        <div v-if="row.type === BrokerageWithdrawTypeEnum.WALLET.type">-</div>
        <div v-else>
          <div v-if="row.userAccount">账号：{{ row.userAccount }}</div>
          <div v-if="row.userName">真实姓名：{{ row.userName }}</div>
          <template v-if="row.type === BrokerageWithdrawTypeEnum.BANK.type">
            <div v-if="row.bankName">银行名称：{{ row.bankName }}</div>
            <div v-if="row.bankAddress">开户地址：{{ row.bankAddress }}</div>
          </template>
          <div v-if="row.qrCodeUrl" class="mt-2">
            <div>收款码：</div>
            <img :src="row.qrCodeUrl" class="mt-1 h-10 w-10" />
          </div>
        </div>
      </template>

      <template #status-info="{ row }">
        <div>
          <DictTag
            :value="row.status"
            :type="DICT_TYPE.BROKERAGE_WITHDRAW_STATUS"
          />
          <div v-if="row.auditTime" class="mt-1 text-xs text-gray-500">
            时间：{{ formatDateTime(row.auditTime) }}
          </div>
          <div v-if="row.auditReason" class="mt-1 text-xs text-gray-500">
            审核原因：{{ row.auditReason }}
          </div>
          <div v-if="row.transferErrorMsg" class="mt-1 text-xs text-red-500">
            转账失败原因：{{ row.transferErrorMsg }}
          </div>
        </div>
      </template>

      <template #actions="{ row }">
        <TableAction
          :actions="[
            // 审核中状态且没有支付转账编号，显示通过和驳回按钮
            {
              label: '通过',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['trade:brokerage-withdraw:audit'],
              ifShow:
                row.status === BrokerageWithdrawStatusEnum.AUDITING.status &&
                !row.payTransferId,
              onClick: () => handleApprove(row),
            },
            {
              label: '驳回',
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['trade:brokerage-withdraw:audit'],
              ifShow:
                row.status === BrokerageWithdrawStatusEnum.AUDITING.status &&
                !row.payTransferId,
              onClick: () => handleReject(row),
            },
            {
              label: '重新转账',
              link: true,
              icon: ACTION_ICON.REFRESH,
              auth: ['trade:brokerage-withdraw:audit'],
              ifShow:
                row.status === BrokerageWithdrawStatusEnum.WITHDRAW_FAIL.status,
              onClick: () => handleRetryTransfer(row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
