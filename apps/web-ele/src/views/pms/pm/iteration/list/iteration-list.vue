<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsIterationApi } from '#/api/pms/pm/iteration';

import { useRouter } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';

import { ElButton, ElMessage, ElProgress } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  completeIteration,
  deleteIteration,
  getIterationPage,
} from '#/api/pms/pm/iteration';
import { PmsIterationStatus } from '#/views/pms/pm/utils/constants';

import { useGridColumns, useGridFormSchema } from './data';
import IterationForm from './modules/form.vue';
import IterationStartForm from './modules/start-form.vue';

defineOptions({ name: 'PmsIterationList' });

const props = defineProps<{
  editable: boolean;
  projectId: number;
}>();

const { push } = useRouter(); // 路由操作

const [IterationFormModal, iterationFormModalApi] = useVbenModal({
  connectedComponent: IterationForm,
  destroyOnClose: true,
});
const [IterationStartFormModal, iterationStartFormModalApi] = useVbenModal({
  destroyOnClose: true,
  connectedComponent: IterationStartForm,
});

/** 打开迭代详情 */
function openDetail(iteration: PmsIterationApi.Iteration) {
  push({
    name: 'PmsIterationDetail',
    params: {
      id: iteration.id,
    },
  });
}

/** 新建迭代 */
function handleCreate() {
  iterationFormModalApi
    .setData({ formType: 'create', projectId: props.projectId })
    .open();
}

/** 编辑迭代 */
function handleEdit(iteration: PmsIterationApi.Iteration) {
  iterationFormModalApi
    .setData({
      formType: 'update',
      id: iteration.id,
      projectId: props.projectId,
    })
    .open();
}

/** 完成迭代 */
async function handleComplete(iteration: PmsIterationApi.Iteration) {
  await completeIteration(iteration.id!);
  ElMessage.success('迭代已完成');
  handleRefresh();
}

/** 删除迭代 */
async function handleDelete(iteration: PmsIterationApi.Iteration) {
  await deleteIteration(iteration.id!);
  ElMessage.success('删除成功');
  handleRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnEnter: true,
  },
  gridOptions: {
    columns: useGridColumns(props.editable),
    height: 600,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getIterationPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            projectId: props.projectId,
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
  } as VxeTableGridOptions<PmsIterationApi.Iteration>,
  gridEvents: {
    cellClick: ({ row }: { row: PmsIterationApi.Iteration }) => {
      openDetail(row);
    },
  },
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

defineExpose({ refresh: handleRefresh });
</script>

<template>
  <div>
    <!-- 迭代列表 -->
    <Grid class="[&_.vxe-body--row]:cursor-pointer">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新建迭代',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['pms:pm:iteration:create'],
              ifShow: () => editable,
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #id="{ row }"> #{{ row.id }} </template>
      <template #name="{ row }">
        <ElButton link type="primary" @click.stop="openDetail(row)">
          {{ row.name }}
        </ElButton>
      </template>
      <template #progress="{ row }">
        <ElProgress :percentage="row.progress" />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['pms:pm:iteration:update'],
              onClick: () => handleEdit(row),
            },
          ]"
          :drop-down-actions="[
            {
              label: '开始迭代',
              auth: ['pms:pm:iteration:update'],
              ifShow: row.status === PmsIterationStatus.PLANNED,
              onClick: () => iterationStartFormModalApi.setData(row).open(),
            },
            {
              label: '完成迭代',
              auth: ['pms:pm:iteration:update'],
              ifShow: row.status === PmsIterationStatus.ACTIVE,
              popConfirm: {
                title: `确认完成迭代“${row.name}”吗？`,
                confirm: () => handleComplete(row),
              },
            },
            {
              label: '删除',
              type: 'danger',
              auth: ['pms:pm:iteration:delete'],
              popConfirm: {
                title: `确认删除迭代“${row.name}”吗？`,
                confirm: () => handleDelete(row),
              },
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 表单弹窗：添加/修改、开始迭代 -->
    <IterationFormModal @success="handleRefresh" />
    <IterationStartFormModal @success="handleRefresh" />
  </div>
</template>
