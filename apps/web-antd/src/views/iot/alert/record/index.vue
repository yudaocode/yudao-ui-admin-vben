<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AlertRecordApi } from '#/api/iot/alert/record';

import { h, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { Button, Input, message, Modal, Popover } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAlertRecordPage, processAlertRecord } from '#/api/iot/alert/record';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'IoTAlertRecord' });

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 处理告警记录 */
function handleProcess(row: AlertRecordApi.AlertRecord) {
  const processRemark = ref('');
  Modal.confirm({
    title: '处理告警记录',
    content: () =>
      h('div', { class: 'space-y-2' }, [
        h('p', '请输入处理原因：'),
        h(Input.TextArea, {
          'value': processRemark.value,
          'onUpdate:value': (val: string) => (processRemark.value = val),
          'rows': 3,
          'placeholder': '请输入处理原因',
        }),
      ]),
    async onOk() {
      if (!processRemark.value) {
        message.warning('请输入处理原因');
        throw new Error('请输入处理原因');
      }
      const hideLoading = message.loading({
        content: '正在处理...',
        duration: 0,
      });
      try {
        await processAlertRecord(row.id as number, processRemark.value);
        message.success('处理成功');
        handleRefresh();
      } finally {
        hideLoading();
      }
    },
  });
}

/** 查看告警记录详情 */
// TODO @AI：去掉 view 详情，对齐 vue3 + ep模块；
function handleView(row: AlertRecordApi.AlertRecord) {
  const deviceMessageText =
    row.deviceMessage && typeof row.deviceMessage === 'object'
      ? JSON.stringify(row.deviceMessage, null, 2)
      : row.deviceMessage || '-';
  Modal.info({
    title: '告警记录详情',
    width: 600,
    content: h('div', { class: 'space-y-2' }, [
      h('div', [
        h('span', { class: 'font-semibold' }, '告警名称：'),
        h('span', row.configName || '-'),
      ]),
      h('div', [
        h('span', { class: 'font-semibold' }, '告警级别：'),
        h(
          'span',
          getDictLabel(DICT_TYPE.IOT_ALERT_LEVEL, row.configLevel) || '-',
        ),
      ]),
      h('div', [
        h('span', { class: 'font-semibold' }, '设备消息：'),
        h(
          'pre',
          { class: 'mt-1 text-xs bg-gray-50 p-2 rounded' },
          deviceMessageText,
        ),
      ]),
      h('div', [
        h('span', { class: 'font-semibold' }, '处理结果：'),
        h('span', row.processRemark || '-'),
      ]),
      h('div', [
        h('span', { class: 'font-semibold' }, '处理时间：'),
        h(
          'span',
          row.processTime
            ? new Date(row.processTime).toLocaleString('zh-CN')
            : '-',
        ),
      ]),
    ]),
  });
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

/** 把设备消息序列化成可读字符串 */
function stringifyDeviceMessage(deviceMessage: any) {
  if (!deviceMessage) {
    return '';
  }
  return typeof deviceMessage === 'object'
    ? JSON.stringify(deviceMessage, null, 2)
    : String(deviceMessage);
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="告警记录列表">
      <!-- TODO DONE @AI：告警级别已改用 CellDict 在 data.ts 渲染 -->
      <!-- TODO DONE @AI：设备消息是 Popover hover 看 JSON 详情，CellDict 只渲染单值文本，保留 slot -->
      <template #deviceMessage="{ row }">
        <Popover
          v-if="row.deviceMessage"
          placement="topLeft"
          trigger="hover"
          :overlay-style="{ maxWidth: '600px' }"
        >
          <template #content>
            <pre class="text-xs">{{ stringifyDeviceMessage(row.deviceMessage) }}</pre>
          </template>
          <Button size="small" type="link">
            <IconifyIcon icon="ant-design:eye-outlined" class="mr-1" />
            查看消息
          </Button>
        </Popover>
        <span v-else class="text-gray-400">-</span>
      </template>
      <!-- 操作列 -->
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
            {
              label: '查看',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['iot:alert-record:query'],
              onClick: handleView.bind(null, row),
              ifShow: row.processStatus,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
