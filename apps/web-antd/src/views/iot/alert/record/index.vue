<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Modal, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import type { AlertRecord } from '#/api/iot/alert/record';
import { getAlertRecordPage, processAlertRecord } from '#/api/iot/alert/record';
import { getSimpleDeviceList } from '#/api/iot/device/device';
import { getSimpleProductList } from '#/api/iot/product/product';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'IoTAlertRecord' });

const productList = ref<any[]>([]);
const deviceList = ref<any[]>([]);

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

// 加载产品和设备列表
const loadData = async () => {
  productList.value = await getSimpleProductList();
  deviceList.value = await getSimpleDeviceList();
};

// 获取告警级别文本
const getLevelText = (level?: number) => {
  const levelMap: Record<number, string> = {
    1: '提示',
    2: '一般',
    3: '警告',
    4: '严重',
    5: '紧急',
  };
  return level ? levelMap[level] || `级别${level}` : '-';
};

// 获取告警级别颜色
const getLevelColor = (level?: number) => {
  const colorMap: Record<number, string> = {
    1: 'blue',
    2: 'green',
    3: 'orange',
    4: 'red',
    5: 'purple',
  };
  return level ? colorMap[level] || 'default' : 'default';
};

// 获取产品名称
const getProductName = (productId?: number) => {
  if (!productId) return '-';
  const product = productList.value.find((p: any) => p.id === productId);
  return product?.name || '加载中...';
};

// 获取设备名称
const getDeviceName = (deviceId?: number) => {
  if (!deviceId) return '-';
  const device = deviceList.value.find((d: any) => d.id === deviceId);
  return device?.deviceName || '加载中...';
};

// 处理告警记录
const handleProcess = async (row: AlertRecord) => {
  Modal.confirm({
    title: '处理告警记录',
    content: h('div', [
      h('p', '请输入处理原因：'),
      h('textarea', {
        id: 'processRemark',
        class: 'ant-input',
        rows: 3,
        placeholder: '请输入处理原因',
      }),
    ]),
    async onOk() {
      const textarea = document.getElementById('processRemark') as HTMLTextAreaElement;
      const processRemark = textarea?.value || '';
      
      if (!processRemark) {
        message.warning('请输入处理原因');
        return Promise.reject();
      }
      
      const hideLoading = message.loading({
        content: '正在处理...',
        duration: 0,
      });
      try {
        await processAlertRecord(row.id as number, processRemark);
        message.success('处理成功');
        onRefresh();
      } catch (error) {
        console.error('处理失败:', error);
        return Promise.reject();
      } finally {
        hideLoading();
      }
    },
  });
};

// 查看告警记录详情
const handleView = (row: AlertRecord) => {
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
        h('span', getLevelText(row.configLevel)),
      ]),
      h('div', [
        h('span', { class: 'font-semibold' }, '设备消息：'),
        h('pre', { class: 'mt-1 text-xs bg-gray-50 p-2 rounded' }, row.deviceMessage || '-'),
      ]),
      h('div', [
        h('span', { class: 'font-semibold' }, '处理结果：'),
        h('span', row.processRemark || '-'),
      ]),
      h('div', [
        h('span', { class: 'font-semibold' }, '处理时间：'),
        h('span', row.processTime ? new Date(row.processTime).toLocaleString('zh-CN') : '-'),
      ]),
    ]),
  });
};

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
  } as VxeTableGridOptions<AlertRecord>,
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="告警记录列表">
      <!-- 告警级别列 -->
      <template #configLevel="{ row }">
        <a-tag :color="getLevelColor(row.configLevel)">
          {{ getLevelText(row.configLevel) }}
        </a-tag>
      </template>

      <!-- 产品名称列 -->
      <template #product="{ row }">
        <span>{{ getProductName(row.productId) }}</span>
      </template>

      <!-- 设备名称列 -->
      <template #device="{ row }">
        <span>{{ getDeviceName(row.deviceId) }}</span>
      </template>

      <!-- 设备消息列 -->
      <template #deviceMessage="{ row }">
        <a-popover
          v-if="row.deviceMessage"
          placement="topLeft"
          trigger="hover"
          :overlayStyle="{ maxWidth: '600px' }"
        >
          <template #content>
            <pre class="text-xs">{{ row.deviceMessage }}</pre>
          </template>
          <VbenButton size="small" type="link">
            <Icon icon="ant-design:eye-outlined" class="mr-1" />
            查看消息
          </VbenButton>
        </a-popover>
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
              onClick: handleProcess.bind(null, row),
              ifShow: !row.processStatus,
            },
            {
              label: '查看',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              onClick: handleView.bind(null, row),
              ifShow: row.processStatus,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
