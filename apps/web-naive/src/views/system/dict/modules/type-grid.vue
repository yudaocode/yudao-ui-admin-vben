<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeGridListeners,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemDictTypeApi } from '#/api/system/dict/type';

import { useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDictType,
  exportDictType,
  getDictTypePage,
} from '#/api/system/dict/type';
import { $t } from '#/locales';

import { useTypeGridColumns, useTypeGridFormSchema } from '../data';
import TypeForm from './type-form.vue';

const emit = defineEmits(['select']);

const [TypeFormModal, typeFormModalApi] = useVbenModal({
  connectedComponent: TypeForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 导出表格 */
async function onExport() {
  const data = await exportDictType(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '字典类型.xls', source: data });
}

/** 创建字典类型 */
function onCreate() {
  typeFormModalApi.setData(null).open();
}

/** 编辑字典类型 */
function onEdit(row: any) {
  typeFormModalApi.setData(row).open();
}

/** 删除字典类型 */
async function onDelete(row: SystemDictTypeApi.DictType) {
  const hideLoading = message.loading({
    content: $t('common.processing'),
    duration: 0,
    key: 'process_message',
  });
  try {
    await deleteDictType(row.id as number);
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
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemDictTypeApi.DictType>) {
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

/** 表格事件 */
const gridEvents: VxeGridListeners<SystemDictTypeApi.DictType> = {
  cellClick: ({ row }) => {
    emit('select', row.type);
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useTypeGridFormSchema(),
  },
  gridOptions: {
    columns: useTypeGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getDictTypePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isCurrent: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<SystemDictTypeApi.DictType>,
  gridEvents,
});
</script>

<template>
  <div class="h-full">
    <TypeFormModal @success="onRefresh" />

    <Grid table-title="字典类型列表">
      <template #toolbar-tools>
        <NButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:dict:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['字典类型']) }}
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
