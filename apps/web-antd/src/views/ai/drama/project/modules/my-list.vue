<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDramaProjectMy,
  getDramaProjectMyPage,
} from '#/api/ai/drama/project';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';

/** AI 短剧：我的项目 */
defineOptions({ name: 'AiDramaMyList' });

const emit = defineEmits<{
  create: []; // 进入新建页
  edit: [id: number]; // 进入项目表单
}>();

/** 搜索表单 */
function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '项目名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入项目名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '项目状态',
      component: 'Select',
      componentProps: {
        placeholder: '全部',
        allowClear: true,
        options: getDictOptions(DICT_TYPE.AI_DRAMA_PROJECT_STATUS, 'number'),
      },
    },
    {
      fieldName: 'composeStatus',
      label: '成片状态',
      component: 'Select',
      componentProps: {
        placeholder: '全部',
        allowClear: true,
        options: getDictOptions(DICT_TYPE.AI_DRAMA_STATUS, 'number'),
      },
    },
  ];
}

/** 列表的字段 */
function useColumns(): VxeTableGridOptions<AiDramaProjectApi.Project>['columns'] {
  return [
    {
      field: 'name',
      title: '项目名称',
      minWidth: 180,
      slots: { default: 'name' },
    },
    {
      field: 'style',
      title: '画风',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.AI_DRAMA_STYLE },
      },
    },
    {
      field: 'composeAspectRatio',
      title: '画幅',
      width: 80,
    },
    {
      field: 'status',
      title: '项目状态',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.AI_DRAMA_PROJECT_STATUS },
      },
    },
    {
      field: 'storyboardCount',
      title: '镜头视频',
      width: 100,
      formatter: ({ row }) =>
        `${row.storyboardSuccessCount} / ${row.storyboardCount}`,
    },
    {
      field: 'composeStatus',
      title: '成片',
      width: 100,
      slots: { default: 'compose' },
    },
    {
      field: 'updateTime',
      title: '更新时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 刷新表格 */
function getList() {
  gridApi.query();
}
defineExpose({ getList });

/** 删除项目 */
async function handleDelete(row: AiDramaProjectApi.Project) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteDramaProjectMy(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    getList();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useFormSchema(),
  },
  gridOptions: {
    columns: useColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getDramaProjectMyPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
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
  } as VxeTableGridOptions<AiDramaProjectApi.Project>,
});
</script>

<template>
  <Grid table-title="我的项目">
    <template #toolbar-tools>
      <TableAction
        :actions="[
          {
            label: '新建项目',
            type: 'primary',
            icon: ACTION_ICON.ADD,
            onClick: () => emit('create'),
          },
        ]"
      />
    </template>
    <template #name="{ row }">
      <a class="text-primary" @click="emit('edit', row.id)">{{ row.name }}</a>
    </template>
    <template #compose="{ row }">
      <DictTag
        v-if="row.composeStatus"
        :type="DICT_TYPE.AI_DRAMA_STATUS"
        :value="row.composeStatus"
      />
      <span v-else class="text-gray-500">未合成</span>
    </template>
    <template #actions="{ row }">
      <TableAction
        :actions="[
          {
            label: $t('common.edit'),
            type: 'link',
            icon: ACTION_ICON.EDIT,
            onClick: () => emit('edit', row.id),
          },
          {
            label: $t('common.delete'),
            type: 'link',
            danger: true,
            icon: ACTION_ICON.DELETE,
            popConfirm: {
              title: '删除后剧本、资产、分镜一并删除，是否继续？',
              confirm: handleDelete.bind(null, row),
            },
          },
        ]"
      />
    </template>
  </Grid>
</template>
