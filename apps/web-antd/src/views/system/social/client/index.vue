<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemSocialClientApi } from '#/api/system/social/client';

import { Page, useVbenModal } from '@vben/common-ui';
import { Button, message } from 'ant-design-vue';
import { Plus } from '@vben/icons';
import Form from './modules/form.vue';
import { DocAlert } from '#/components/doc-alert';

import { $t } from '#/locales';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSocialClientPage, deleteSocialClient } from '#/api/system/social/client';
import { useGridColumns, useGridFormSchema } from './data';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建社交客户端 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑社交客户端 */
function onEdit(row: SystemSocialClientApi.SystemSocialClient) {
  formModalApi.setData(row).open();
}

/** 删除社交客户端 */
async function onDelete(row: SystemSocialClientApi.SystemSocialClient) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteSocialClient(row.id as number);
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
}: OnActionClickParams<SystemSocialClientApi.SystemSocialClient>) {
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
          return await getSocialClientPage({
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
  } as VxeTableGridOptions<SystemSocialClientApi.SystemSocialClient>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="三方登录" url="https://doc.iocoder.cn/social-user/" />

    <FormModal @success="onRefresh" />
    <Grid table-title="社交客户端列表">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate" v-access:code="['system:social-client:create']">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['社交客户端']) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template> 
