<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AlertRecordApi } from '#/api/iot/alert/record';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElLoading,
  ElMessage,
  ElMessageBox,
  ElPopover,
} from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAlertRecordPage, processAlertRecord } from '#/api/iot/alert/record';

import { useGridColumns, useGridFormSchema } from './data';

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
  try {
    const { value: processRemark } = await ElMessageBox.prompt(
      '请输入处理原因：',
      '处理告警记录',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入处理原因',
      },
    );
    const loadingInstance = ElLoading.service({ text: '正在处理...' });
    try {
      await processAlertRecord(row.id!, processRemark);
      ElMessage.success('处理成功');
      handleRefresh();
    } finally {
      loadingInstance.close();
    }
  } catch {
    // 用户取消
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
        <ElPopover
          v-if="row.deviceMessage"
          placement="top-start"
          trigger="hover"
          :popper-style="{ maxWidth: '600px' }"
        >
          <template #reference>
            <ElButton size="small" type="primary" link>
              <IconifyIcon icon="ant-design:eye-outlined" class="mr-1" />
              查看消息
            </ElButton>
          </template>
          <pre class="text-xs">{{
            stringifyDeviceMessage(row.deviceMessage)
          }}</pre>
        </ElPopover>
        <span v-else class="text-gray-400">-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '处理',
              type: 'primary',
              link: true,
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
