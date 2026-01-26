<script lang="ts" setup>
import type { VbenFormSchema, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IotDeviceApi } from '#/api/iot/device/device';

import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { DeviceTypeEnum, DICT_TYPE } from '@vben/constants';
import { formatDateTime, isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  bindDeviceGateway,
  getSubDeviceList,
  getUnboundSubDevicePage,
  unbindDeviceGateway,
} from '#/api/iot/device/device';
import { getSimpleProductList } from '#/api/iot/product/product';

interface Props {
  deviceId: number;
}

const props = defineProps<Props>();
const router = useRouter();

/** 子设备列表表格列配置 */
function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'deviceName',
      title: 'DeviceName',
      minWidth: 150,
    },
    {
      field: 'nickname',
      title: '备注名称',
      minWidth: 120,
    },
    {
      field: 'productName',
      title: '产品名称',
      minWidth: 120,
    },
    {
      field: 'state',
      title: '设备状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IOT_DEVICE_STATE },
      },
    },
    {
      field: 'onlineTime',
      title: '最后上线时间',
      minWidth: 160,
      formatter: ({ cellValue }) => formatDateTime(cellValue),
    },
    {
      field: 'actions',
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<IotDeviceApi.Device>({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!props.deviceId) {
            return [];
          }
          return await getSubDeviceList(props.deviceId);
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
    },
    pagerConfig: {
      enabled: false,
    },
  },
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

/** 获取子设备列表 */
function getList() {
  gridApi.query();
}

/** 打开设备详情 */
function openDeviceDetail(id: number) {
  router.push({ name: 'IoTDeviceDetail', params: { id } });
}

/** 多选框选中数据 */
const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: IotDeviceApi.Device[];
}) {
  checkedIds.value = records.map((item) => item.id!);
}

/** 解绑单个设备 */
async function handleUnbind(row: IotDeviceApi.Device) {
  await confirm({ content: `确定要解绑子设备【${row.deviceName}】吗？` });
  const hideLoading = message.loading({
    content: `正在解绑【${row.deviceName}】...`,
    duration: 0,
  });
  try {
    await unbindDeviceGateway(props.deviceId, [row.id!]);
    message.success('解绑成功');
    getList();
  } finally {
    hideLoading();
  }
}

/** 批量解绑 */
async function handleUnbindBatch() {
  await confirm({
    content: `确定要解绑选中的 ${checkedIds.value.length} 个子设备吗？`,
  });
  const hideLoading = message.loading({
    content: '正在批量解绑...',
    duration: 0,
  });
  try {
    await unbindDeviceGateway(props.deviceId, checkedIds.value);
    checkedIds.value = [];
    message.success('批量解绑成功');
    getList();
  } finally {
    hideLoading();
  }
}

// ===================== 添加子设备弹窗 =====================

const addSelectedRowKeys = ref<number[]>([]);

/** 添加弹窗搜索表单 schema */
function useAddGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'productId',
      label: '产品',
      component: 'ApiSelect',
      componentProps: {
        api: () => getSimpleProductList(DeviceTypeEnum.GATEWAY_SUB),
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择产品',
        allowClear: true,
      },
    },
    {
      fieldName: 'deviceName',
      label: 'DeviceName',
      component: 'Input',
      componentProps: {
        placeholder: '请输入 DeviceName',
        allowClear: true,
      },
    },
  ];
}

function useAddGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'deviceName',
      title: 'DeviceName',
      minWidth: 150,
    },
    {
      field: 'nickname',
      title: '备注名称',
      minWidth: 120,
    },
    {
      field: 'productName',
      title: '产品名称',
      minWidth: 120,
    },
    {
      field: 'state',
      title: '设备状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IOT_DEVICE_STATE },
      },
    },
  ];
}

const [AddGrid, addGridApi] = useVbenVxeGrid<IotDeviceApi.Device>({
  formOptions: {
    schema: useAddGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useAddGridColumns(),
    height: 400,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getUnboundSubDevicePage({
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
  },
  gridEvents: {
    checkboxAll: handleAddSelectionChange,
    checkboxChange: handleAddSelectionChange,
  },
});

/** 处理添加弹窗表格选择变化 */
function handleAddSelectionChange() {
  const records = addGridApi.grid?.getCheckboxRecords() || [];
  addSelectedRowKeys.value = records.map(
    (record: IotDeviceApi.Device) => record.id!,
  );
}

const [AddModal, addModalApi] = useVbenModal({
  async onConfirm() {
    if (addSelectedRowKeys.value.length === 0) {
      message.warning('请先选择要添加的子设备');
      return;
    }
    addModalApi.lock();
    try {
      await bindDeviceGateway(props.deviceId, addSelectedRowKeys.value);
      message.success('绑定成功');
      await addModalApi.close();
      addSelectedRowKeys.value = [];
      getList();
    } finally {
      addModalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      addSelectedRowKeys.value = [];
      await addGridApi.formApi?.resetForm();
      await addGridApi.query();
    }
  },
});

/** 打开添加子设备弹窗 */
function openAddModal() {
  addModalApi.open();
}

/** 监听 deviceId 变化 */
watch(
  () => props.deviceId,
  (newVal) => {
    if (newVal) {
      getList();
    }
  },
  { immediate: true },
);
</script>

<template>
  <Page auto-content-height>
    <!-- 子设备列表 -->
    <Grid table-title="子设备列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '添加子设备',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: openAddModal,
            },
            {
              label: '批量解绑',
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              onClick: handleUnbindBatch,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '查看',
              type: 'link',
              onClick: () => openDeviceDetail(row.id!),
            },
            {
              label: '解绑',
              type: 'link',
              danger: true,
              onClick: () => handleUnbind(row),
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 添加子设备弹窗 -->
    <AddModal title="添加子设备" class="w-3/5">
      <AddGrid />
    </AddModal>
  </Page>
</template>
