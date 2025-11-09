<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, nextTick, onMounted, ref } from 'vue';

import {
  confirm,
  ContentWrap,
  DocAlert,
  Page,
  useVbenModal,
} from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, Row, Tabs } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import * as MpAutoReplyApi from '#/api/mp/autoReply';
import { $t } from '#/locales';

import ReplyContentCell from './components/ReplyTable.vue';
import { MsgType } from './components/types';
import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

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
  updateTableDataLength();
}

/** 新增按钮操作 */
async function handleCreate() {
  const formValues = await gridApi.formApi.getValues();
  formModalApi
    .setData({
      isCreating: true,
      msgType: Number(msgType.value) as MsgType,
      accountId: formValues.accountId,
    })
    .open();
}

/** 修改按钮操作 */
async function handleEdit(row: any) {
  const data = (await MpAutoReplyApi.getAutoReply(row.id)) as any;
  formModalApi
    .setData({
      isCreating: false,
      msgType: Number(msgType.value) as MsgType,
      row: data,
    })
    .open();
}

/** 删除按钮操作 */
async function handleDelete(row: any) {
  await confirm('是否确认删除此数据?');
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', ['自动回复']),
    duration: 0,
  });
  try {
    await MpAutoReplyApi.deleteAutoReply(row.id);
    message.success('删除成功');
    await gridApi.query();
    // 查询完成后更新数据长度
    updateTableDataLength();
  } finally {
    hideLoading();
  }
}

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true, // 表单值变化时自动提交，这样 accountId 会被正确传递到查询函数
  },
  gridOptions: {
    columns: useGridColumns(Number(msgType.value) as MsgType),
    height: 'calc(100vh - 300px)',
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
      autoLoad: false, // 禁用自动加载，等表单初始化完成后再加载
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

// TODO @hw：按道理说，不太需呀哦这个？可以微信讨论下哈；
const tableDataLength = ref(0); // 表格数据长度，用于判断是否显示新增按钮

/** 更新表格数据长度（避免在模板中直接调用 getTableData 导致响应式循环） */
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

// TODO @hw：这个要不改成，直接 tableaction 那判断；
// 计算是否显示新增按钮：关注时回复类型只有在没有数据时才显示
const showCreateButton = computed(() => {
  if (Number(msgType.value) !== MsgType.Follow) {
    return true;
  }
  return tableDataLength.value <= 0;
});

// TODO @hw：看看能不能参考 tag/index.vue 简化下
/** 页面挂载后，等待表单初始化完成再加载数据 */
onMounted(async () => {
  // 等待 WxAccountSelect 组件加载并设置默认值
  await nextTick();
  if (!gridApi.formApi) {
    return;
  }
  const formValues = await gridApi.formApi.getValues();
  // 如果 accountId 有值，说明已经准备好了
  if (formValues.accountId) {
    // 设置为最新提交的值
    gridApi.formApi.setLatestSubmissionValues(formValues);
    // 触发首次查询
    await gridApi.query();
    updateTableDataLength();
  }
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="自动回复" url="https://doc.iocoder.cn/mp/auto-reply/" />

    <!-- tab 切换 -->
    <!-- TODO @hw：貌似 tabs 里面套 table 的样式在 vben 里有点丑，要不我们按照 /Users/yunai/Java/yudao-ui-admin-vben-v5/apps/web-antd/src/views/mall/trade/afterSale/index.vue：1）第一层是公众号的选择；2）第二层是 tab；3）第三层是 table -->
    <ContentWrap>
      <Tabs
        v-model:active-key="msgType"
        @change="(activeKey) => onTabChange(activeKey as string)"
      >
        <!-- tab 项 -->
        <Tabs.TabPane :key="String(MsgType.Follow)">
          <template #tab>
            <Row align="middle">
              <IconifyIcon icon="ep:star" class="mr-2px" /> 关注时回复
            </Row>
          </template>
        </Tabs.TabPane>
        <Tabs.TabPane :key="String(MsgType.Message)">
          <template #tab>
            <Row align="middle">
              <IconifyIcon icon="ep:chat-line-round" class="mr-2px" /> 消息回复
            </Row>
          </template>
        </Tabs.TabPane>
        <Tabs.TabPane :key="String(MsgType.Keyword)">
          <template #tab>
            <Row align="middle">
              <IconifyIcon icon="fa:newspaper-o" class="mr-2px" /> 关键词回复
            </Row>
          </template>
        </Tabs.TabPane>
      </Tabs>
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
                type: 'link',
                icon: ACTION_ICON.EDIT,
                auth: ['mp:auto-reply:update'],
                onClick: handleEdit.bind(null, row),
              },
              {
                label: $t('common.delete'),
                type: 'link',
                danger: true,
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
