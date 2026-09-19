<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaNoteApi } from '#/api/oa/note';
import type { OaNoteCategoryApi } from '#/api/oa/note/category';

import { onMounted, ref, toRaw } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { isEmpty } from '@vben/utils';

import { ElButton, ElCard, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteNote,
  deleteReceivedNote,
  getMyNotePage,
  getReceivedNotePage,
  updateNoteFavorite,
} from '#/api/oa/note';
import { getNoteCategoryList } from '#/api/oa/note/category';
import { $t } from '#/locales';
import { OA_NOTE_SCENE_TYPE } from '#/views/oa/utils/constants';

import { useGridColumns, useGridFormSchema } from './data';
import CategoryList from './modules/category-list.vue';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';
import ShareForm from './modules/share-form.vue';
import Sidebar from './modules/sidebar.vue';

defineOptions({ name: 'OaNote' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

const [ShareFormModal, shareFormModalApi] = useVbenModal({
  connectedComponent: ShareForm,
  destroyOnClose: true,
});

const [CategoryListModal, categoryListModalApi] = useVbenModal({
  connectedComponent: CategoryList,
  destroyOnClose: true,
});

const activeScene = ref<number>(OA_NOTE_SCENE_TYPE.MINE); // 当前列表场景，不作为查询参数传递
const queryCategoryId = ref<number>(); // 左侧选中的目录编号
const queryType = ref<number>(); // 左侧选中的笔记类型
const categoryList = ref<OaNoteCategoryApi.NoteCategory[]>([]); // 笔记目录列表
const checkedIds = ref<number[]>([]); // 选中笔记编号

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查询笔记目录 */
async function getCategoryList() {
  categoryList.value = await getNoteCategoryList();
}

/** 同步笔记场景的筛选条件和表格列 */
function syncScene(scene: number) {
  activeScene.value = scene;
  // 共享笔记不使用本人的目录
  queryCategoryId.value = undefined;
  checkedIds.value = [];
  gridApi.setGridOptions({ columns: useGridColumns(scene) });
}

/** 切换笔记场景 */
function handleSceneChange(scene: number) {
  if (scene === activeScene.value) {
    return;
  }
  syncScene(scene);
  handleRefresh();
}

/** 切换左侧分类 */
function handleCategorySelect(index: string) {
  const categoryId = index === 'all' ? undefined : Number(index);
  if (
    categoryId !== undefined &&
    activeScene.value !== OA_NOTE_SCENE_TYPE.MINE
  ) {
    // 目录属于本人，选择目录时回到我的笔记；最近展示当前场景全部目录
    gridApi.formApi.setValues({ scene: OA_NOTE_SCENE_TYPE.MINE });
    syncScene(OA_NOTE_SCENE_TYPE.MINE);
  }
  queryCategoryId.value = categoryId;
  handleRefresh();
}

/** 切换左侧笔记类型 */
function handleTypeSelect(index: string) {
  queryType.value = index === 'all' ? undefined : Number(index);
  handleRefresh();
}

/** 创建笔记，带入列表当前选中的目录 */
function handleCreate() {
  formModalApi.setData({ categoryId: queryCategoryId.value }).open();
}

/** 编辑笔记 */
function handleEdit(row: OaNoteApi.Note) {
  formModalApi.setData(row).open();
}

/** 查看笔记详情 */
function handleDetail(row: OaNoteApi.Note) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 共享笔记 */
function handleShare(row: OaNoteApi.Note) {
  shareFormModalApi.setData({ id: row.id }).open();
}

/** 打开目录管理 */
function handleManageCategory() {
  categoryListModalApi.open();
}

/** 目录修改成功 */
async function handleCategoryChange() {
  await getCategoryList();
  queryCategoryId.value = undefined;
  handleRefresh();
}

/** 修改收藏状态 */
async function handleFavorite(row: OaNoteApi.Note) {
  if (!row.id) {
    return;
  }
  await updateNoteFavorite(row.id, !row.favorite);
  handleRefresh();
}

/** 表格多选变更 */
function handleRowCheckboxChange({ records }: { records: OaNoteApi.Note[] }) {
  checkedIds.value = records.map((item) => item.id!);
}

/** 批量删除本人笔记，单条失败不阻断其他条目 */
async function handleDeleteBatch() {
  const ids = [...checkedIds.value];
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deletingBatch'),
  });
  try {
    const results = await Promise.allSettled(ids.map((id) => deleteNote(id)));
    const successCount = results.filter(
      (result) => result.status === 'fulfilled',
    ).length;
    const failedCount = results.length - successCount;
    if (failedCount > 0) {
      ElMessage.warning(`删除成功 ${successCount} 条，失败 ${failedCount} 条`);
    } else {
      ElMessage.success(`删除成功 ${successCount} 条`);
    }
    checkedIds.value = [];
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 删除笔记 */
async function handleDelete(row: OaNoteApi.Note) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.title]),
  });
  try {
    await deleteNote(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.title]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 移除收到的共享笔记 */
async function handleDeleteReceived(row: OaNoteApi.Note) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.title]),
  });
  try {
    await deleteReceivedNote(row.id!);
    ElMessage.success('移除成功');
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    /** 切换笔记场景时同步筛选条件和表格列 */
    handleValuesChange(values, changedFields) {
      if (changedFields.includes('scene')) {
        handleSceneChange(values.scene);
      }
    },
    /** 重置时同时清空左侧目录和类型筛选 */
    handleReset: async () => {
      await gridApi.formApi.reset();
      queryCategoryId.value = undefined;
      queryType.value = undefined;
      const formValues = await gridApi.formApi.getValues();
      syncScene(formValues.scene);
      gridApi.formApi.setLatestSubmissionValues(toRaw(formValues));
      gridApi.reload(formValues);
    },
  },
  gridOptions: {
    columns: useGridColumns(OA_NOTE_SCENE_TYPE.MINE),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          // 刷新后清空勾选，避免残留上一页的选中项
          checkedIds.value = [];
          const { scene, ...params } = formValues;
          const getPage =
            scene === OA_NOTE_SCENE_TYPE.SHARED
              ? getReceivedNotePage
              : getMyNotePage;
          return await getPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...params,
            categoryId: queryCategoryId.value,
            type: queryType.value,
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
  } as VxeTableGridOptions<OaNoteApi.Note>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

