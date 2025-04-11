<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { Demo01ContactApi } from '#/api/infra/demo/demo01';

import { DocAlert } from '#/components/doc-alert';
import Form from './modules/form.vue';
import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';
import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDemo01Contact, exportDemo01Contact, getDemo01ContactPage } from '#/api/infra/demo/demo01';
import { $t } from '#/locales';
import { downloadByData } from '#/utils/download';

import { useGridColumns, useGridFormSchema } from './data';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 导出表格 */
async function onExport() {
  const data = await exportDemo01Contact(await gridApi.formApi.getValues());
  downloadByData(data, '示例联系人.xls');
}

/** 创建示例联系人 */
function onCreate() {
  formModalApi.setData(null).open();
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
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
      key: 'action_process_msg',
    });
    onRefresh();
  } catch {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<Demo01ContactApi.Demo01Contact>) {
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
    keepSource: true,
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
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<Demo01ContactApi.Demo01Contact>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="示例联系人" url="https://doc.iocoder.cn/infra/" />

    <FormModal @success="onRefresh" />
    <Grid table-title="示例联系人列表">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate" v-access:code="['infra:demo01-contact:create']">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['示例联系人']) }}
        </Button>
        <Button type="primary" class="ml-2" @click="onExport" v-access:code="['infra:demo01-contact:export']">
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
