<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AssistantApi } from '#/api/mpr/assistant';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { message, Progress, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createEmptyAssistant,
  deleteAssistant,
  deleteAssistantList,
  exportAssistant,
  getAssistantPage,
} from '#/api/mpr/assistant';
import { $t } from '#/locales';

import DrawerForm from '../assistantConfig/modules/drawerForm.vue';
import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const { hasAccessByRoles } = useAccess();

const router = useRouter();
const loading = ref(false);

// eslint-disable-next-line no-unused-vars
const [FormModal, _formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DrawerFormModal, drawerFormApi] = useVbenDrawer({
  connectedComponent: DrawerForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建助理 */
function handleCreate() {
  // formModalApi.setData({}).open();
  drawerFormApi.setData({}).open();
  // createAra()
}

// eslint-disable-next-line no-unused-vars
async function _createAra() {
  loading.value = true;
  try {
    const data = await createEmptyAssistant({});
    router.push({ name: 'CreateAra', query: { id: data } });
  } finally {
    loading.value = false;
  }
}

/** 编辑助理专家模式 */
function handleExpertEdit(row: AssistantApi.Assistant) {
  // formModalApi.setData(row).open();
  drawerFormApi.setData({ assistantId: row.id }).open();
}

/** 编辑助理 */
function handleEdit(row: AssistantApi.Assistant) {
  // formModalApi.setData(row).open();
  router.push({ name: 'CreateAra', query: { id: row.id } });
}

/** 支付 */
function handlePay(row: AssistantApi.Assistant) {
  router.push({ name: 'AraPayment', query: { id: row.id } });
  // router.push('/infra/codegen');
}

/** 删除助理 */
async function handleDelete(row: AssistantApi.Assistant) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteAssistant(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除助理 */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    key: 'action_key_msg',
  });
  try {
    await deleteAssistantList(checkedIds.value);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess'),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

const checkedIds = ref<number[]>([]);

function handleRowCheckboxChange({
  records,
}: {
  records: AssistantApi.Assistant[];
}) {
  checkedIds.value = records.map((item) => item.id);
}

/** 导出表格 */
async function handleExport() {
  const data = await exportAssistant(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '助理.xls', source: data });
}

const isAdmin = hasAccessByRoles(['super_admin']);

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    actionButtonsReverse: true,
    schema: useGridFormSchema(isAdmin),
  },
  gridOptions: {
    columns: useGridColumns(isAdmin),
    height: 'auto',
    // border:  'default',
    pagerConfig: {
      enabled: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getAssistantPage({
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
  } as VxeTableGridOptions<AssistantApi.Assistant>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page v-loading="loading" auto-content-height>
    <FormModal @success="onRefresh" />
    <DrawerFormModal @success="onRefresh" />

    <Grid table-title="助理列表">
      <template #config-step="{ row }">
        <Progress
          :percent="((row.configStep ? row.configStep : 0) * 100) / 4"
          :format="() => `${row.configStep ? row.configStep : '0'}/4`"
          :steps="4"
        />
        <Tag v-if="false" :color="row.configStep === 3 ? 'green' : ''">
          {{ `${row.configStep ? row.configStep + 1 : '1'}/4` }}
        </Tag>
      </template>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['助理']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mpr:assistant:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mpr:assistant:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['mpr:assistant:delete'],
              onClick: handleDeleteBatch,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '支付',
              type: 'link',
              icon: 'grommet-icons:samsung-pay',
              auth: ['mpr:assistant:update'],
              onClick: handlePay.bind(null, row),
              ifShow: row.status === 0,
            },
            {
              label: '续费',
              type: 'link',
              icon: 'grommet-icons:samsung-pay',
              auth: ['mpr:assistant:update'],
              onClick: handlePay.bind(null, row),
              ifShow:
                (row.status === 10 && !row.autoRenew) || row.status === 20,
            },
            {
              label: '取消订阅',
              type: 'link',
              icon: 'grommet-icons:samsung-pay',
              auth: ['mpr:assistant:update'],
              onClick: handlePay.bind(null, row),
              ifShow: row.status === 10 && row.autoRenew,
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mpr:assistant:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              ifShow: false,
              icon: ACTION_ICON.DELETE,
              auth: ['mpr:assistant:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
          :drop-down-actions="[
            {
              label: '修改（专家模式）',
              type: 'link',
              onClick: handleExpertEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              //icon: ACTION_ICON.DELETE,
              auth: ['mpr:assistant:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
