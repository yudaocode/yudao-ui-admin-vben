<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaRegularApplyApi } from '#/api/oa/regular';

import { useRouter } from 'vue-router';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { message, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getRegularApplyPage,
  submitRegularApply,
} from '#/api/oa/regular';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'OaRegularApply' });

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

/** 创建转正申请 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 修改转正申请 */
function handleEdit(row: OaRegularApplyApi.RegularApply) {
  formModalApi.setData(row).open();
}

/** 查看转正申请详情 */
function handleDetail(row: OaRegularApplyApi.RegularApply) {
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
async function handleSubmit(row: OaRegularApplyApi.RegularApply) {
  await submitRegularApply(row.id!, {});
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
          return await getRegularApplyPage({
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
  } as VxeTableGridOptions<OaRegularApplyApi.RegularApply>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="【流程】考勤、请假、加班、转正与离职" url="https://doc.iocoder.cn/oa/attendance-application/" />
    <FormModal @success="handleRefresh" />
    <DetailModal />

    <Grid table-title="转正申请列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['转正申请']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:regular-apply:create'],
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
              auth: ['oa:regular-apply:create'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              popConfirm: {
                title: '确认提交申请？',
                confirm: handleSubmit.bind(null, row),
              },
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['oa:regular-apply:create'],
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
