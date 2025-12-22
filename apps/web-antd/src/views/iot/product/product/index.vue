<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IotProductCategoryApi } from '#/api/iot/product/category';
import type { IotProductApi } from '#/api/iot/product/product';

import { nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { ProductStatusEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, Card, Input, message, Space } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSimpleProductCategoryList } from '#/api/iot/product/category';
import {
  deleteProduct,
  exportProduct,
  getProductPage,
} from '#/api/iot/product/product';
import { $t } from '#/locales';

import { useGridColumns } from './data';
import ProductCardView from './modules/card-view.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'IoTProduct' });

const router = useRouter();
const categoryList = ref<IotProductCategoryApi.ProductCategory[]>([]);
const viewMode = ref<'card' | 'list'>('card');
const cardViewRef = ref();
const queryParams = ref({
  name: '',
  productKey: '',
}); // 搜索参数

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 加载产品分类列表 */
async function loadCategories() {
  categoryList.value = await getSimpleProductCategoryList();
}

/** 搜索产品 */
function handleSearch() {
  if (viewMode.value === 'list') {
    gridApi.formApi.setValues(queryParams.value);
  }
  gridApi.query();
}

/** 重置搜索 */
function handleReset() {
  queryParams.value.name = '';
  queryParams.value.productKey = '';
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
  const data = await exportProduct(queryParams.value);
  downloadFileFromBlobPart({ fileName: '产品列表.xls', source: data });
}

/** 打开产品详情 */
function openProductDetail(productId: number) {
  router.push({
    name: 'IoTProductDetail',
    params: { id: productId },
  });
}

/** 打开物模型管理 */
function openThingModel(productId: number) {
  router.push({
    name: 'IoTProductDetail',
    params: { id: productId },
    query: { tab: 'thingModel' },
  });
}

/** 新增产品 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑产品 */
function handleEdit(row: IotProductApi.Product) {
  formModalApi.setData(row).open();
}

/** 删除产品 */
async function handleDelete(row: IotProductApi.Product) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteProduct(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getProductPage({
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
  } as VxeTableGridOptions<IotProductApi.Product>,
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
onMounted(() => {
  loadCategories();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />

    <!-- 统一搜索工具栏 -->
    <Card :body-style="{ padding: '16px' }" class="mb-4">
      <!-- 搜索表单 -->
      <div class="mb-3 flex items-center gap-3">
        <Input
          v-model:value="queryParams.name"
          allow-clear
          class="w-[220px]"
          placeholder="请输入产品名称"
          @press-enter="handleSearch"
        >
          <template #prefix>
            <span class="text-gray-400">产品名称</span>
          </template>
        </Input>
        <Input
          v-model:value="queryParams.productKey"
          allow-clear
          class="w-[220px]"
          placeholder="请输入产品标识"
          @press-enter="handleSearch"
        >
          <template #prefix>
            <span class="text-gray-400">ProductKey</span>
          </template>
        </Input>
        <Button type="primary" @click="handleSearch">
          <IconifyIcon class="mr-1" icon="ant-design:search-outlined" />
          搜索
        </Button>
        <Button @click="handleReset">
          <IconifyIcon class="mr-1" icon="ant-design:reload-outlined" />
          重置
        </Button>
      </div>
      <!-- 操作按钮 -->
      <div class="flex items-center justify-between">
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['产品']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              onClick: handleExport,
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

    <Grid v-show="viewMode === 'list'" table-title="产品列表">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              onClick: openProductDetail.bind(null, row.id!),
            },
            {
              label: '物模型',
              type: 'link',
              onClick: openThingModel.bind(null, row.id!),
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
              disabled: row.status === ProductStatusEnum.PUBLISHED,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 卡片视图 -->
    <ProductCardView
      v-show="viewMode === 'card'"
      ref="cardViewRef"
      :category-list="categoryList"
      :search-params="queryParams"
      @create="handleCreate"
      @delete="handleDelete"
      @detail="openProductDetail"
      @edit="handleEdit"
      @thing-model="openThingModel"
    />
  </Page>
</template>
