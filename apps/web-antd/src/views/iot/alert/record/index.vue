<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AlertRecordApi } from '#/api/iot/alert/record';

import { Page, prompt } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Input, message, Popover } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAlertRecordPage, processAlertRecord } from '#/api/iot/alert/record';

import { loadReferenceList, useGridColumns, useGridFormSchema } from './data';

/** 把设备消息序列化成可读字符串 */
function stringifyDeviceMessage(deviceMessage: any) {
  if (!deviceMessage) {
    return '';
  }
  return typeof deviceMessage === 'object'
    ? JSON.stringify(deviceMessage, null, 2)
    : String(deviceMessage);
}

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 处理告警记录 */
async function handleProcess(row: AlertRecordApi.AlertRecord) {
  let processRemark: string | undefined;
  try {
    processRemark = await prompt<string>({
      title: '处理告警记录',
      content: '请输入处理原因：',
      component: Input.TextArea,
      componentProps: { placeholder: '请输入处理原因', rows: 3 },
      modelPropName: 'value',
      defaultValue: '',
    });
  } catch {
    return;
  }
  const hideLoading = message.loading({ content: '正在处理...', duration: 0 });
  try {
    await processAlertRecord(row.id!, processRemark ?? '');
    message.success('处理成功');
    handleRefresh();
  } finally {
    hideLoading();
  }
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
          await loadReferenceList();
          return await getAlertRecordPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<AlertRecordApi.AlertRecord>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="告警记录列表">
      <template #deviceMessage="{ row }">
        <Popover
          v-if="row.deviceMessage"
          placement="topLeft"
          trigger="hover"
          :overlay-style="{ maxWidth: '600px' }"
        >
          <template #content>
            <pre class="text-xs">{{
              stringifyDeviceMessage(row.deviceMessage)
            }}</pre>
          </template>
          <Button size="small" type="link">
            <IconifyIcon icon="ant-design:eye-outlined" class="mr-1" />
            查看消息
          </Button>
        </Popover>
        <span v-else class="text-gray-400">-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '处理',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['iot:alert-record:process'],
              onClick: handleProcess.bind(null, row),
              ifShow: !row.processStatus,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
