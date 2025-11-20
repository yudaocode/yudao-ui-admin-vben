<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MpDraftApi } from '#/api/mp/draft';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { createEmptyNewsItem, deleteDraft, getDraftPage } from '#/api/mp/draft';
import { submitFreePublish } from '#/api/mp/freePublish';
import { WxAccountSelect } from '#/views/mp/components';

import { useGridColumns, useGridFormSchema } from './data';
import DraftTableCell from './modules/draft-table.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'MpDraft' });

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 公众号变化时查询数据 */
function handleAccountChange(accountId: number) {
  gridApi.formApi.setValues({ accountId });
  gridApi.formApi.submitForm();
}

/** 新增草稿 */
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

/** 修改草稿 */
async function handleEdit(row: MpDraftApi.DraftArticle) {
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

/** 删除草稿 */
async function handleDelete(row: MpDraftApi.DraftArticle) {
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
    await deleteDraft(accountId, row.mediaId);
    message.success('删除成功');
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 发布草稿 */
async function handlePublish(row: MpDraftApi.DraftArticle) {
  const formValues = await gridApi.formApi.getValues();
  const accountId = formValues.accountId;
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

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

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
            list: drafts.list as unknown as MpDraftApi.DraftArticle[],
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
  } as VxeTableGridOptions<MpDraftApi.DraftArticle>,
});
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
              label: $t('ui.actionTitle.create', ['图文草稿']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mp:draft:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <!-- TODO @hw：按照微信群沟通的，换下卡片的样式。 -->
      <template #content="{ row }">
        <DraftTableCell :row="row" />
        <!-- TODO @hw：增加一列，更新时间。 -->
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
