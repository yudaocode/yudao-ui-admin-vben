<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemMailLogApi } from '#/api/system/mail/log';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMailLogPage } from '#/api/system/mail/log';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 查看邮件日志 */
function handleDetail(row: SystemMailLogApi.MailLog) {
  detailModalApi.setData(row).open();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMailLogPage({
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
  } as VxeTableGridOptions<SystemMailLogApi.MailLog>,
});
</script>
<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="邮件配置" url="https://doc.iocoder.cn/mail" />
    </template>

    <DetailModal @success="onRefresh" />
    <Grid table-title="邮件日志列表">
      <template #userInfo="{ row }">
        <div v-if="row.userType && row.userId" class="flex items-center gap-1">
          <DictTag :type="DICT_TYPE.USER_TYPE" :value="row.userType" />
          <span>({{ row.userId }})</span>
        </div>
        <div v-else>-</div>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['system:mail-log:query'],
              onClick: handleDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
