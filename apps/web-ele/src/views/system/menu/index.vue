<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemMenuApi } from '#/api/system/menu';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteMenu, getMenuList } from '#/api/system/menu';
import { $t } from '#/locales';
import { SystemMenuTypeEnum } from '#/utils';

import { useGridColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建菜单 */
function onCreate() {
  formModalApi.setData({}).open();
}

/** 添加下级菜单 */
function onAppend(row: SystemMenuApi.Menu) {
  formModalApi.setData({ pid: row.id }).open();
}

/** 编辑菜单 */
function onEdit(row: SystemMenuApi.Menu) {
  formModalApi.setData(row).open();
}

/** 删除菜单 */
async function onDelete(row: SystemMenuApi.Menu) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteMenu(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<SystemMenuApi.Menu>) {
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

/** 切换树形展开/收缩状态 */
const isExpanded = ref(false);
function toggleExpand() {
  isExpanded.value = !isExpanded.value;
  gridApi.grid.setAllTreeExpand(isExpanded.value);
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (_params) => {
          return await getMenuList();
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
      reserve: true,
    },
  } as VxeTableGridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="功能权限"
        url="https://doc.iocoder.cn/resource-permission"
      />
      <DocAlert title="菜单路由" url="https://doc.iocoder.cn/vue3/route/" />
    </template>

    <FormModal @success="onRefresh" />
    <Grid>
      <template #toolbar-tools>
        <ElButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:menu:create']"
        >
          <Plus class="mr-2 size-5" />
          {{ $t('ui.actionTitle.create', ['菜单']) }}
        </ElButton>
        <ElButton class="ml-2" @click="toggleExpand">
          {{ isExpanded ? '收缩' : '展开' }}
        </ElButton>
      </template>
      <template #name="{ row }">
        <div class="flex w-full items-center gap-1">
          <div class="size-5 flex-shrink-0">
            <IconifyIcon
              v-if="row.type === SystemMenuTypeEnum.BUTTON"
              icon="carbon:square-outline"
              class="size-full"
            />
            <IconifyIcon
              v-else-if="row.icon"
              :icon="row.icon || 'carbon:circle-dash'"
              class="size-full"
            />
          </div>
          <span class="flex-auto">{{ $t(row.name) }}</span>
          <div class="items-center justify-end"></div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
