<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { BpmUserGroupApi } from '#/api/bpm/userGroup';
import type { SystemUserApi } from '#/api/system/user';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteUserGroup, getUserGroupPage } from '#/api/bpm/userGroup';
import { getSimpleUserList } from '#/api/system/user';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getUserGroupPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<BpmUserGroupApi.UserGroupVO>,
});

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<BpmUserGroupApi.UserGroupVO>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建用户分组 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑用户分组 */
function onEdit(row: BpmUserGroupApi.UserGroupVO) {
  formModalApi.setData(row).open();
}

/** 删除用户分组 */
async function onDelete(row: BpmUserGroupApi.UserGroupVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteUserGroup(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
      key: 'action_process_msg',
    });
    onRefresh();
  } catch {
    hideLoading();
  }
}

//
const userList = ref<SystemUserApi.User[]>([]);
/** 初始化 */
onMounted(async () => {
  // 加载用户列表
  userList.value = await getSimpleUserList();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="用户分组">
      <template #toolbar-tools>
        <Button
          type="primary"
          @click="onCreate"
          v-access:code="['bpm:category:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['用户分组']) }}
        </Button>
      </template>

      <template #userIds-cell="{ row }">
        <span
          v-for="(userId, index) in row.userIds"
          :key="userId"
          class="pr-5px"
        >
          {{ userList.find((user) => user.id === userId)?.nickname }}
          <span v-if="index < row.userIds.length - 1">、</span>
        </span>
      </template>
    </Grid>
  </Page>
</template>
