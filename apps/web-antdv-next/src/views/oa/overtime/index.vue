<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaOvertimeApi } from '#/api/oa/overtime';

import { useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { message, Tag } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getOvertimeApplyPage,
  submitOvertimeApply,
} from '#/api/oa/overtime';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'OaOvertimeApply' });

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

/** 创建加班申请 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 修改加班申请 */
function handleEdit(row: OaOvertimeApi.OvertimeApply) {
  formModalApi.setData(row).open();
}

/** 查看加班申请详情 */
function handleDetail(row: OaOvertimeApi.OvertimeApply) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 查看审批进度 */
function handleProcessDetail(processInstanceId?: string) {
  if (!processInstanceId) {
    return;
  }
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: processInstanceId },
  });
}

/** 提交审批 */
async function handleSubmit(row: OaOvertimeApi.OvertimeApply) {
  try {
    await confirm('确认提交申请？');
  } catch {
    return;
  }
  await submitOvertimeApply(row.id!, {});
  message.success('提交成功');
  handleRefresh();
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
          return await getOvertimeApplyPage({
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
  } as VxeTableGridOptions<OaOvertimeApi.OvertimeApply>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <DetailModal />

    <Grid table-title="加班申请列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['加班申请']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:overtime-apply:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #title="{ row }">
        <span class="cursor-pointer text-primary" @click="handleDetail(row)">
          {{ row.title }}
        </span>
      </template>
      <template #status="{ row }">
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
              label: '提交',
              type: 'link',
              auth: ['oa:overtime-apply:create'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              onClick: handleSubmit.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['oa:overtime-apply:create'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '审批进度',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              ifShow: !!row.processInstanceId,
              onClick: handleProcessDetail.bind(null, row.processInstanceId),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
