<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, nextTick, ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ElLoading,
  ElMessage,
  ElMessageBox,
  ElRow,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import * as MpAutoReplyApi from '#/api/mp/autoReply';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Content from './modules/content.vue';
import Form from './modules/form.vue';
import { MsgType } from './modules/types';

defineOptions({ name: 'MpAutoReply' });

const msgType = ref<string>(String(MsgType.Keyword)); // 消息类型
/** 切换回复类型 */
async function onTabChange(tabName: string) {
  msgType.value = tabName;
  await nextTick();
  // 更新 columns
  const columns = useGridColumns(Number(msgType.value) as MsgType);
  if (columns) {
    // 使用 setGridOptions 更新列配置
    gridApi.setGridOptions({ columns });
    // 等待列配置更新完成
    await nextTick();
  }
  // 查询数据
  await gridApi.query();
}

/** 新增按钮操作 */
async function handleCreate() {
  const formValues = await gridApi.formApi.getValues();

  formModalApi
    .setData({
      msgType: msgType.value,
      accountId: formValues.accountId,
    })
    .open();
}

/** 修改按钮操作 */
async function handleEdit(row: any) {
  const data = (await MpAutoReplyApi.getAutoReply(row.id)) as any;
  const formValues = await gridApi.formApi.getValues();
  formModalApi
    .setData({
      msgType: msgType.value,
      row: data,
      accountId: formValues.accountId,
    })
    .open();
}

/** 删除按钮操作 */
async function handleDelete(row: any) {
  await ElMessageBox.confirm('是否确认删除此数据?');
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', ['自动回复']),
  });
  try {
    await MpAutoReplyApi.deleteAutoReply(row.id);
    ElMessage.success('删除成功');
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    // 表单值变化时自动提交，这样 accountId 会被正确传递到查询函数
    submitOnChange: true,
  },
  gridOptions: {
    columns: useGridColumns(Number(msgType.value) as MsgType),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await MpAutoReplyApi.getAutoReplyPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            type: Number(msgType.value) as MsgType,
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
  } as VxeTableGridOptions<any>,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

// 计算是否显示新增按钮：关注时回复类型只有在没有数据时才显示
const showCreateButton = computed(() => {
  if (Number(msgType.value) !== MsgType.Follow) {
    return true;
  }
  try {
    const tableData = gridApi.grid?.getTableData();
    return (tableData?.tableData?.length || 0) <= 0;
  } catch {
    return true;
  }
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="自动回复" url="https://doc.iocoder.cn/mp/auto-reply/" />
    </template>

    <FormModal @success="handleRefresh" />
    <Grid table-title="自动回复列表">
      <!-- 在工具栏上方放置 Tab 切换 -->
      <template #toolbar-actions>
        <ElTabs
          v-model="msgType"
          class="w-full"
          @tab-change="(activeName) => onTabChange(activeName as string)"
        >
          <ElTabPane :name="String(MsgType.Follow)">
            <template #label>
              <ElRow align="middle">
                <IconifyIcon icon="ep:star" class="mr-[2px]" /> 关注时回复
              </ElRow>
            </template>
          </ElTabPane>
          <ElTabPane :name="String(MsgType.Message)">
            <template #label>
              <ElRow align="middle">
                <IconifyIcon icon="ep:chat-line-round" class="mr-[2px]" />
                消息回复
              </ElRow>
            </template>
          </ElTabPane>
          <ElTabPane :name="String(MsgType.Keyword)">
            <template #label>
              <ElRow align="middle">
                <IconifyIcon icon="fa:newspaper-o" class="mr-[2px]" />
                关键词回复
              </ElRow>
            </template>
          </ElTabPane>
        </ElTabs>
      </template>
      <!-- 工具栏按钮 -->
      <template #toolbar-tools>
        <TableAction
          v-if="showCreateButton"
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['自动回复']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mp:auto-reply:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #replyContent="{ row }">
        <Content :row="row" />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['mp:auto-reply:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mp:auto-reply:delete'],
              popConfirm: {
                title: '是否确认删除此数据?',
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
