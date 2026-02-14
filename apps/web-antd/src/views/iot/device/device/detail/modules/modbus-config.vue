<!-- Modbus 配置 -->
<script lang="ts" setup>
import type { VbenFormSchema, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IotDeviceApi } from '#/api/iot/device/device';
import type { IotDeviceModbusConfigApi } from '#/api/iot/device/modbus/config';
import type { IotDeviceModbusPointApi } from '#/api/iot/device/modbus/point';
import type { IotProductApi } from '#/api/iot/product/product';
import type { ThingModelData } from '#/api/iot/thingmodel';
import type { DescriptionItemSchema } from '#/components/description';

import { computed, h, onMounted, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getModbusConfig } from '#/api/iot/device/modbus/config';
import {
  deleteModbusPoint,
  getModbusPointPage,
} from '#/api/iot/device/modbus/point';
import { ProtocolTypeEnum } from '#/api/iot/product/product';
import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';
import { ModbusFunctionCodeOptions } from '#/views/iot/utils/constants';

import DeviceModbusConfigForm from './modbus-config-form.vue';
import DeviceModbusPointForm from './modbus-point-form.vue';

defineOptions({ name: 'DeviceModbusConfig' });

const props = defineProps<{
  device: IotDeviceApi.Device;
  product: IotProductApi.Product;
  thingModelList: ThingModelData[];
}>();

// ======================= 连接配置 =======================

const isClient = computed(
  () => props.product.protocolType === ProtocolTypeEnum.MODBUS_TCP_CLIENT,
); // 是否为 Client 模式
const isServer = computed(
  () => props.product.protocolType === ProtocolTypeEnum.MODBUS_TCP_SERVER,
); // 是否为 Server 模式
const modbusConfig = ref<IotDeviceModbusConfigApi.ModbusConfig>(
  {} as IotDeviceModbusConfigApi.ModbusConfig,
); // 连接配置

/** 连接配置 Description Schema */
function useConfigDescriptionSchema(): DescriptionItemSchema[] {
  return [
    // Client 模式专有字段
    {
      field: 'ip',
      label: 'IP 地址',
      show: () => isClient.value,
    },
    {
      field: 'port',
      label: '端口',
      show: () => isClient.value,
    },
    // 公共字段
    {
      field: 'slaveId',
      label: '从站地址',
    },
    // Client 模式专有字段
    {
      field: 'timeout',
      label: '连接超时',
      show: () => isClient.value,
      render: (val) => (val ? `${val} ms` : '-'),
    },
    {
      field: 'retryInterval',
      label: '重试间隔',
      show: () => isClient.value,
      render: (val) => (val ? `${val} ms` : '-'),
    },
    // Server 模式专有字段
    {
      field: 'mode',
      label: '工作模式',
      show: () => isServer.value,
      render: (val) =>
        h(DictTag, { type: DICT_TYPE.IOT_MODBUS_MODE, value: val }),
    },
    {
      field: 'frameFormat',
      label: '帧格式',
      show: () => isServer.value,
      render: (val) =>
        h(DictTag, { type: DICT_TYPE.IOT_MODBUS_FRAME_FORMAT, value: val }),
    },
    // 公共字段
    {
      field: 'status',
      label: '状态',
      render: (val) =>
        h(DictTag, { type: DICT_TYPE.COMMON_STATUS, value: val }),
    },
  ];
}

const [ConfigDescriptions] = useDescription({
  title: '连接配置',
  column: 3,
  bordered: true,
  schema: useConfigDescriptionSchema(),
});

/** 获取连接配置 */
async function loadModbusConfig() {
  modbusConfig.value = await getModbusConfig(props.device.id!);
}

/** 编辑连接配置 - 使用 useVbenModal */
const [ConfigFormModal, configFormModalApi] = useVbenModal({
  connectedComponent: DeviceModbusConfigForm,
  destroyOnClose: true,
});

/** 打开编辑连接配置弹窗 */
function handleEditConfig() {
  configFormModalApi
    .setData({
      config: modbusConfig.value,
      deviceId: props.device.id!,
      protocolType: props.product.protocolType!,
    })
    .open();
}

