<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaOfficialDocSendApi } from '#/api/oa/officialdoc/send';

import { useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { ElLoading, ElMessage, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelOfficialDocSend,
  deleteOfficialDocSend,
  getOfficialDocSendPage,
  submitOfficialDocSend,
} from '#/api/oa/officialdoc/send';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'OaOfficialDocSend' });

const router = useRouter();

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

/** 创建公文发文 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑公文发文 */
function handleEdit(row: OaOfficialDocSendApi.OfficialDocSend) {
  formModalApi.setData({ id: row.id }).open();
}

/** 查看公文发文详情 */
function handleDetail(row: OaOfficialDocSendApi.OfficialDocSend) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 删除公文发文 */
async function handleDelete(row: OaOfficialDocSendApi.OfficialDocSend) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.id]),
  });
  try {
    await deleteOfficialDocSend(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 提交审批 */
async function handleSubmit(row: OaOfficialDocSendApi.OfficialDocSend) {
  try {
    await confirm('确认提交当前公文？');
  } catch {
    return;
  }
  await submitOfficialDocSend(row.id!);
  ElMessage.success('提交成功');
  handleRefresh();
}

/** 撤销审批 */
async function handleCancel(row: OaOfficialDocSendApi.OfficialDocSend) {
  try {
    await confirm('确认撤销审批吗？');
  } catch {
    return;
  }
  await cancelOfficialDocSend(row.id!);
  ElMessage.success('撤销成功');
  handleRefresh();
}

/** 查看审批进度 */
function handleProcessDetail(row: OaOfficialDocSendApi.OfficialDocSend) {
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
          return await getOfficialDocSendPage({
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
  } as VxeTableGridOptions<OaOfficialDocSendApi.OfficialDocSend>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <DetailModal />

    <Grid table-title="公文发文列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['公文发文']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:officialdoc-send:create'],
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
              label: '审批进度',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['oa:officialdoc-send:query'],
              ifShow: !!row.processInstanceId,
              onClick: handleProcessDetail.bind(null, row),
            },
            {
              label: '提交',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.AUDIT,
              auth: ['oa:officialdoc-send:update'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              onClick: handleSubmit.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['oa:officialdoc-send:update'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '撤销',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.CLOSE,
              auth: ['oa:officialdoc-send:update'],
              ifShow: row.status === BpmProcessInstanceStatus.RUNNING,
              onClick: handleCancel.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:officialdoc-send:delete'],
              ifShow: [
                BpmProcessInstanceStatus.CANCEL,
                BpmProcessInstanceStatus.NOT_START,
                BpmProcessInstanceStatus.REJECT,
              ].includes(row.status!),
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
