<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { CrmCustomerApi } from '#/api/crm/customer';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message, Tabs } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteCustomer,
  exportCustomer,
  getCustomerPage,
} from '#/api/crm/customer';
import { DocAlert } from '#/components/doc-alert';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const { push } = useRouter();
const sceneType = ref('1');

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
  const data = await exportCustomer(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '客户.xls', source: data });
}

/** 创建客户 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑客户 */
function onEdit(row: CrmCustomerApi.Customer) {
  formModalApi.setData(row).open();
}

/** 删除客户 */
async function onDelete(row: CrmCustomerApi.Customer) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    key: 'action_key_msg',
  });
  try {
    await deleteCustomer(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 查看客户详情 */
function onDetail(row: CrmCustomerApi.Customer) {
  push({ name: 'CrmCustomerDetail', params: { id: row.id } });
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<CrmCustomerApi.Customer>) {
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
          return await getCustomerPage({
            page: page.currentPage,
            pageSize: page.pageSize,
            sceneType: sceneType.value,
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
  } as VxeTableGridOptions<CrmCustomerApi.Customer>,
});

function onChangeSceneType(key: number | string) {
  sceneType.value = key.toString();
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【客户】客户管理"
        url="https://doc.iocoder.cn/crm/customer/"
      />
      <DocAlert
        title="【通用】数据权限"
        url="https://doc.iocoder.cn/crm/permission/"
      />
    </template>

    <FormModal @success="onRefresh" />

    <Grid>
      <template #top>
        <Tabs class="border-none" @change="onChangeSceneType">
          <Tabs.TabPane tab="我负责的" key="1" />
          <Tabs.TabPane tab="我参与的" key="2" />
          <Tabs.TabPane tab="下属负责的" key="3" />
        </Tabs>
      </template>
      <template #toolbar-tools>
        <Button
          type="primary"
          @click="onCreate"
          v-access:code="['crm:customer:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['客户']) }}
        </Button>
        <Button
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['crm:customer:export']"
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