// ======================= 点位配置 =======================

/** 格式化功能码 */
function formatFunctionCode(code: number) {
  const option = ModbusFunctionCodeOptions.find((item) => item.value === code);
  return option ? option.label : `${code}`;
}

/** 格式化寄存器地址为十六进制 */
function formatRegisterAddress(address: number) {
  return `0x${address.toString(16).toUpperCase().padStart(4, '0')}`;
}

/** 点位搜索表单 Schema */
function usePointFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '属性名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入属性名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'identifier',
      label: '标识符',
      component: 'Input',
      componentProps: {
        placeholder: '请输入标识符',
        allowClear: true,
      },
    },
  ];
}

/** 点位列表列配置 */
function usePointColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'name', title: '属性名称', minWidth: 100 },
    {
      field: 'identifier',
      title: '标识符',
      minWidth: 100,
      cellRender: { name: 'CellTag', props: { color: 'blue' } },
    },
    {
      field: 'functionCode',
      title: '功能码',
      minWidth: 140,
      formatter: ({ cellValue }) => formatFunctionCode(cellValue),
    },
    {
      field: 'registerAddress',
      title: '寄存器地址',
      minWidth: 100,
      formatter: ({ cellValue }) => formatRegisterAddress(cellValue),
    },
    { field: 'registerCount', title: '寄存器数量', minWidth: 90 },
    {
      field: 'rawDataType',
      title: '数据类型',
      minWidth: 90,
      cellRender: { name: 'CellTag' },
    },
    { field: 'byteOrder', title: '字节序', minWidth: 80 },
    { field: 'scale', title: '缩放因子', minWidth: 80 },
    {
      field: 'pollInterval',
      title: '轮询间隔',
      minWidth: 90,
      formatter: ({ cellValue }) => `${cellValue} ms`,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<IotDeviceModbusPointApi.ModbusPoint>({
  formOptions: {
    schema: usePointFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: usePointColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getModbusPointPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            deviceId: props.device.id,
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
});

/** 新增点位 - 使用 useVbenModal */
const [PointFormModal, pointFormModalApi] = useVbenModal({
  connectedComponent: DeviceModbusPointForm,
  destroyOnClose: true,
});

/** 打开新增点位弹窗 */
function handleAddPoint() {
  pointFormModalApi
    .setData({
      deviceId: props.device.id!,
      thingModelList: props.thingModelList,
    })
    .open();
}

/** 编辑点位 */
function handleEditPoint(row: IotDeviceModbusPointApi.ModbusPoint) {
  pointFormModalApi
    .setData({
      id: row.id,
      deviceId: props.device.id!,
      thingModelList: props.thingModelList,
    })
    .open();
}

/** 删除点位 */
async function handleDeletePoint(row: IotDeviceModbusPointApi.ModbusPoint) {
  await confirm({ content: `确定要删除点位【${row.name}】吗？` });
  await deleteModbusPoint(row.id!);
  message.success('删除成功');
  await gridApi.query();
}

/** 刷新点位列表 */
function handlePointSuccess() {
  gridApi.query();
}

/** 初始化 */
onMounted(async () => {
  await loadModbusConfig();
});
</script>

<template>
  <div>
    <!-- 连接配置区域 -->
    <ConfigDescriptions :data="modbusConfig" class="mb-4">
      <template #extra>
        <Button type="primary" @click="handleEditConfig">编辑</Button>
      </template>
    </ConfigDescriptions>

    <!-- 点位配置区域 -->
    <Grid table-title="点位配置" class="h-[600px] overflow-auto">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增点位',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: handleAddPoint,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'link',
              onClick: () => handleEditPoint(row),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              popConfirm: {
                title: `确定要删除点位【${row.name}】吗？`,
                confirm: () => handleDeletePoint(row),
              },
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 连接配置弹窗 -->
    <ConfigFormModal @success="loadModbusConfig" />

    <!-- 点位表单弹窗 -->
    <PointFormModal @success="handlePointSuccess" />
  </div>
</template>
