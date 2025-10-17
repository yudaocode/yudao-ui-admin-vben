<script setup lang="ts">
import { onMounted, provide, ref } from 'vue';

import { message } from 'ant-design-vue';
import { Page } from '@vben/common-ui';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteThingModel, getThingModelPage } from '#/api/iot/thingmodel';
import { getProduct } from '#/api/iot/product/product';
import type { IotProductApi } from '#/api/iot/product/product';

import { useGridColumns, useGridFormSchema } from './data';
import { getDataTypeOptionsLabel, IOT_PROVIDE_KEY } from '../utils/constants';
import ThingModelForm from './modules/ThingModelForm.vue';
import ThingModelTSL from './modules/ThingModelTSL.vue';
import { DataDefinition } from './modules/components';

defineOptions({ name: 'IoTThingModel' });

const props = defineProps<{
  productId: number;
}>();

// 产品信息
const product = ref<IotProductApi.Product>({} as IotProductApi.Product);

// 提供产品信息给子组件
provide(IOT_PROVIDE_KEY.PRODUCT, product);

// 组件引用
const thingModelFormRef = ref();
const thingModelTSLRef = ref();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }: any, formValues: any) => {
          return await getThingModelPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            productId: props.productId,
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
  formOptions: {
    schema: useGridFormSchema(),
  },
});

// 新增功能
function handleCreate() {
  thingModelFormRef.value?.open('create');
}

// 编辑功能
function handleEdit(row: any) {
  thingModelFormRef.value?.open('update', row.id);
}

// 删除功能
async function handleDelete(row: any) {
  try {
    await deleteThingModel(row.id);
    message.success('删除成功');
    gridApi.reload();
  } catch (error) {
    console.error('删除失败:', error);
  }
}

// 打开 TSL
function handleOpenTSL() {
  thingModelTSLRef.value?.open();
}

// 获取数据类型标签
function getDataTypeLabel(row: any) {
  return getDataTypeOptionsLabel(row.property?.dataType) || '-';
}

// 刷新表格
function handleRefresh() {
  gridApi.reload();
}

// 获取产品信息
async function getProductData() {
  try {
    product.value = await getProduct(props.productId);
  } catch (error) {
    console.error('获取产品信息失败:', error);
  }
}

// 初始化
onMounted(async () => {
  await getProductData();
});
</script>

<template>
  <Page
    auto-content-height
    description="管理产品的物模型定义，包括属性、服务和事件"
    title="物模型管理"
  >
    <Grid ref="xGrid">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '添加功能',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: handleCreate,
            },
            {
              label: 'TSL',
              type: 'default',
              color: 'success',
              onClick: handleOpenTSL,
            },
          ]"
        />
      </template>

      <!-- 数据类型列 -->
      <template #dataType="{ row }">
        <span>{{ getDataTypeLabel(row) }}</span>
      </template>

      <!-- 数据定义列 -->
      <template #dataDefinition="{ row }">
        <DataDefinition :data="row" />
      </template>

      <!-- 操作列 -->
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              popConfirm: {
                title: '确认删除该功能吗?',
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 物模型表单 -->
    <ThingModelForm ref="thingModelFormRef" @success="handleRefresh" />

    <!-- TSL 弹窗 -->
    <ThingModelTSL ref="thingModelTSLRef" />
  </Page>
</template>