/** 初始化 */
onMounted(() => {
  getCategoryList();
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="【协作】公告、讨论、通讯录与笔记" url="https://doc.iocoder.cn/oa/collaboration/communication/" />
    <FormModal @success="handleRefresh" />
    <DetailModal />
    <ShareFormModal @success="handleRefresh" />
    <CategoryListModal @success="handleCategoryChange" />

    <div class="flex h-full w-full">
      <!-- 左侧分类和类型导航 -->
      <ElCard class="mr-4 h-full w-52 shrink-0 overflow-auto">
        <Sidebar
          :categories="categoryList"
          :category-id="queryCategoryId"
          :type="queryType"
          @category-select="handleCategorySelect"
          @type-select="handleTypeSelect"
          @manage="handleManageCategory"
        />
      </ElCard>
      <!-- 右侧笔记列表 -->
      <div class="h-full min-w-0 flex-1">
        <Grid table-title="笔记列表">
          <template #toolbar-tools>
            <TableAction
              :actions="[
                {
                  label: $t('ui.actionTitle.create', ['笔记']),
                  type: 'primary',
                  icon: ACTION_ICON.ADD,
                  auth: ['oa:note:create'],
                  onClick: handleCreate,
                },
                {
                  label: $t('ui.actionTitle.deleteBatch'),
                  type: 'danger',
                  icon: ACTION_ICON.DELETE,
                  disabled: isEmpty(checkedIds),
                  auth: ['oa:note:delete'],
                  ifShow: () => activeScene === OA_NOTE_SCENE_TYPE.MINE,
                  popConfirm: {
                    title: `确认处理选中的 ${checkedIds.length} 条笔记？共享笔记仅退出本人访问，其他笔记将被删除。`,
                    confirm: handleDeleteBatch,
                  },
                },
              ]"
            />
          </template>
          <template #favorite="{ row }">
            <ElButton
              link
              :type="row.favorite ? 'warning' : 'info'"
              @click="handleFavorite(row)"
            >
              {{ row.favorite ? '已收藏' : '收藏' }}
            </ElButton>
          </template>
          <template #title="{ row }">
            <span class="cursor-pointer text-primary" @click="handleDetail(row)">
              {{ row.title }}
            </span>
          </template>
          <template #receiverUserNames="{ row }">
            {{ row.receiverUserNames?.join('、') || '-' }}
          </template>
          <template #actions="{ row }">
            <TableAction
              v-if="activeScene === OA_NOTE_SCENE_TYPE.MINE"
              :actions="[
                {
                  label: $t('common.edit'),
                  type: 'primary',
                  link: true,
                  icon: ACTION_ICON.EDIT,
                  auth: ['oa:note:update'],
                  onClick: handleEdit.bind(null, row),
                },
                {
                  label: $t('common.delete'),
                  type: 'danger',
                  link: true,
                  icon: ACTION_ICON.DELETE,
                  auth: ['oa:note:delete'],
                  popConfirm: {
                    title:
                      '共享笔记仅退出本人访问，其他接收人仍可查看；非共享笔记将被删除，是否继续？',
                    confirm: handleDelete.bind(null, row),
                  },
                },
                {
                  label: '共享',
                  type: 'primary',
                  link: true,
                  auth: ['oa:note:update'],
                  onClick: handleShare.bind(null, row),
                },
              ]"
            />
            <TableAction
              v-else
              :actions="[
                {
                  label: '移除',
                  type: 'danger',
                  link: true,
                  icon: ACTION_ICON.DELETE,
                  popConfirm: {
                    title: '确认移除这条共享笔记？笔记正文和其他接收人不受影响。',
                    confirm: handleDeleteReceived.bind(null, row),
                  },
                },
              ]"
            />
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
