<script lang="ts" setup>
import type { TabPaneName } from 'element-plus';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, nextTick, onMounted, ref } from 'vue';

import { ContentWrap, DocAlert, Page, useVbenModal } from '@vben/common-ui';

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
import Form from './modules/form.vue';
import ReplyContentCell from './modules/ReplyTable.vue';
import { MsgType } from './modules/types';

defineOptions({ name: 'MpAutoReply' });

const msgType = ref<MsgType>(MsgType.Keyword); // 消息类型
async function onTabChange(_tabName: TabPaneName) {
  // 等待 msgType 更新完成
  await nextTick();
  const columns = useGridColumns(msgType.value);
  if (columns) {
    // 使用 setGridOptions 更新列配置
    gridApi.setGridOptions({ columns });
    // 等待列配置更新完成
    await nextTick();
  }
  await gridApi.query();
  // 查询完成后更新数据长度
  updateTableDataLength();
}

/** 新增按钮操作 */
async function handleCreate() {
  const formValues = await gridApi.formApi.getValues();

  formModalApi
    .setData({
      isCreating: true,
      msgType: msgType.value,
      accountId: formValues.accountId,
    })
    .open();
}

/** 修改按钮操作 */
async function handleEdit(row: any) {
  const data = (await MpAutoReplyApi.getAutoReply(row.id)) as any;
  formModalApi
    .setData({ isCreating: false, msgType: msgType.value, row: data })
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
    await gridApi.query();
    // 查询完成后更新数据长度
    updateTableDataLength();
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
    columns: useGridColumns(msgType.value),
    height: 'calc(100vh - 300px)',
    // height: '600px',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await MpAutoReplyApi.getAutoReplyPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            type: msgType.value,
            ...formValues,
          });
        },
      },
      // 禁用自动加载，等表单初始化完成后再加载
      autoLoad: false,
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

// 表格数据长度，用于判断是否显示新增按钮
const tableDataLength = ref(0);

// 更新表格数据长度（避免在模板中直接调用 getTableData 导致响应式循环）
function updateTableDataLength() {
  try {
    if (!gridApi.grid) {
      return;
    }
    const tableData = gridApi.grid.getTableData();
    tableDataLength.value = tableData?.tableData?.length || 0;
  } catch {
    tableDataLength.value = 0;
  }
}

// 计算是否显示新增按钮：关注时回复类型只有在没有数据时才显示
const showCreateButton = computed(() => {
  if (msgType.value !== MsgType.Follow) {
    return true;
  }
  return tableDataLength.value <= 0;
});

// 页面挂载后，等待表单初始化完成再加载数据
onMounted(async () => {
  // 等待 WxAccountSelect 组件加载并设置默认值
  await nextTick();
  if (gridApi.formApi) {
    const formValues = await gridApi.formApi.getValues();
    // 如果 accountId 有值，说明已经准备好了
    if (formValues.accountId) {
      // 设置为最新提交的值
      gridApi.formApi.setLatestSubmissionValues(formValues);
      // 触发首次查询
      await gridApi.query();
      updateTableDataLength();
    }
  }
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="自动回复" url="https://doc.iocoder.cn/mp/auto-reply/" />
    </template>

    <!-- tab 切换 -->
    <ContentWrap>
      <ElTabs v-model="msgType" @tab-change="onTabChange">
        <!-- tab 项 -->
        <ElTabPane :name="MsgType.Follow">
          <template #label>
            <ElRow align="middle">
              <Icon icon="ep:star" class="mr-2px" /> 关注时回复
            </ElRow>
          </template>
        </ElTabPane>
        <ElTabPane :name="MsgType.Message">
          <template #label>
            <ElRow align="middle">
              <Icon icon="ep:chat-line-round" class="mr-2px" /> 消息回复
            </ElRow>
          </template>
        </ElTabPane>
        <ElTabPane :name="MsgType.Keyword">
          <template #label>
            <ElRow align="middle">
              <Icon icon="fa:newspaper-o" class="mr-2px" /> 关键词回复
            </ElRow>
          </template>
        </ElTabPane>
      </ElTabs>
      <!-- 列表 -->
      <FormModal
        @success="
          () => {
            gridApi.query().then(() => {
              updateTableDataLength();
            });
          }
        "
      />
      <Grid table-title="自动回复列表">
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
          <ReplyContentCell :row="row" />
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
    </ContentWrap>
  </Page>
</template>
