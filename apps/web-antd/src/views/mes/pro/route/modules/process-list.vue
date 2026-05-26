<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProRouteProcessApi } from '#/api/mes/pro/route/process';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRouteProcess,
  getRouteProcessListByRoute,
} from '#/api/mes/pro/route/process';
import { $t } from '#/locales';

import { useRouteProcessGridColumns } from '../data';
import ProcessForm from './process-form.vue';

const props = defineProps<{
  formType: FormType;
  routeId: number;
}>();

const isEditable = ref(props.formType !== 'detail'); // 是否可编辑
const list = ref<MesProRouteProcessApi.RouteProcess[]>([]); // 工艺路线工序列表

const [ProcessFormModal, processFormModalApi] = useVbenModal({
  connectedComponent: ProcessForm,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    autoResize: true,
    border: true,
    columns: useRouteProcessGridColumns(),
    data: list.value,
    minHeight: 240,
    pagerConfig: { enabled: false },
    rowConfig: { isHover: true, keyField: 'id' },
    showOverflow: true,
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<MesProRouteProcessApi.RouteProcess>,
});

/** 加载工艺路线工序列表 */
async function getList() {
  gridApi.setLoading(true);
  try {
    list.value = await getRouteProcessListByRoute(props.routeId);
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

/** 新增工艺路线工序 */
function handleCreate() {
  const maxSort = Math.max(0, ...list.value.map((item) => item.sort || 0));
  processFormModalApi.setData({ maxSort, routeId: props.routeId }).open();
}

/** 编辑工艺路线工序 */
function handleEdit(row: MesProRouteProcessApi.RouteProcess) {
  processFormModalApi.setData({ id: row.id, routeId: props.routeId }).open();
}

/** 删除工艺路线工序 */
async function handleDelete(row: MesProRouteProcessApi.RouteProcess) {
  await deleteRouteProcess(row.id!);
  message.success($t('ui.actionMessage.deleteSuccess', ['工艺路线工序']));
  await getList();
}

watch(
  () => props.routeId,
  (value) => {
    if (value) {
      getList();
    }
  },
  { immediate: true },
);
</script>

<template>
  <ProcessFormModal @success="getList" />
  <div v-if="isEditable" class="mb-3 flex items-center justify-start">
    <TableAction
      :actions="[
        {
          label: $t('ui.actionTitle.create', ['工序']),
          type: 'primary',
          onClick: handleCreate,
        },
      ]"
    />
  </div>
  <Grid class="w-full" table-title="组成工序">
    <template #colorCode="{ row }">
      <div v-if="row.colorCode" class="flex items-center justify-center gap-1">
        <div
          class="h-4 w-4 rounded"
          :style="{ backgroundColor: row.colorCode }"
        ></div>
        <span>{{ row.colorCode }}</span>
      </div>
    </template>
    <template #actions="{ row }">
      <TableAction
        :actions="[
          {
            label: $t('common.edit'),
            type: 'link',
            ifShow: () => isEditable,
            onClick: handleEdit.bind(null, row),
          },
          {
            label: $t('common.delete'),
            type: 'link',
            danger: true,
            ifShow: () => isEditable,
            popConfirm: {
              title: $t('ui.actionMessage.deleteConfirm', ['工艺路线工序']),
              confirm: handleDelete.bind(null, row),
            },
          },
        ]"
      />
    </template>
  </Grid>
</template>
