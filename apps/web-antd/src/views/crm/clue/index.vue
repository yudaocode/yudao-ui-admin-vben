<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { CrmClueApi } from '#/api/crm/clue';

import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteClue, exportClue, getCluePage } from '#/api/crm/clue';
import { DocAlert } from '#/components/doc-alert';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const { push } = useRouter();

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
  const data = await exportClue(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '线索.xls', source: data });
}

/** 创建线索 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑线索 */
function onEdit(row: CrmClueApi.Clue) {
  formModalApi.setData(row).open();
}

/** 删除线索 */
async function onDelete(row: CrmClueApi.Clue) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteClue(row.id as number);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    hideLoading();
  }
}

/** 查看线索详情 */
function onDetail(row: CrmClueApi.Clue) {
  push({ name: 'CrmClueDetail', params: { id: row.id } });
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<CrmClueApi.Clue>) {
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
          return await getCluePage({
            page: page.currentPage,
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
  } as VxeTableGridOptions<CrmClueApi.Clue>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【线索】线索管理"
        url="https://doc.iocoder.cn/crm/clue/"
      />
      <DocAlert
        title="【通用】数据权限"
        url="https://doc.iocoder.cn/crm/permission/"
      />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="线索列表">
      <template #toolbar-tools>
        <Button
          type="primary"
          @click="onCreate"
          v-access:code="['crm:clue:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['线索']) }}
        </Button>
        <Button
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['crm:clue:export']"
        >
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
      <template #name="{ row }">
        <Button type="link" @click="onDetail(row)">
          {{ row.name }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
