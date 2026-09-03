<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';

import { reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart, formatDateTime } from '@vben/utils';

import {
  Button,
  Checkbox,
  Dropdown,
  Input,
  Menu,
  MenuItem,
  Popover,
  Progress,
  Select,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { exportWorkItemList, getWorkItemPage } from '#/api/pms/pm/workitem';
import IterationSelect from '#/views/pms/pm/iteration/components/iteration-select.vue';
import ProjectMemberSelect from '#/views/pms/pm/project/components/project-member-select.vue';
import {
  PmsProjectType,
  PmsWorkItemLifecycleStatus,
  PmsWorkItemStatusType,
  PmsWorkItemType,
} from '#/views/pms/pm/utils/constants';

import WorkItemDetail from '../detail/work-item-detail.vue';
import WorkItemForm from '../form/work-item-form.vue';
import WorkItemLabelSelect from '../label/work-item-label-select.vue';
import { useGridColumns } from './data';

defineOptions({ name: 'PmsWorkItemAllList' });

// TODO @AI：筛选改 formOptions.schema，不要页面里手写 Input/Select/Popover。height 用 auto，补 toolbarConfig。和 work-item-list 的筛选项保持同一套 schema。
const props = defineProps<{
  editable: boolean;
  iterationId?: number;
  projectId: number;
  projectType: number;
}>();

const emit = defineEmits<{ changed: [] }>();

const route = useRoute(); // 当前项目路由

const showFilterPopover = ref(false); // 是否显示高级筛选
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
  gridOptions: {
    columns: useGridColumns(),
    pagerConfig: {
      pageSize: queryParams.pageSize,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
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
      enabled: false,
    },
  } as VxeTableGridOptions<PmsWorkItemApi.WorkItem>,
});

/** 搜索 */
function handleQuery() {
  queryParams.pageNo = 1;
  gridApi.query();
}

/** 高级筛选确认 */
function handleAdvancedQuery() {
  showFilterPopover.value = false;
  handleQuery();
}

/** 重置搜索条件 */
function resetQuery() {
  queryParams.name = undefined;
  queryParams.types = [];
  queryParams.statuses = [];
  queryParams.priorities = [];
  queryParams.iterationIds = [];
  queryParams.excludedIterationIds = [];
  queryParams.assigneeUserIds = [];
  queryParams.labelIds = [];
  queryParams.unplannedOnly = false;
  showFilterPopover.value = false;
  handleQuery();
}

