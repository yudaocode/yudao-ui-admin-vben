<script lang="ts" setup>
import type { Article } from './modules/types';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage, ElMessageBox } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDraft, getDraftPage } from '#/api/mp/draft';
import * as MpFreePublishApi from '#/api/mp/freePublish';
import { WxAccountSelect } from '#/views/mp/components';
import { createEmptyNewsItem } from '#/views/mp/draft/modules/types';

import { useGridColumns, useGridFormSchema } from './data';
import DraftTableCell from './modules/draft-table.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'MpDraft' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 公众号变化时查询数据 */
function handleAccountChange(accountId: number) {
  gridApi.formApi.setValues({ accountId });
  gridApi.formApi.submitForm();
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
          const drafts = await getDraftPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
          // 将 thumbUrl 转成 picUrl，保证 wx-news 组件可以预览封面
          drafts.list.forEach((draft: any) => {
            const newsList = draft.content?.newsItem;
            if (newsList) {
              newsList.forEach((item: any) => {
                item.picUrl = item.thumbUrl || item.picUrl;
              });
            }
          });
          return {
            list: drafts.list as unknown as Article[],
            total: drafts.total,
          };
        },
      },
      autoLoad: false,
    },
    rowConfig: {
      keyField: 'mediaId',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<Article>,
});

/** 新增按钮操作 */
async function handleCreate() {
  const formValues = await gridApi.formApi.getValues();
  const accountId = formValues.accountId;
  if (!accountId || accountId === -1) {
    ElMessage.warning('请先选择公众号');
    return;
  }

  formModalApi
    .setData({
      isCreating: true,
      accountId,
      newsList: [createEmptyNewsItem()],
    })
    .open();
}

/** 修改按钮操作 */
async function handleEdit(row: Article) {
  const formValues = await gridApi.formApi.getValues();
  const accountId = formValues.accountId;
  if (!accountId || accountId === -1) {
    ElMessage.warning('请先选择公众号');
    return;
  }

  formModalApi
    .setData({
      isCreating: false,
      accountId,
      mediaId: row.mediaId,
      newsList: row.content.newsItem,
    })
    .open();
}

/** 发布按钮操作 */
async function handlePublish(row: Article) {
  const formValues = await gridApi.formApi.getValues();
  const accountId = formValues.accountId;
  if (!accountId || accountId === -1) {
    ElMessage.warning('请先选择公众号');
    return;
  }

  const content =
    '你正在通过发布的方式发表内容。 发布不占用群发次数，一天可多次发布。' +
    '已发布内容不会推送给用户，也不会展示在公众号主页中。 ' +
    '发布后，你可以前往发表记录获取链接，也可以将发布内容添加到自定义菜单、自动回复、话题和页面模板中。';
  try {
    await ElMessageBox.confirm(content);
    const loadingInstance = ElLoading.service({
      text: '发布中...',
    });
    try {
      await MpFreePublishApi.submitFreePublish(accountId, row.mediaId);
      ElMessage.success('发布成功');
      await gridApi.query();
    } finally {
      loadingInstance.close();
    }
  } catch {
    //
  }
}

/** 删除按钮操作 */
async function handleDelete(row: Article) {
  const formValues = await gridApi.formApi.getValues();
  const accountId = formValues.accountId;
  if (!accountId) {
    ElMessage.warning('请先选择公众号');
    return;
  }

  try {
    await ElMessageBox.confirm('此操作将永久删除该草稿, 是否继续?');
    const loadingInstance = ElLoading.service({
      text: '删除中...',
    });
    try {
      await deleteDraft(accountId, row.mediaId);
      ElMessage.success('删除成功');
      handleRefresh();
    } finally {
      loadingInstance.close();
    }
  } catch {
    //
  }
}
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="公众号图文" url="https://doc.iocoder.cn/mp/article/" />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="草稿列表">
      <template #form-accountId>
        <WxAccountSelect @change="handleAccountChange" />
      </template>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mp:draft:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #content="{ row }">
        <DraftTableCell :row="row" />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '发布',
              type: 'success',
              link: true,
              icon: ACTION_ICON.UPLOAD,
              auth: ['mp:free-publish:submit'],
              onClick: handlePublish.bind(null, row),
            },
            {
              label: '编辑',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['mp:draft:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '删除',
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mp:draft:delete'],
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

<style lang="scss" scoped>
:deep(.vxe-table--body-wrapper) {
  .vxe-table--body {
    .vxe-body--column {
      .vxe-cell {
        height: auto !important;
        padding: 0;

        img {
          width: 300px !important;
        }
      }
    }
  }
}
</style>
