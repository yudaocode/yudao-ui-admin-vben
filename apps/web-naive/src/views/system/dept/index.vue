<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemUserApi } from '#/api/system/user';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDept, getDeptList } from '#/api/system/dept';
import { getSimpleUserList } from '#/api/system/user';
import { $t } from '#/locales';

import { useGridColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const userList = ref<SystemUserApi.User[]>([]);

/** 获取负责人名称 */
const getLeaderName = (userId: number) => {
  return userList.value.find((user) => user.id === userId)?.nickname;
};

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 切换树形展开/收缩状态 */
const isExpanded = ref(true);
function toggleExpand() {
  isExpanded.value = !isExpanded.value;
  gridApi.grid.setAllTreeExpand(isExpanded.value);
}

/** 创建部门 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 添加下级部门 */
function onAppend(row: SystemDeptApi.Dept) {
  formModalApi.setData({ parentId: row.id }).open();
}

/** 编辑部门 */
function onEdit(row: SystemDeptApi.Dept) {
  formModalApi.setData(row).open();
}

/** 删除部门 */
async function onDelete(row: SystemDeptApi.Dept) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteDept(row.id as number);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } catch {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<SystemDeptApi.Dept>) {
  switch (code) {
    case 'append': {
      onAppend(row);
      break;
    }
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

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(onActionClick, getLeaderName),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (_params) => {
          return await getDeptList();
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
    },
    treeConfig: {
      parentField: 'parentId',
      rowField: 'id',
      transform: true,
      expandAll: true,
      reserve: true,
    },
  } as VxeTableGridOptions,
});

/** 初始化 */
onMounted(async () => {
  userList.value = await getSimpleUserList();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="部门列表">
      <template #toolbar-tools>
        <NButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:dept:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['部门']) }}
        </NButton>
        <NButton class="ml-2" @click="toggleExpand">
          {{ isExpanded ? '收缩' : '展开' }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
