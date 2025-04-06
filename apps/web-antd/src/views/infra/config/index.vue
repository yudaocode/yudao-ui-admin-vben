<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraConfigApi } from '#/api/infra/config';

import { Page, useVbenModal } from '@vben/common-ui';
import { Button, message } from 'ant-design-vue';
import { Plus, Download } from '@vben/icons';
import Form from './modules/form.vue';

import { $t } from '#/locales';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getConfigPage, deleteConfig, exportConfig, getConfigKey } from '#/api/infra/config';
import { useGridColumns, useGridFormSchema } from './data';
import { downloadByData } from '#/utils/download';

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
  const data = await exportConfig(await gridApi.formApi.getValues());
  downloadByData(data, '参数配置.xls');
}

/** 创建参数 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑参数 */
function onEdit(row: InfraConfigApi.InfraConfig) {
  formModalApi.setData(row).open();
}

/** 删除参数 */
async function onDelete(row: InfraConfigApi.InfraConfig) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteConfig(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
      key: 'action_process_msg',
    });
    onRefresh();
  } catch (error) {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraConfigApi.InfraConfig>) {
  switch (code) {
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema()
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getConfigPage({
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
  } as VxeTableGridOptions<InfraConfigApi.InfraConfig>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="参数列表">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate" v-access:code="['infra:config:create']">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['参数']) }}
        </Button>
        <Button type="primary" class="ml-2" @click="onExport" v-access:code="['infra:config:export']">
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template> 
