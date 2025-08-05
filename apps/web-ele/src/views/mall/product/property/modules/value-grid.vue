<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallPropertyApi } from '#/api/mall/product/property';

import { watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deletePropertyValue,
  getPropertyValuePage,
} from '#/api/mall/product/property';
import { $t } from '#/locales';

import { useValueGridColumns, useValueGridFormSchema } from '../data';
import ValueForm from './value-form.vue';

const props = defineProps({
  propertyId: {
    type: Number,
    default: undefined,
  },
});

const [ValueFormModal, valueFormModalApi] = useVbenModal({
  connectedComponent: ValueForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建字典数据 */
function handleCreate() {
  valueFormModalApi.setData({ propertyId: props.propertyId }).open();
}

/** 编辑字典数据 */
function handleEdit(row: MallPropertyApi.PropertyValue) {
  valueFormModalApi.setData(row).open();
}

/** 删除字典数据 */
async function handleDelete(row: MallPropertyApi.PropertyValue) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deletePropertyValue(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useValueGridFormSchema(),
  },
  gridOptions: {
    columns: useValueGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getPropertyValuePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            propertyId: props.propertyId,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<MallPropertyApi.PropertyValue>,
});

/** 监听 dictType 变化，重新查询 */
watch(
  () => props.propertyId,
  () => {
    if (props.propertyId) {
      onRefresh();
    }
  },
);
</script>

<template>
  <div class="flex h-full flex-col">
    <ValueFormModal @success="onRefresh" />

    <Grid table-title="属性值列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['属性值']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['product:property:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['product:property:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['product:property:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
