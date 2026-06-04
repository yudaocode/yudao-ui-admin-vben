<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProFeedbackApi } from '#/api/mes/pro/feedback';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesProFeedbackStatusEnum } from '@vben/constants';
import { useUserStore } from '@vben/stores';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteFeedback,
  exportFeedback,
  getFeedbackPage,
} from '#/api/mes/pro/feedback';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const userStore = useUserStore();
const currentUserId = userStore.userInfo?.id; // 当前登录用户 ID，用于审批人权限判断

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建生产报工 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 编辑生产报工 */
function handleEdit(row: MesProFeedbackApi.Feedback) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 提交生产报工 */
function handleSubmit(row: MesProFeedbackApi.Feedback) {
  formModalApi.setData({ formType: 'submit', id: row.id }).open();
}

/** 审批生产报工 */
function handleApprove(row: MesProFeedbackApi.Feedback) {
  formModalApi.setData({ formType: 'approve', id: row.id }).open();
}

/** 详情生产报工 */
function handleDetail(row: MesProFeedbackApi.Feedback) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 删除生产报工 */
async function handleDelete(row: MesProFeedbackApi.Feedback) {
  const hideLoading = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.code]),
  });
  try {
    await deleteFeedback(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    hideLoading.close();
  }
}

/** 导出表格 */
async function handleExport() {
  const data = await exportFeedback(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '生产报工.xls', source: data });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema() },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getFeedbackPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { isHover: true, keyField: 'id' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<MesProFeedbackApi.Feedback>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【生产】生产报工"
        url="https://doc.iocoder.cn/mes/pro/feedback/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <Grid table-title="生产报工列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['生产报工']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:pro-feedback:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:pro-feedback:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #code="{ row }">
        <ElButton link type="primary" @click="handleDetail(row)">
          {{ row.code }}
        </ElButton>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              auth: ['mes:pro-feedback:update'],
              ifShow: () => row.status === MesProFeedbackStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.submit'),
              type: 'success',
              link: true,
              auth: ['mes:pro-feedback:update'],
              ifShow: () => row.status === MesProFeedbackStatusEnum.PREPARE,
              onClick: handleSubmit.bind(null, row),
            },
            {
              label: $t('common.approve'),
              type: 'primary',
              link: true,
              auth: ['mes:pro-feedback:approve'],
              ifShow: () =>
                row.status === MesProFeedbackStatusEnum.APPROVING &&
                row.approveUserId === currentUserId,
              onClick: handleApprove.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              auth: ['mes:pro-feedback:delete'],
              ifShow: () => row.status === MesProFeedbackStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
