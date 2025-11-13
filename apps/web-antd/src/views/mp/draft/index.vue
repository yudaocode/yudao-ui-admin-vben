<script lang="ts" setup>
import type { Article } from './modules/types';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import * as MpDraftApi from '#/api/mp/draft';
// DONE @hw：MpFreePublishApi 去掉，直接 import；参考别的模块哈；
import { submitFreePublish } from '#/api/mp/freePublish';
import { createEmptyNewsItem } from '#/views/mp/draft/modules/types';

import { useGridColumns, useGridFormSchema } from './data';
import DraftTableCell from './modules/draft-table.vue';
import Form from './modules/form.vue';

// DONE @hw：参考 tag/index.vue 放到 formValues.accountId;
// DONE @hw：看看这个 watch、provide 能不能简化掉；
defineOptions({ name: 'MpDraft' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 新增按钮操作 */
async function handleCreate() {
  const formValues = await gridApi.formApi.getValues();
  const accountId = formValues.accountId;
  if (!accountId) {
    message.warning('请先选择公众号');
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
  if (!accountId) {
    message.warning('请先选择公众号');
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
  // DONE @hw：看看能不能去掉 -1 的判断哈？
  if (!accountId) {
    message.warning('请先选择公众号');
    return;
  }
  await confirm(
    '你正在通过发布的方式发表内容。 发布不占用群发次数，一天可多次发布。' +
      '已发布内容不会推送给用户，也不会展示在公众号主页中。 ' +
      '发布后，你可以前往发表记录获取链接，也可以将发布内容添加到自定义菜单、自动回复、话题和页面模板中。',
  );
  const hideLoading = message.loading({
    content: '发布中...',
    duration: 0,
  });
  try {
    await submitFreePublish(accountId, row.mediaId);
    message.success('发布成功');
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 删除按钮操作 */
async function handleDelete(row: Article) {
  const formValues = await gridApi.formApi.getValues();
  const accountId = formValues.accountId;
  if (!accountId) {
    message.warning('请先选择公众号');
    return;
  }
  await confirm('此操作将永久删除该草稿, 是否继续?');
  const hideLoading = message.loading({
    content: '删除中...',
    duration: 0,
  });
  try {
    await MpDraftApi.deleteDraft(accountId, row.mediaId);
    message.success('删除成功');
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const drafts = await MpDraftApi.getDraftPage({
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

// DONE @hw：看看能不能参考 tag/index.vue 简化下
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="公众号图文" url="https://doc.iocoder.cn/mp/article/" />
    </template>

    <!-- DONE @hw：参考别的模块 @success 调用 refresh 方法； -->
    <FormModal @success="handleRefresh" />

    <Grid table-title="草稿列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['图文草稿']),
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
              type: 'link',
              icon: ACTION_ICON.UPLOAD,
              auth: ['mp:free-publish:submit'],
              onClick: handlePublish.bind(null, row),
            },
            {
              label: '编辑',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mp:draft:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
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
