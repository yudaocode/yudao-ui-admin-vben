<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmRecruitChannelApi } from '#/api/hrm/recruit/channel';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { message, Tag } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getRecruitChannelPage,
  updateRecruitChannelStatus,
} from '#/api/hrm/recruit/channel';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import DeleteForm from './modules/delete-form.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'HrmRecruitChannel' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const [DeleteModal, deleteModalApi] = useVbenModal({
  connectedComponent: DeleteForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 新增 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑 */
function handleEdit(row: HrmRecruitChannelApi.RecruitChannel) {
  formModalApi.setData(row).open();
}

/** 删除 */
function handleDelete(row: HrmRecruitChannelApi.RecruitChannel) {
  deleteModalApi.setData(row).open();
}

/** 状态切换 */
async function handleStatusChange(
  newStatus: number,
  row: HrmRecruitChannelApi.RecruitChannel,
): Promise<boolean | undefined> {
  try {
    await confirm(
      `确认要${getDictLabel(DICT_TYPE.COMMON_STATUS, newStatus)}招聘渠道"${row.name}"吗？`,
    );
  } catch {
    return false;
  }
  await updateRecruitChannelStatus({ id: row.id!, status: newStatus });
  message.success($t('ui.actionMessage.operationSuccess'));
  return true;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(handleStatusChange),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getRecruitChannelPage({
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
  } as VxeTableGridOptions<HrmRecruitChannelApi.RecruitChannel>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【招聘】招聘管理"
        url="https://doc.iocoder.cn/hrm/recruit/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <DeleteModal @success="handleRefresh" />

    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['hrm:recruit:channel:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #systemFlag="{ row }">
        <Tag :color="row.systemFlag ? 'success' : 'default'">
          {{ row.systemFlag ? '是' : '否' }}
        </Tag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['hrm:recruit:channel:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['hrm:recruit:channel:delete'],
              ifShow: !row.systemFlag,
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
