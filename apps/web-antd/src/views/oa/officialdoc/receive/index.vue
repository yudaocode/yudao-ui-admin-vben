<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaOfficialDocReceiveApi } from '#/api/oa/officialdoc/receive';

import { useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { useUserStore } from '@vben/stores';

import { message, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelOfficialDocReceive,
  claimOfficialDocReceive,
  deleteOfficialDocReceive,
  getOfficialDocReceivePage,
  submitOfficialDocReceive,
} from '#/api/oa/officialdoc/receive';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import { OaOfficialDocHandleStatus } from '#/views/oa/utils/constants';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'OaOfficialDocReceive' });

const router = useRouter(); // 路由
const userStore = useUserStore(); // 当前用户

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

/** 创建公文收文 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑公文收文 */
function handleEdit(row: OaOfficialDocReceiveApi.OfficialDocReceive) {
  formModalApi.setData({ id: row.id }).open();
}

/** 查看公文收文详情 */
function handleDetail(row: OaOfficialDocReceiveApi.OfficialDocReceive) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 删除公文收文 */
async function handleDelete(row: OaOfficialDocReceiveApi.OfficialDocReceive) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteOfficialDocReceive(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 提交审批 */
async function handleSubmit(row: OaOfficialDocReceiveApi.OfficialDocReceive) {
  try {
    await confirm('确认提交当前公文？');
  } catch {
    return;
  }
  await submitOfficialDocReceive(row.id!);
  message.success('提交成功');
  handleRefresh();
}

/** 撤销审批 */
async function handleCancel(row: OaOfficialDocReceiveApi.OfficialDocReceive) {
  try {
    await confirm('确认撤销审批吗？');
  } catch {
    return;
  }
  await cancelOfficialDocReceive(row.id!);
  message.success('撤销成功');
  handleRefresh();
}

/** 签收公文 */
async function handleClaim(row: OaOfficialDocReceiveApi.OfficialDocReceive) {
  await claimOfficialDocReceive(row.id!);
  message.success('签收成功');
  handleRefresh();
}

/** 查看审批进度 */
function handleProcessDetail(row: OaOfficialDocReceiveApi.OfficialDocReceive) {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.processInstanceId },
  });
}

/** 是否为本人登记的未提交收文，可提交、修改 */
function isEditableRow(row: OaOfficialDocReceiveApi.OfficialDocReceive) {
  return (
    row.status === BpmProcessInstanceStatus.NOT_START &&
    row.receiveType === 0 &&
    row.creator === String(userStore.userInfo?.id)
  );
}

/** 是否为本人登记的未提交、已驳回或已取消收文，可删除 */
function isDeletableRow(row: OaOfficialDocReceiveApi.OfficialDocReceive) {
  return (
    [
      BpmProcessInstanceStatus.CANCEL,
      BpmProcessInstanceStatus.NOT_START,
      BpmProcessInstanceStatus.REJECT,
    ].includes(row.status!) && row.creator === String(userStore.userInfo?.id)
  );
}

/** 是否为本人提交且审批中的收文，可撤销 */
function isCancelableRow(row: OaOfficialDocReceiveApi.OfficialDocReceive) {
  return (
    row.status === BpmProcessInstanceStatus.RUNNING &&
    row.creator === String(userStore.userInfo?.id)
  );
}

/** 是否为待签收的发文转收文 */
function isClaimableRow(row: OaOfficialDocReceiveApi.OfficialDocReceive) {
  return (
    !!row.sendId &&
    !row.creator &&
    row.handleStatus === OaOfficialDocHandleStatus.WAIT_CLAIM
  );
}

/** 是否为已签收的发文转收文 */
function isClaimedRow(row: OaOfficialDocReceiveApi.OfficialDocReceive) {
  return (
    !!row.sendId &&
    !!row.creator &&
    row.handleStatus !== OaOfficialDocHandleStatus.WAIT_CLAIM
  );
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
          return await getOfficialDocReceivePage({
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
  } as VxeTableGridOptions<OaOfficialDocReceiveApi.OfficialDocReceive>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <DetailModal />

    <Grid table-title="公文收文列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['公文收文']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:officialdoc-receive:create'],
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
              label: '审批进度',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['oa:officialdoc-receive:query'],
              ifShow: !!row.processInstanceId,
              onClick: handleProcessDetail.bind(null, row),
            },
            {
              label: '签收',
              type: 'link',
              icon: ACTION_ICON.BOOK,
              auth: ['oa:officialdoc-receive:update'],
              ifShow: isClaimableRow(row),
              onClick: handleClaim.bind(null, row),
            },
            {
              label: '已签收',
              type: 'link',
              disabled: true,
              ifShow: isClaimedRow(row),
            },
            {
              label: '提交',
              type: 'link',
              icon: ACTION_ICON.AUDIT,
              auth: ['oa:officialdoc-receive:update'],
              ifShow: isEditableRow(row),
              onClick: handleSubmit.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['oa:officialdoc-receive:update'],
              ifShow: isEditableRow(row),
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '撤销',
              type: 'link',
              icon: ACTION_ICON.CLOSE,
              auth: ['oa:officialdoc-receive:update'],
              ifShow: isCancelableRow(row),
              onClick: handleCancel.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:officialdoc-receive:delete'],
              ifShow: isDeletableRow(row),
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
