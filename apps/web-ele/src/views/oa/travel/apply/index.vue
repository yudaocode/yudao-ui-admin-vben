<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaTravelApplyApi } from '#/api/oa/travel/apply';

import { Page, useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { ElLoading, ElMessage, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelTravelApply,
  deleteTravelApply,
  getTravelApplyPage,
  submitTravelApply,
} from '#/api/oa/travel/apply';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import { router } from '#/router';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'OaTravelApply' });

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

/** 新增出差申请 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 修改出差申请 */
function handleEdit(row: OaTravelApplyApi.TravelApply) {
  formModalApi.setData({ id: row.id }).open();
}

/** 查看出差申请详情 */
function handleDetail(row: OaTravelApplyApi.TravelApply) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 判断单据是否允许修改、提交及删除 */
function isEditable(row: OaTravelApplyApi.TravelApply) {
  return [
    BpmProcessInstanceStatus.CANCEL,
    BpmProcessInstanceStatus.NOT_START,
    BpmProcessInstanceStatus.REJECT,
  ].includes(row.status!);
}

/** 删除出差申请 */
async function handleDelete(row: OaTravelApplyApi.TravelApply) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.no]),
  });
  try {
    await deleteTravelApply(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.no]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 提交出差申请 */
async function handleSubmit(row: OaTravelApplyApi.TravelApply) {
  const loadingInstance = ElLoading.service({
    text: '正在提交中...',
  });
  try {
    await submitTravelApply(row.id!);
    ElMessage.success('提交成功');
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 撤回出差申请 */
async function handleCancel(row: OaTravelApplyApi.TravelApply) {
  const loadingInstance = ElLoading.service({
    text: '正在撤回中...',
  });
  try {
    await cancelTravelApply(row.id!);
    ElMessage.success('撤回成功');
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 查看审批进度 */
function handleProgress(row: OaTravelApplyApi.TravelApply) {
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
          return await getTravelApplyPage({
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
  } as VxeTableGridOptions<OaTravelApplyApi.TravelApply>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <DetailModal />

    <Grid table-title="出差申请列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['出差申请']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:travel-apply:save'],
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
      <template #status="{ row }">
        <ElTag v-if="row.status === BpmProcessInstanceStatus.NOT_START">
          未提交
        </ElTag>
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
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['oa:travel-apply:save'],
              ifShow: isEditable(row),
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '提交',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.AUDIT,
              auth: ['oa:travel-apply:save'],
              ifShow: isEditable(row),
              popConfirm: {
                title: '确认提交出差申请？',
                confirm: handleSubmit.bind(null, row),
              },
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:travel-apply:delete'],
              ifShow: isEditable(row),
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.no]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '撤回',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.CLOSE,
              auth: ['oa:travel-apply:save'],
              ifShow: row.status === BpmProcessInstanceStatus.RUNNING,
              popConfirm: {
                title: '确认撤回当前单据？',
                confirm: handleCancel.bind(null, row),
              },
            },
            {
              label: '审批进度',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              ifShow: !!row.processInstanceId,
              onClick: handleProgress.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
