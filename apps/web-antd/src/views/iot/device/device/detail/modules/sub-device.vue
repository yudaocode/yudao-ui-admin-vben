<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IotDeviceApi } from '#/api/iot/device/device';
import type { IotProductApi } from '#/api/iot/product/product';

import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { DeviceTypeEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { Button, Input, Select, Space } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDevicePage } from '#/api/iot/device/device';
import { getSimpleProductList } from '#/api/iot/product/product';

interface Props {
  deviceId: number;
}

const props = defineProps<Props>();
const router = useRouter();

/** 产品列表 */
const products = ref<IotProductApi.Product[]>([]);

/** 查询参数 */
const queryParams = reactive({
  deviceName: '',
  status: undefined as number | undefined,
});

/** Grid 列定义 */
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

/** 创建 Grid 实例 */
const [Grid, gridApi] = useVbenVxeGrid<IotDeviceApi.DeviceRespVO>({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          if (!props.deviceId) {
            return { list: [], total: 0 };
          }
          return await getDevicePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            gatewayId: props.deviceId,
            deviceType: DeviceTypeEnum.GATEWAY_SUB,
            deviceName: queryParams.deviceName || undefined,
            status: queryParams.status,
          } as IotDeviceApi.DevicePageReqVO);
        },
      },
    },
    toolbarConfig: {
      refresh: true,
      search: false,
    },
    pagerConfig: {
      enabled: true,
    },
  },
});

/** 搜索操作 */
function handleQuery() {
  gridApi.query();
}

/** 重置搜索 */
function resetQuery() {
  queryParams.deviceName = '';
  queryParams.status = undefined;
  handleQuery();
}

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
      handleQuery();
    }
  },
);

/** 初始化 */
onMounted(async () => {
  // 获取产品列表
  products.value = await getSimpleProductList();

  // 如果设备ID存在，则查询列表
  if (props.deviceId) {
    handleQuery();
  }
});
</script>

<template>
  <Page auto-content-height>
    <!-- 搜索区域 -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <Input
        v-model:value="queryParams.deviceName"
        placeholder="请输入设备名称"
        style="width: 200px"
        allow-clear
        @press-enter="handleQuery"
      />
      <Select
        v-model:value="queryParams.status"
        allow-clear
        placeholder="请选择设备状态"
        style="width: 160px"
      >
        <Select.Option
          v-for="dict in getDictOptions(DICT_TYPE.IOT_DEVICE_STATE, 'number')"
          :key="dict.value"
          :value="dict.value"
        >
          {{ dict.label }}
        </Select.Option>
      </Select>
      <Space>
        <Button type="primary" @click="handleQuery">
          <IconifyIcon icon="ep:search" class="mr-5px" />
          搜索
        </Button>
        <Button @click="resetQuery">
          <IconifyIcon icon="ep:refresh-right" class="mr-5px" />
          重置
        </Button>
      </Space>
    </div>

    <!-- 子设备列表 -->
    <Grid>
      <!-- 所属产品列 -->
      <template #product="{ row }">
        {{ getProductName(row.productId) }}
      </template>

      <!-- 操作列 -->
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
