<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaSupplyApplyApi } from '#/api/oa/supply/apply';

import { Page, useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { message, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelSupplyApply,
  deleteSupplyApply,
  getSupplyApplyPage,
  submitSupplyApply,
} from '#/api/oa/supply/apply';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import { router } from '#/router';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'OaSupplyApply' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建领用申请 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑领用申请 */
function handleEdit(row: OaSupplyApplyApi.SupplyApply) {
  formModalApi.setData(row).open();
}

/** 查看领用申请详情 */
function handleDetail(row: OaSupplyApplyApi.SupplyApply) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 删除领用申请 */
async function handleDelete(row: OaSupplyApplyApi.SupplyApply) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteSupplyApply(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 提交领用申请 */
async function handleSubmit(row: OaSupplyApplyApi.SupplyApply) {
  const hideLoading = message.loading({
    content: '正在提交中...',
    duration: 0,
  });
  try {
    await submitSupplyApply(row.id!);
    message.success('提交成功');
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 取消领用申请 */
async function handleCancel(row: OaSupplyApplyApi.SupplyApply) {
  const hideLoading = message.loading({
    content: '正在取消中...',
    duration: 0,
  });
  try {
    await cancelSupplyApply(row.id!);
    message.success('取消成功');
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 查看审批进度 */
function handleProcessDetail(row: OaSupplyApplyApi.SupplyApply) {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.processInstanceId },
  });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSupplyApplyPage({
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
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<OaSupplyApplyApi.SupplyApply>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <DetailModal />

    <Grid table-title="领用申请列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['领用申请']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:supply-apply:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #no="{ row }">
        <span class="cursor-pointer text-primary" @click="handleDetail(row)">
          {{ row.no }}
        </span>
      </template>
      <template #statusTag="{ row }">
        <Tag v-if="row.status === BpmProcessInstanceStatus.NOT_START">
          未提交
        </Tag>
        <DictTag
          v-else
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="row.status"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['oa:supply-apply:update'],
              ifShow: [
                BpmProcessInstanceStatus.NOT_START,
                BpmProcessInstanceStatus.REJECT,
                BpmProcessInstanceStatus.CANCEL,
              ].includes(row.status!),
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '提交',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['oa:supply-apply:create'],
              ifShow: [
                BpmProcessInstanceStatus.NOT_START,
                BpmProcessInstanceStatus.REJECT,
                BpmProcessInstanceStatus.CANCEL,
              ].includes(row.status!),
              popConfirm: {
                title: '确定提交该领用申请吗？',
                confirm: handleSubmit.bind(null, row),
              },
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:supply-apply:delete'],
              ifShow: [
                BpmProcessInstanceStatus.NOT_START,
                BpmProcessInstanceStatus.REJECT,
                BpmProcessInstanceStatus.CANCEL,
              ].includes(row.status!),
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '进度',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              ifShow: !!row.processInstanceId,
              onClick: handleProcessDetail.bind(null, row),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:supply-apply:update'],
              ifShow: row.status === BpmProcessInstanceStatus.RUNNING,
              popConfirm: {
                title: '确定取消该领用申请吗？',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
