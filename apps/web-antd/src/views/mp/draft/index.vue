<script lang="ts" setup>
import type { Article } from './components/types';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { nextTick, onMounted, provide, ref, watch } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import * as MpDraftApi from '#/api/mp/draft';
import * as MpFreePublishApi from '#/api/mp/freePublish';
import { createEmptyNewsItem } from '#/views/mp/draft/components/types';

import DraftTableCell from './components/draft-table.vue';
import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'MpDraft' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

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
          // 更新 accountId
          if (formValues?.accountId) {
            accountId.value = formValues.accountId;
          }
          const drafts = await MpDraftApi.getDraftPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
          // 处理 API 返回的数据，兼容不同的数据结构
          const formattedList: Article[] = drafts.list.map((draft: any) => {
            // 如果已经是 content.newsItem 格式，直接使用
            if (draft.content?.newsItem) {
              const newsItem = draft.content.newsItem.map((item: any) => ({
                ...item,
                picUrl: item.thumbUrl || item.picUrl,
              }));
              return {
                mediaId: draft.mediaId,
                content: {
                  newsItem,
                },
                updateTime:
                  draft.updateTime ||
                  (draft.createTime
                    ? new Date(draft.createTime).getTime()
                    : Date.now()),
              };
            }
            // 如果是 articles 格式，转换为 content.newsItem 格式
            if (draft.articles) {
              const newsItem = draft.articles.map((article: any) => ({
                ...article,
                thumbUrl: article.thumbUrl || article.thumbMediaId,
                picUrl: article.thumbUrl || article.thumbMediaId,
              }));
              return {
                mediaId: draft.mediaId,
                content: {
                  newsItem,
                },
                updateTime:
                  draft.updateTime ||
                  (draft.createTime
                    ? new Date(draft.createTime).getTime()
                    : Date.now()),
              };
            }
            // 默认返回空结构
            return {
              mediaId: draft.mediaId || '',
              content: {
                newsItem: [],
              },
              updateTime: draft.updateTime || Date.now(),
            };
          });
          return {
            page: {
              total: drafts.total,
            },
            result: formattedList,
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

// 提供 accountId 给子组件
const accountId = ref<number>(-1);

// 监听表单提交，更新 accountId
watch(
  () => gridApi.formApi?.getLatestSubmissionValues?.()?.accountId,
  (newAccountId) => {
    if (newAccountId !== undefined) {
      accountId.value = newAccountId;
    }
  },
);

provide('accountId', accountId);

/** 新增按钮操作 */
async function handleCreate() {
  const formValues = await gridApi.formApi.getValues();
  const accountId = formValues.accountId;
  if (!accountId || accountId === -1) {
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
  if (!accountId || accountId === -1) {
    message.warning('请先选择公众号');
    return;
  }

  formModalApi
    .setData({
      isCreating: false,
      accountId,
      mediaId: row.mediaId,
      newsList: structuredClone(row.content.newsItem),
    })
    .open();
}

/** 发布按钮操作 */
async function handlePublish(row: Article) {
  const formValues = await gridApi.formApi.getValues();
  const accountId = formValues.accountId;
  if (!accountId || accountId === -1) {
    message.warning('请先选择公众号');
    return;
  }

  const content =
    '你正在通过发布的方式发表内容。 发布不占用群发次数，一天可多次发布。' +
    '已发布内容不会推送给用户，也不会展示在公众号主页中。 ' +
    '发布后，你可以前往发表记录获取链接，也可以将发布内容添加到自定义菜单、自动回复、话题和页面模板中。';
  try {
    await confirm(content);
    const hideLoading = message.loading({
      content: '发布中...',
      duration: 0,
    });
    try {
      await MpFreePublishApi.submitFreePublish(accountId, row.mediaId);
      message.success('发布成功');
      await gridApi.query();
    } finally {
      hideLoading();
    }
  } catch {
    //
  }
}

/** 删除按钮操作 */
async function handleDelete(row: Article) {
  const formValues = await gridApi.formApi.getValues();
  const accountId = formValues.accountId;
  if (!accountId || accountId === -1) {
    message.warning('请先选择公众号');
    return;
  }

  try {
    await confirm('此操作将永久删除该草稿, 是否继续?');
    const hideLoading = message.loading({
      content: '删除中...',
      duration: 0,
    });
    try {
      await MpDraftApi.deleteDraft(accountId, row.mediaId);
      message.success('删除成功');
      await gridApi.query();
    } finally {
      hideLoading();
    }
  } catch {
    //
  }
}

// 页面挂载后，等待表单初始化完成再加载数据
onMounted(async () => {
  await nextTick();
  if (gridApi.formApi) {
    const formValues = await gridApi.formApi.getValues();
    if (formValues.accountId) {
      accountId.value = formValues.accountId;
      gridApi.formApi.setLatestSubmissionValues(formValues);
      await gridApi.query();
    }
  }
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="公众号图文" url="https://doc.iocoder.cn/mp/article/" />

    <FormModal
      @success="
        () => {
          gridApi.query();
        }
      "
    />

    <Grid table-title="草稿列表">
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
        padding: 0;
      }
    }
  }
}
</style>
