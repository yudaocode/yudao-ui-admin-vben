<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IotDeviceApi } from '#/api/iot/device/device';
import type { IotDeviceGroupApi } from '#/api/iot/device/group';
import type { IotProductApi } from '#/api/iot/product/product';

import { nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import {
  Button,
  Card,
  Input,
  message,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDevice,
  deleteDeviceList,
  exportDeviceExcel,
  getDevicePage,
} from '#/api/iot/device/device';
import { getSimpleDeviceGroupList } from '#/api/iot/device/group';
import { getSimpleProductList } from '#/api/iot/product/product';
import { $t } from '#/locales';

import { useGridColumns } from './data';
import DeviceCardView from './modules/card-view.vue';
import DeviceForm from './modules/form.vue';
import DeviceGroupForm from './modules/group-form.vue';
import DeviceImportForm from './modules/import-form.vue';

/** IoT 设备列表 */
defineOptions({ name: 'IoTDevice' });

const route = useRoute();
const router = useRouter();
const products = ref<IotProductApi.Product[]>([]);
const deviceGroups = ref<IotDeviceGroupApi.DeviceGroup[]>([]);
const viewMode = ref<'card' | 'list'>('card');
const cardViewRef = ref();
const checkedIds = ref<number[]>([]);

const [DeviceFormModal, deviceFormModalApi] = useVbenModal({
  connectedComponent: DeviceForm,
  destroyOnClose: true,
});

const [DeviceGroupFormModal, deviceGroupFormModalApi] = useVbenModal({
  connectedComponent: DeviceGroupForm,
  destroyOnClose: true,
});

const [DeviceImportFormModal, deviceImportFormModalApi] = useVbenModal({
  connectedComponent: DeviceImportForm,
  destroyOnClose: true,
});

const queryParams = ref({
  deviceName: '',
  nickname: '',
  productId: undefined as number | undefined,
  deviceType: undefined as number | undefined,
  status: undefined as number | undefined,
  groupId: undefined as number | undefined,
}); // 搜索参数

/** 搜索 */
function handleSearch() {
  if (viewMode.value === 'list') {
    gridApi.formApi.setValues(queryParams.value);
  }
  gridApi.query();
}

/** 重置搜索 */
function handleReset() {
  queryParams.value.deviceName = '';
  queryParams.value.nickname = '';
  queryParams.value.productId = undefined;
  queryParams.value.deviceType = undefined;
  queryParams.value.status = undefined;
  queryParams.value.groupId = undefined;
  handleSearch();
}

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 视图切换 */
async function handleViewModeChange(mode: 'card' | 'list') {
  if (viewMode.value === mode) {
    return; // 如果已经是目标视图，不需要切换
  }
  viewMode.value = mode;
  // 等待视图更新后再触发查询
  await nextTick();
  gridApi.query();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportDeviceExcel(queryParams.value);
  downloadFileFromBlobPart({ fileName: '物联网设备.xls', source: data });
}

/** 打开设备详情 */
function openDetail(id: number) {
  router.push({ name: 'IoTDeviceDetail', params: { id } });
}

/** 跳转到产品详情页面 */
function openProductDetail(productId: number) {
  router.push({ name: 'IoTProductDetail', params: { id: productId } });
}

/** 打开物模型数据 */
function openModel(id: number) {
  router.push({
    name: 'IoTDeviceDetail',
    params: { id },
    query: { tab: 'model' },
  });
}

/** 新增设备 */
function handleCreate() {
  deviceFormModalApi.setData(null).open();
}

/** 编辑设备 */
function handleEdit(row: IotDeviceApi.Device) {
  deviceFormModalApi.setData(row).open();
}

/** 删除设备 */
async function handleDelete(row: IotDeviceApi.Device) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.deviceName]),
    duration: 0,
  });
  try {
    await deleteDevice(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.deviceName]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除设备 */
async function handleDeleteBatch() {
  if (checkedIds.value.length === 0) {
    message.warning('请选择要删除的设备');
    return;
  }
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deletingBatch'),
    duration: 0,
  });
  try {
    await deleteDeviceList(checkedIds.value);
    message.success($t('ui.actionMessage.deleteSuccess'));
    checkedIds.value = [];
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 添加到分组 */
function handleAddToGroup() {
  if (checkedIds.value.length === 0) {
    message.warning('请选择要添加到分组的设备');
    return;
  }
  deviceGroupFormModalApi.setData(checkedIds.value).open();
}

/** 设备导入 */
function handleImport() {
  deviceImportFormModalApi.open();
}

function handleRowCheckboxChange({
  records,
}: {
  records: IotDeviceApi.Device[];
}) {
  checkedIds.value = records.map((item) => item.id!);
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    checkboxConfig: {
      highlight: true,
      reserve: true,
    },
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getDevicePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...queryParams.value,
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
  } as VxeTableGridOptions<IotDeviceApi.Device>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

/** 包装 gridApi.query() 方法，统一列表视图和卡片视图的查询接口 */
const originalQuery = gridApi.query.bind(gridApi);
gridApi.query = async (params?: Record<string, any>) => {
  if (viewMode.value === 'list') {
    return await originalQuery(params);
  } else {
    // 卡片视图：调用卡片组件的 query 方法
    cardViewRef.value?.query();
  }
};

/** 初始化 */
onMounted(async () => {
  // 获取产品列表
  products.value = await getSimpleProductList();
  // 获取分组列表
  deviceGroups.value = await getSimpleDeviceGroupList();

  // 处理 productId 参数
  const { productId } = route.query;
  if (productId) {
    queryParams.value.productId = Number(productId);
    // 自动触发搜索
    handleSearch();
  }
});
</script>

<template>
  <Page auto-content-height>
    <DeviceFormModal @success="handleRefresh" />
    <DeviceGroupFormModal @success="handleRefresh" />
    <DeviceImportFormModal @success="handleRefresh" />

    <!-- 统一搜索工具栏 -->
    <Card :body-style="{ padding: '16px' }" class="mb-4">
      <!-- 搜索表单 -->
      <div class="mb-3 flex flex-wrap items-center gap-3">
        <Select
          v-model:value="queryParams.productId"
          placeholder="请选择产品"
          allow-clear
          style="width: 200px"
        >
          <Select.Option
            v-for="product in products"
            :key="product.id"
            :value="product.id"
          >
            {{ product.name }}
          </Select.Option>
        </Select>
        <Input
          v-model:value="queryParams.deviceName"
          placeholder="请输入 DeviceName"
          allow-clear
          style="width: 200px"
          @press-enter="handleSearch"
        />
        <Input
          v-model:value="queryParams.nickname"
          placeholder="请输入备注名称"
          allow-clear
          style="width: 200px"
          @press-enter="handleSearch"
        />
        <Select
          v-model:value="queryParams.deviceType"
          placeholder="请选择设备类型"
          allow-clear
          style="width: 200px"
        >
          <Select.Option
            v-for="dict in getDictOptions(
              DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE,
              'number',
            )"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </Select.Option>
        </Select>
        <Select
          v-model:value="queryParams.status"
          placeholder="请选择设备状态"
          allow-clear
          style="width: 200px"
        >
          <Select.Option
            v-for="dict in getDictOptions(DICT_TYPE.IOT_DEVICE_STATE, 'number')"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </Select.Option>
        </Select>
        <Select
          v-model:value="queryParams.groupId"
          placeholder="请选择设备分组"
          allow-clear
          style="width: 200px"
        >
          <Select.Option
            v-for="group in deviceGroups"
            :key="group.id"
            :value="group.id"
          >
            {{ group.name }}
          </Select.Option>
        </Select>
        <Button type="primary" @click="handleSearch">
          <IconifyIcon icon="ant-design:search-outlined" class="mr-1" />
          {{ $t('common.search') }}
        </Button>
        <Button @click="handleReset">
          <IconifyIcon icon="ant-design:reload-outlined" class="mr-1" />
          {{ $t('common.reset') }}
        </Button>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center justify-between">
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['设备']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['iot:device:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['iot:device:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.import'),
              type: 'primary',
              icon: ACTION_ICON.UPLOAD,
              auth: ['iot:device:import'],
              onClick: handleImport,
            },
            {
              label: '添加到分组',
              type: 'primary',
              icon: 'ant-design:folder-add-outlined',
              auth: ['iot:device:update'],
              ifShow: () => viewMode === 'list',
              disabled: isEmpty(checkedIds),
              onClick: handleAddToGroup,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['iot:device:delete'],
              ifShow: () => viewMode === 'list',
              disabled: isEmpty(checkedIds),
              onClick: handleDeleteBatch,
            },
          ]"
        />

        <!-- 视图切换 -->
        <Space :size="4">
          <Button
            :type="viewMode === 'card' ? 'primary' : 'default'"
            @click="handleViewModeChange('card')"
          >
            <IconifyIcon icon="ant-design:appstore-outlined" />
          </Button>
          <Button
            :type="viewMode === 'list' ? 'primary' : 'default'"
            @click="handleViewModeChange('list')"
          >
            <IconifyIcon icon="ant-design:unordered-list-outlined" />
          </Button>
        </Space>
      </div>
    </Card>

    <Grid table-title="设备列表" v-show="viewMode === 'list'">
      <!-- 所属产品列 -->
      <template #product="{ row }">
        <a
          class="cursor-pointer text-primary"
          @click="openProductDetail(row.productId)"
        >
          {{ products.find((p) => p.id === row.productId)?.name || '-' }}
        </a>
      </template>

      <!-- 所属分组列 -->
      <template #groups="{ row }">
        <template v-if="row.groupIds?.length">
          <Tag
            v-for="groupId in row.groupIds"
            :key="groupId"
            size="small"
            class="mr-1"
          >
            {{ deviceGroups.find((g) => g.id === groupId)?.name }}
          </Tag>
        </template>
        <span v-else>-</span>
      </template>

      <!-- 操作列 -->
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              onClick: openDetail.bind(null, row.id!),
            },
            {
              label: '日志',
              type: 'link',
              onClick: openModel.bind(null, row.id!),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.deviceName]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 卡片视图 -->
    <DeviceCardView
      v-show="viewMode === 'card'"
      ref="cardViewRef"
      :products="products"
      :device-groups="deviceGroups"
      :search-params="queryParams"
      @create="handleCreate"
      @edit="handleEdit"
      @delete="handleDelete"
      @detail="openDetail"
      @model="openModel"
      @product-detail="openProductDetail"
    />
  </Page>
</template>

<style scoped>
/* 隐藏 VxeGrid 自带的搜索表单区域 */
:deep(.vxe-grid--form-wrapper) {
  display: none !important;
}
</style>
