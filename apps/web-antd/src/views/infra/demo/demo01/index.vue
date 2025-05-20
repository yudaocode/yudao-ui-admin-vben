<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { Demo01ContactApi } from '#/api/infra/demo/demo01';

import { h, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus, Trash2 } from '@vben/icons';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDemo01Contact,
  deleteDemo01ContactListByIds,
  exportDemo01Contact,
  getDemo01ContactPage,
} from '#/api/infra/demo/demo01';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建示例联系人 */
function onCreate() {
  formModalApi.setData({}).open();
}

/** 编辑示例联系人 */
function onEdit(row: Demo01ContactApi.Demo01Contact) {
  formModalApi.setData(row).open();
}

/** 删除示例联系人 */
async function onDelete(row: Demo01ContactApi.Demo01Contact) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteDemo01Contact(row.id as number);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除示例联系人 */
async function onDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteDemo01ContactListByIds(deleteIds.value);
    message.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } finally {
    hideLoading();
  }
}

// TODO @puhui999：方法名，改成 handleRowCheckboxChange；注释：处理选中表格行
// TODO @puhui999：deleteIds => checkedIds；然后注释去掉？
const deleteIds = ref<number[]>([]); // 待删除示例联系人 ID
function setDeleteIds({
  records,
}: {
  records: Demo01ContactApi.Demo01Contact[];
}) {
  deleteIds.value = records.map((item) => item.id);
}

/** 导出表格 */
async function onExport() {
  const data = await exportDemo01Contact(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '示例联系人.xls', source: data });
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<Demo01ContactApi.Demo01Contact>) {
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
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    pagerConfig: {
      enabled: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getDemo01ContactPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
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
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<Demo01ContactApi.Demo01Contact>,
  gridEvents: {
    checkboxAll: setDeleteIds,
    checkboxChange: setDeleteIds,
  },
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />

    <Grid table-title="示例联系人列表">
      <template #toolbar-tools>
        <Button
          :icon="h(Plus)"
          type="primary"
          @click="onCreate"
          v-access:code="['infra:demo01-contact:create']"
        >
          {{ $t('ui.actionTitle.create', ['示例联系人']) }}
        </Button>
        <Button
          :icon="h(Download)"
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['infra:demo01-contact:export']"
        >
          {{ $t('ui.actionTitle.export') }}
        </Button>
        <Button
          :icon="h(Trash2)"
          type="primary"
          danger
          class="ml-2"
          :disabled="isEmpty(deleteIds)"
          @click="onDeleteBatch"
          v-access:code="['infra:demo01-contact:delete']"
        >
          批量删除
        </Button>
      </template>
    </Grid>
  </Page>
</template>
