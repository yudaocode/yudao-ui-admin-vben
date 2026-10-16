<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';

import { reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElProgress,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { exportWorkItemList, getWorkItemPage } from '#/api/pms/pm/workitem';
import {
  PmsWorkItemLifecycleStatus,
  PmsWorkItemType,
} from '#/views/pms/pm/utils/constants';

import WorkItemDetail from '../detail/work-item-detail.vue';
import { useGridColumns, useWorkItemSearchFormSchema } from './data';
import WorkItemForm from './modules/form.vue';

defineOptions({ name: 'PmsWorkItemAllList' });

const props = defineProps<{
  editable: boolean;
  iterationId?: number;
  projectId: number;
  projectType: number;
}>();

const emit = defineEmits<{ changed: [] }>();

const route = useRoute(); // 当前项目路由

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  projectId: props.projectId,
  types: [] as number[],
  name: undefined as string | undefined,
  statuses: [] as number[],
  priorities: [] as number[],
  iterationId: props.iterationId,
  iterationIds: [] as number[],
  excludedIterationIds: [] as number[],
  assigneeUserIds: route.query.assigneeUserId
    ? [Number(route.query.assigneeUserId)]
    : ([] as number[]),
  labelIds: [] as number[],
  unplannedOnly: false,
  rootOnly: true,
  lifecycleStatus: PmsWorkItemLifecycleStatus.ACTIVE,
}); // 查询参数

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useWorkItemSearchFormSchema({
      projectId: props.projectId,
      projectType: props.projectType,
      iterationId: props.iterationId,
      showTypes: true,
      showUnplanned: true,
      assigneeUserIds: queryParams.assigneeUserIds,
    }),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: {
      pageSize: queryParams.pageSize,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          Object.assign(queryParams, {
            name: undefined,
            types: [],
            statuses: [],
            priorities: [],
            iterationIds: [],
            excludedIterationIds: [],
            assigneeUserIds: [],
            labelIds: [],
            unplannedOnly: false,
            ...formValues,
          });
          queryParams.pageNo = page.currentPage;
          queryParams.pageSize = page.pageSize;
          return await getWorkItemPage(queryParams);
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
    },
  } as VxeTableGridOptions<PmsWorkItemApi.WorkItem>,
});

const [WorkItemFormModal, workItemFormModalApi] = useVbenModal({
  destroyOnClose: true,
  connectedComponent: WorkItemForm,
});
const [WorkItemDetailDrawer, workItemDetailDrawerApi] = useVbenDrawer({
  connectedComponent: WorkItemDetail,
});

/** 打开工作项详情 */
function openDetail(workItem: PmsWorkItemApi.WorkItem) {
  workItemDetailDrawerApi.setData({ id: workItem.id! }).open();
}

/** 新建工作项 */
function openCreateForm(type: number) {
  workItemFormModalApi
    .setData({
      formType: 'create',
      createContext: {
        projectId: props.projectId,
        projectType: props.projectType,
        type,
        iterationId: props.iterationId,
      },
    })
    .open();
}

/** 刷新工作项并通知上层统计同步 */
async function handleDataChanged() {
  await gridApi.reload();
  emit('changed');
}

/** 导出全部事项 */
async function handleExport() {
  const data = await exportWorkItemList({
    ...queryParams,
    ...(await gridApi.formApi.getValues()),
  });
  downloadFileFromBlobPart({ fileName: '全部事项.xlsx', source: data });
}

defineExpose({ refresh: () => gridApi.reload() });
</script>

<template>
  <div>
    <!-- 搜索与操作 -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <ElDropdown
          v-if="editable"
          v-access:code="['pms:pm:work-item:create']"
          @command="openCreateForm"
        >
          <ElButton type="primary">新建</ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem :command="PmsWorkItemType.REQUIREMENT">
                新建需求
              </ElDropdownItem>
              <ElDropdownItem :command="PmsWorkItemType.TASK">
                新建任务
              </ElDropdownItem>
              <ElDropdownItem :command="PmsWorkItemType.DEFECT">
                新建缺陷
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
        <ElButton
          v-access:code="['pms:pm:work-item:export']"
          @click="handleExport"
        >
          导出
        </ElButton>
      </div>
    </div>

    <!-- 列表 -->
    <Grid class="mt-4">
      <template #serialNumber="{ row }"> #{{ row.serialNumber }} </template>
      <template #name="{ row }">
        <ElButton link type="primary" @click="openDetail(row)">
          {{ row.name }}
        </ElButton>
      </template>
      <template #progress="{ row }">
        <ElProgress :percentage="row.progress" />
      </template>
    </Grid>

    <!-- 工作项新增表单 -->
    <WorkItemFormModal @success="handleDataChanged" />
    <!-- 工作项详情 -->
    <WorkItemDetailDrawer @success="handleDataChanged" />
  </div>
</template>
