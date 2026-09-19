<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaSealApplyApi } from '#/api/oa/seal/apply';

import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { ElLoading, ElMessage, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelSealApply,
  deleteSealApply,
  getSealApplyPage,
  submitSealApply,
} from '#/api/oa/seal/apply';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'OaSealApply' });

const router = useRouter(); // 路由

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

/** 创建用印申请 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑用印申请 */
function handleEdit(row: OaSealApplyApi.SealApply) {
  formModalApi.setData(row).open();
}

/** 查看用印申请详情 */
function handleDetail(row: OaSealApplyApi.SealApply) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 查看审批进度 */
function handleProcessDetail(row: OaSealApplyApi.SealApply) {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.processInstanceId },
  });
}

/** 提交用印申请 */
async function handleSubmit(row: OaSealApplyApi.SealApply) {
  await submitSealApply(row.id!);
  ElMessage.success('提交成功');
  handleRefresh();
}

/** 撤销用印申请 */
async function handleCancel(row: OaSealApplyApi.SealApply) {
  await cancelSealApply(row.id!);
  ElMessage.success('撤销成功');
  handleRefresh();
}

/** 删除用印申请 */
async function handleDelete(row: OaSealApplyApi.SealApply) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.no]),
  });
  try {
    await deleteSealApply(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.no]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
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
          return await getSealApplyPage({
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
  } as VxeTableGridOptions<OaSealApplyApi.SealApply>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <DetailModal />

    <Grid table-title="用印申请列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['用印申请']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:seal-apply:create'],
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
        <ElTag
          v-if="row.status === BpmProcessInstanceStatus.NOT_START"
          type="info"
        >
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
              label: '进度',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['oa:seal-apply:query'],
              ifShow: !!row.processInstanceId,
              onClick: handleProcessDetail.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['oa:seal-apply:update'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '提交',
              type: 'primary',
              link: true,
              auth: ['oa:seal-apply:create'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              popConfirm: {
                title: '确认提交用印申请？',
                confirm: handleSubmit.bind(null, row),
              },
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:seal-apply:delete'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              popConfirm: {
                title: '确认删除用印申请？',
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '撤销',
              type: 'danger',
              link: true,
              auth: ['oa:seal-apply:update'],
              ifShow: row.status === BpmProcessInstanceStatus.RUNNING,
              popConfirm: {
                title: '确认撤销用印申请？',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
