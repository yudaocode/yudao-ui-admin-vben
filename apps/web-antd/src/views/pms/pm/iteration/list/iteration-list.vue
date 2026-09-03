<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsIterationApi } from '#/api/pms/pm/iteration';

import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';

import { Button, Dropdown, Menu, message, Progress } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  completeIteration,
  deleteIteration,
  getIterationPage,
} from '#/api/pms/pm/iteration';
import { PmsIterationStatus } from '#/views/pms/pm/utils/constants';

import IterationForm from '../components/iteration-form.vue';
import IterationStartForm from '../components/iteration-start-form.vue';
import { useGridColumns, useSearchFormSchema } from './data';

defineOptions({ name: 'PmsIterationList' });

const props = defineProps<{
  editable: boolean;
  projectId: number;
}>();

const { hasAccessByCodes } = useAccess();
const { push } = useRouter(); // 路由操作

const [IterationFormModal, iterationFormModalApi] = useVbenModal({
  connectedComponent: IterationForm,
});
const [IterationStartFormModal, iterationStartFormModalApi] = useVbenModal({
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

/** 处理迭代操作 */
function handleIterationCommand(
  command: string,
  iteration: PmsIterationApi.Iteration,
) {
  if (command === 'start') {
    iterationStartFormModalApi.setData(iteration).open();
  } else if (command === 'complete') {
    handleComplete(iteration);
  } else if (command === 'edit') {
    iterationFormModalApi
      .setData({
        formType: 'update',
        id: iteration.id,
        projectId: props.projectId,
      })
      .open();
  } else if (command === 'delete') {
    handleDelete(iteration);
  }
}

/** 完成迭代 */
async function handleComplete(iteration: PmsIterationApi.Iteration) {
  try {
    // 完成的二次确认
    await confirm(`确认完成迭代“${iteration.name}”吗？`);
    // 发起完成
    await completeIteration(iteration.id!);
    message.success('迭代已完成');
    handleRefresh();
  } catch {}
}

/** 删除迭代 */
async function handleDelete(iteration: PmsIterationApi.Iteration) {
  try {
    // 删除的二次确认
    await confirm(`确认删除迭代“${iteration.name}”吗？`);
    // 发起删除
    await deleteIteration(iteration.id!);
    message.success('删除成功');
    handleRefresh();
  } catch {
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useSearchFormSchema(),
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
        <Button type="link" @click.stop="openDetail(row)">
          {{ row.name }}
        </Button>
      </template>
      <template #progress="{ row }">
        <Progress :percent="row.progress" />
      </template>
      <template #actions="{ row }">
        <Dropdown trigger="click">
          <Button type="link" @click.stop>更多</Button>
          <template #overlay>
            <Menu @click="({ key }: any) => handleIterationCommand(key, row)">
              <Menu.Item
                v-if="
                  row.status === PmsIterationStatus.PLANNED &&
                  hasAccessByCodes(['pms:pm:iteration:update'])
                "
                key="start"
              >
                开始迭代
              </Menu.Item>
              <Menu.Item
                v-if="
                  row.status === PmsIterationStatus.ACTIVE &&
                  hasAccessByCodes(['pms:pm:iteration:update'])
                "
                key="complete"
              >
                完成迭代
              </Menu.Item>
              <Menu.Item
                v-if="hasAccessByCodes(['pms:pm:iteration:update'])"
                key="edit"
              >
                编辑迭代
              </Menu.Item>
              <Menu.Divider
                v-if="hasAccessByCodes(['pms:pm:iteration:delete'])"
              />
              <Menu.Item
                v-if="hasAccessByCodes(['pms:pm:iteration:delete'])"
                key="delete"
              >
                删除迭代
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </template>
    </Grid>

    <!-- 表单弹窗：添加/修改、开始迭代 -->
    <IterationFormModal @success="handleRefresh" />
    <IterationStartFormModal @success="handleRefresh" />
  </div>
</template>
