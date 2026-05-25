<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
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

// TODO @AI：const 的尾注释？别的 vue 文件也看看，遵守 agents md 里说的。
const processOptions = ref<
  Array<{ processId: number; processName?: string }>
>([]); // TODO @AI：是不是不用转换，vue 那直接处理就好了；
const activeProcessId = ref<string>(''); // TODO @AI：这个好像是 number？看看 vue3 + ep 里的代码。
const list = ref<MesProRouteProductBomApi.RouteProductBom[]>([]);

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
  const data = await getRouteProcessListByRoute(props.routeId);
  processOptions.value = (data || []).map((item) => ({
    processId: item.processId!,
    processName: item.processName,
  }));
  if (processOptions.value.length > 0) {
    activeProcessId.value = String(processOptions.value[0]!.processId);
    await getList();
  } else {
    activeProcessId.value = '';
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
      processId: Number(activeProcessId.value),
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
      processId: Number(activeProcessId.value),
      productId: props.productId,
      routeId: props.routeId,
    })
    .open();
}

/** 编辑 BOM */
function handleEdit(row: MesProRouteProductBomApi.RouteProductBom) {
  bomFormModalApi
    .setData({
      processId: Number(activeProcessId.value),
      productId: props.productId,
      routeId: props.routeId,
      row,
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
      v-for="item in processOptions"
      :key="String(item.processId)"
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