const [WorkItemFormModal, workItemFormModalApi] = useVbenModal({
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
  const data = await exportWorkItemList(queryParams);
  downloadFileFromBlobPart({ fileName: '全部事项.xlsx', source: data });
}

defineExpose({ refresh: () => gridApi.reload() });
</script>

<template>
  <div>
    <!-- 搜索与操作 -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <Input
          v-model:value="queryParams.name"
          allow-clear
          class="!w-[240px]"
          placeholder="搜索事项"
          @clear="handleQuery"
          @press-enter="handleQuery"
        />
        <Popover
          :open="showFilterPopover"
          :arrow="false"
          :overlay-style="{ width: '420px' }"
          placement="bottomLeft"
          :trigger="['click']"
        >
          <template #content>
            <div class="max-h-[360px] overflow-y-auto pr-1">
              <div class="mb-3">
                <div class="mb-1 font-bold">事项类型</div>
                <Select
                  v-model:value="queryParams.types"
                  allow-clear
                  class="!w-full"
                  max-tag-count="responsive"
                  mode="multiple"
                  :options="[
                    ...(projectType === PmsProjectType.AGILE
                      ? [{ label: '需求', value: PmsWorkItemType.REQUIREMENT }]
                      : []),
                    { label: '任务', value: PmsWorkItemType.TASK },
                    ...(projectType === PmsProjectType.AGILE
                      ? [{ label: '缺陷', value: PmsWorkItemType.DEFECT }]
                      : []),
                  ]"
                  placeholder="全部类型"
                />
              </div>
              <div class="mb-3">
                <div class="mb-1 font-bold">状态</div>
                <Select
                  v-model:value="queryParams.statuses"
                  allow-clear
                  class="!w-full"
                  max-tag-count="responsive"
                  mode="multiple"
                  :options="[
                    { label: '未开始', value: PmsWorkItemStatusType.PENDING },
                    {
                      label: '进行中',
                      value: PmsWorkItemStatusType.PROCESSING,
                    },
                    { label: '已完成', value: PmsWorkItemStatusType.COMPLETED },
                  ]"
                  placeholder="全部状态"
                />
              </div>
              <div class="mb-3">
                <div class="mb-1 font-bold">优先级</div>
                <Select
                  v-model:value="queryParams.priorities"
                  allow-clear
                  class="!w-full"
                  max-tag-count="responsive"
                  mode="multiple"
                  :options="
                    getDictOptions(
                      DICT_TYPE.PMS_WORK_ITEM_PRIORITY,
                      'number',
                    ).map((item) => ({
                      label: item.label,
                      value: item.value,
                    }))
                  "
                  placeholder="全部优先级"
                />
              </div>
              <div
                v-if="projectType === PmsProjectType.AGILE && !iterationId"
                class="mb-3"
              >
                <div class="mb-1 font-bold">所属迭代</div>
                <IterationSelect
                  v-model="queryParams.iterationIds"
                  multiple
                  :project-id="projectId"
                  placeholder="全部迭代"
                />
              </div>
              <div
                v-if="projectType === PmsProjectType.AGILE && !iterationId"
                class="mb-3"
              >
                <div class="mb-1 font-bold">排除迭代</div>
                <IterationSelect
                  v-model="queryParams.excludedIterationIds"
                  multiple
                  :project-id="projectId"
                  placeholder="不显示所选迭代"
                />
              </div>
              <div class="mb-3">
                <div class="mb-1 font-bold">负责人</div>
                <ProjectMemberSelect
                  v-model="queryParams.assigneeUserIds"
                  multiple
                  :project-id="projectId"
                  placeholder="全部负责人"
                />
              </div>
              <div class="mb-3">
                <div class="mb-1 font-bold">标签</div>
                <WorkItemLabelSelect
                  v-model="queryParams.labelIds"
                  placeholder="全部标签"
                />
              </div>
              <div v-if="!iterationId" class="mb-3">
                <Checkbox v-model:checked="queryParams.unplannedOnly">
                  只显示未规划事项
                </Checkbox>
              </div>
            </div>
            <div class="flex w-full justify-end gap-2 pt-2">
              <Button @click="resetQuery">清空</Button>
              <Button @click="showFilterPopover = false">取消</Button>
              <Button type="primary" @click="handleAdvancedQuery">确认</Button>
            </div>
          </template>
          <Button @click="showFilterPopover = !showFilterPopover">
            <IconifyIcon class="mr-1.5" icon="lucide:plus" />高级筛选
          </Button>
        </Popover>
      </div>
      <div class="flex items-center gap-3">
        <Dropdown
          v-if="editable"
          v-access:code="['pms:pm:work-item:create']"
          :trigger="['click']"
        >
          <Button type="primary">新建</Button>
          <template #popupRender>
            <Menu @click="({ key }: any) => openCreateForm(Number(key))">
              <MenuItem :key="PmsWorkItemType.REQUIREMENT">新建需求</MenuItem>
              <MenuItem :key="PmsWorkItemType.TASK">新建任务</MenuItem>
              <MenuItem :key="PmsWorkItemType.DEFECT">新建缺陷</MenuItem>
            </Menu>
          </template>
        </Dropdown>
        <Button
          v-access:code="['pms:pm:work-item:export']"
          @click="handleExport"
        >
          导出
        </Button>
      </div>
    </div>

    <!-- 列表 -->
    <Grid class="mt-4">
      <template #serialNumber="{ row }"> #{{ row.serialNumber }} </template>
      <template #name="{ row }">
        <Button type="link" @click="openDetail(row)">
          {{ row.name }}
        </Button>
      </template>
      <template #progress="{ row }">
        <Progress :percent="row.progress" />
      </template>
      <template #endTime="{ row }">
        {{ formatDateTime(row.endTime) }}
      </template>
    </Grid>

    <!-- 工作项新增表单 -->
    <WorkItemFormModal @success="handleDataChanged" />
    <!-- 工作项详情 -->
    <WorkItemDetailDrawer @success="handleDataChanged" />
  </div>
</template>
