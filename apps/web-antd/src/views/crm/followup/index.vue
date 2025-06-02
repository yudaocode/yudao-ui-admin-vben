<script lang="ts" setup>
import type { FollowUpRecordApi, FollowUpRecordVO } from '@/api/crm/followup';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';

import { BizTypeEnum } from '@/api/crm/permission';
import { DICT_TYPE } from '@/utils/dict';
import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';

import FollowUpRecordForm from './modules/form.vue';

/** 跟进记录列表 */
defineOptions({ name: 'FollowUpRecord' });

const props = defineProps<{
  bizId: number;
  bizType: number;
}>();

const { push } = useRouter();

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 添加跟进记录 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 删除跟进记录 */
async function handleDelete(row: FollowUpRecordVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await FollowUpRecordApi.deleteFollowUpRecord(row.id);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
      key: 'action_key_msg',
    });
    onRefresh();
  } catch {
    hideLoading();
  }
}

/** 打开联系人详情 */
function openContactDetail(id: number) {
  push({ name: 'CrmContactDetail', params: { id } });
}

/** 打开商机详情 */
function openBusinessDetail(id: number) {
  push({ name: 'CrmBusinessDetail', params: { id } });
}

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: FollowUpRecordForm,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        field: 'createTime',
        title: '创建时间',
        width: 180,
        formatter: 'formatDateTime',
      },
      { field: 'creatorName', title: '跟进人' },
      {
        field: 'type',
        title: '跟进类型',
        cellRender: {
          name: 'CellDict',
          props: { type: DICT_TYPE.CRM_FOLLOW_UP_TYPE },
        },
      },
      { field: 'content', title: '跟进内容' },
      {
        field: 'nextTime',
        title: '下次联系时间',
        width: 180,
        formatter: 'formatDateTime',
      },
      {
        field: 'contacts',
        title: '关联联系人',
        visible: props.bizType === BizTypeEnum.CRM_CUSTOMER,
        slots: {
          default: ({ row }) =>
            row.contacts?.map((contact) =>
              h(
                Button,
                {
                  type: 'link',
                  onClick: () => openContactDetail(contact.id),
                },
                () => contact.name,
              ),
            ),
        },
      },
      {
        field: 'businesses',
        title: '关联商机',
        visible: props.bizType === BizTypeEnum.CRM_CUSTOMER,
        slots: {
          default: ({ row }) =>
            row.businesses?.map((business) =>
              h(
                Button,
                {
                  type: 'link',
                  onClick: () => openBusinessDetail(business.id),
                },
                () => business.name,
              ),
            ),
        },
      },
      {
        field: 'actions',
        title: '操作',
        width: 100,
        slots: { default: 'actions' },
      },
    ],
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await FollowUpRecordApi.getFollowUpRecordPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            bizType: props.bizType,
            bizId: props.bizId,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: { code: 'query' },
    },
  } as VxeTableGridOptions<FollowUpRecordVO>,
});

watch(
  () => props.bizId,
  () => {
    gridApi.query();
  },
);
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="跟进记录列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '写跟进',
              type: 'primary',
              icon: ACTION_ICON.EDIT,
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
    <FormModal @success="onRefresh" />
  </Page>
</template>
