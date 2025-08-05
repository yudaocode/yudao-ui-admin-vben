<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemDictDataApi } from '#/api/system/dict/data';

import { watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDictData,
  exportDictData,
  getDictDataPage,
} from '#/api/system/dict/data';
import { $t } from '#/locales';

import { useDataGridColumns, useDataGridFormSchema } from '../data';
import DataForm from './data-form.vue';

const props = defineProps({
  dictType: {
    type: String,
    default: undefined,
  },
});

const [DataFormModal, dataFormModalApi] = useVbenModal({
  connectedComponent: DataForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 导出表格 */
async function onExport() {
  const data = await exportDictData(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '字典数据.xls', source: data });
}

/** 创建字典数据 */
function onCreate() {
  dataFormModalApi.setData({ dictType: props.dictType }).open();
}

/** 编辑字典数据 */
function onEdit(row: any) {
  dataFormModalApi.setData(row).open();
}

/** 删除字典数据 */
async function onDelete(row: any) {
  const hideLoading = message.loading({
    content: $t('common.processing'),
    duration: 0,
    key: 'process_message',
  });
  try {
    await deleteDictData(row.id);
    message.success({
      content: $t('common.operationSuccess'),
      key: 'process_message',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 表格操作按钮回调 */
function onActionClick({ code, row }: OnActionClickParams) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useDataGridFormSchema(),
  },
  gridOptions: {
    columns: useDataGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getDictDataPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            dictType: props.dictType,
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
  } as VxeTableGridOptions<SystemDictDataApi.DictData>,
});

/** 监听 dictType 变化，重新查询 */
watch(
  () => props.dictType,
  () => {
    if (props.dictType) {
      onRefresh();
    }
  },
);
</script>

<template>
  <div class="flex h-full flex-col">
    <DataFormModal @success="onRefresh" />

    <Grid table-title="字典数据列表">
      <template #toolbar-tools>
        <NButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:dict:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['字典数据']) }}
        </NButton>
        <NButton
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['system:dict:export']"
        >
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </NButton>
      </template>
    </Grid>
  </div>
</template>
