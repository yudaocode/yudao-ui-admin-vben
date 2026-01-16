<script lang="ts" setup>
import type { PageParam } from '@vben/request';

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IotDeviceApi } from '#/api/iot/device/device';
import type { IotProductApi } from '#/api/iot/product/product';

import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { DeviceTypeEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDevicePage } from '#/api/iot/device/device';
import { getSimpleProductList } from '#/api/iot/product/product';

interface Props {
  deviceId: number;
}

const props = defineProps<Props>();
const router = useRouter();

const products = ref<IotProductApi.Product[]>([]); // 产品列表

function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
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
      field: 'productId',
      title: '所属产品',
      minWidth: 120,
      slots: { default: 'product' },
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
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 搜索表单 schema */
function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'deviceName',
      label: 'DeviceName',
      component: 'Input',
      componentProps: {
        placeholder: '请输入 DeviceName',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '设备状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_DEVICE_STATE, 'number'),
        placeholder: '请选择设备状态',
        allowClear: true,
      },
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<IotDeviceApi.Device>({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    proxyConfig: {
      ajax: {
        query: async (
          {
            page,
          }: {
            page: { currentPage: number; pageSize: number };
          },
          formValues?: { deviceName?: string; status?: number },
        ) => {
          if (!props.deviceId) {
            return { list: [], total: 0 };
          }
          return await getDevicePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            gatewayId: props.deviceId,
            deviceType: DeviceTypeEnum.GATEWAY_SUB,
            deviceName: formValues?.deviceName || undefined,
            status: formValues?.status,
          } as PageParam);
        },
      },
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
    pagerConfig: {
      enabled: true,
    },
  },
});

/** 获取产品名称 */
function getProductName(productId: number) {
  const product = products.value.find((p) => p.id === productId);
  return product?.name || '-';
}

/** 查看详情 */
function openDetail(id: number) {
  router.push({ name: 'IoTDeviceDetail', params: { id } });
}

/** 监听设备ID变化 */
watch(
  () => props.deviceId,
  (newValue) => {
    if (newValue) {
      gridApi.query();
    }
  },
);

/** 初始化 */
onMounted(async () => {
  // 获取产品列表
  products.value = await getSimpleProductList();

  // 如果设备ID存在，则查询列表
  if (props.deviceId) {
    gridApi.query();
  }
});
</script>

<template>
  <Page auto-content-height>
    <!-- 子设备列表 -->
    <Grid>
      <template #product="{ row }">
        {{ getProductName(row.productId) }}
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '查看详情',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              onClick: openDetail.bind(null, row.id!),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
