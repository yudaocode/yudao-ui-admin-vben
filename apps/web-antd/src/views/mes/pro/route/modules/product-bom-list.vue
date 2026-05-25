<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProRouteProcessApi } from '#/api/mes/pro/route/process';
import type { MesProRouteProductBomApi } from '#/api/mes/pro/route/productbom';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message, TabPane, Tabs } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getRouteProcessListByRoute } from '#/api/mes/pro/route/process';
import {
  deleteRouteProductBom,
  getRouteProductBomList,
} from '#/api/mes/pro/route/productbom';
import { $t } from '#/locales';

import { useRouteProductBomGridColumns } from '../data';
import BomForm from './bom-form.vue';

const props = defineProps<{
  productId: number;
  productName?: string;
  routeId: number;
}>();

const processList = ref<MesProRouteProcessApi.RouteProcess[]>([]); // 工序列表（用于 Tab）
const activeProcessId = ref<number>(); // 当前选中的工序 Tab
const list = ref<MesProRouteProductBomApi.RouteProductBom[]>([]); // 当前工序下的 BOM 列表

const [BomFormModal, bomFormModalApi] = useVbenModal({
  connectedComponent: BomForm,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    autoResize: true,
    border: true,
    columns: useRouteProductBomGridColumns(),
    data: list.value,
    minHeight: 200,
    pagerConfig: { enabled: false },
    rowConfig: { isHover: true, keyField: 'id' },
    showOverflow: true,
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<MesProRouteProductBomApi.RouteProductBom>,
});

/** 加载路线下的工序列表，用于工序 Tab */
async function loadProcessList() {
  processList.value = (await getRouteProcessListByRoute(props.routeId)) || [];
  if (processList.value.length > 0) {
    activeProcessId.value = processList.value[0]!.processId;
    await getList();
  } else {
    activeProcessId.value = undefined;
    list.value = [];
    gridApi.setGridOptions({ data: list.value });
  }
}

/** 加载当前工序下的 BOM 列表 */
async function getList() {
  if (!activeProcessId.value) {
    return;
  }
  gridApi.setLoading(true);
  try {
    list.value = await getRouteProductBomList({
      processId: activeProcessId.value,
      productId: props.productId,
      routeId: props.routeId,
    });
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

/** 新增 BOM */
function handleCreate() {
  if (!activeProcessId.value) {
    message.warning('请先选择工序');
    return;
  }
  bomFormModalApi
    .setData({
      processId: activeProcessId.value,
      productId: props.productId,
      routeId: props.routeId,
    })
    .open();
}

/** 编辑 BOM */
function handleEdit(row: MesProRouteProductBomApi.RouteProductBom) {
  bomFormModalApi
    .setData({
      id: row.id,
      processId: activeProcessId.value!,
      productId: props.productId,
      routeId: props.routeId,
    })
    .open();
}

/** 删除 BOM */
async function handleDelete(row: MesProRouteProductBomApi.RouteProductBom) {
  await deleteRouteProductBom(row.id!);
  message.success($t('ui.actionMessage.deleteSuccess', ['BOM 物料']));
  await getList();
}

watch(
  () => [props.routeId, props.productId],
  () => {
    if (props.routeId && props.productId) {
      loadProcessList();
    }
  },
  { immediate: true },
);
</script>

<template>
  <BomFormModal @success="getList" />
  <Tabs v-model:active-key="activeProcessId" @change="getList">
    <TabPane
      v-for="item in processList"
      :key="item.processId"
      :tab="item.processName"
    />
  </Tabs>
  <div class="mb-3 flex items-center justify-start">
    <TableAction
      :actions="[
        {
          label: $t('ui.actionTitle.create', ['BOM 物料']),
          type: 'primary',
          disabled: !activeProcessId,
          onClick: handleCreate,
        },
      ]"
    />
  </div>
  <Grid class="w-full" table-title="产品 BOM">
    <template #actions="{ row }">
      <TableAction
        :actions="[
          {
            label: $t('common.edit'),
            type: 'link',
            onClick: handleEdit.bind(null, row),
          },
          {
            label: $t('common.delete'),
            type: 'link',
            danger: true,
            popConfirm: {
              title: $t('ui.actionMessage.deleteConfirm', ['BOM 物料']),
              confirm: handleDelete.bind(null, row),
            },
          },
        ]"
      />
    </template>
  </Grid>
</template>
