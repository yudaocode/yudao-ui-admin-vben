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
  ElButton,
  ElCheckbox,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElPopover,
  ElProgress,
  ElSelect,
} from 'element-plus';

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
        <ElInput
          v-model="queryParams.name"
          class="!w-[240px]"
          clearable
          placeholder="搜索事项"
          @clear="handleQuery"
          @keyup.enter="handleQuery"
        />
        <ElPopover
          :visible="showFilterPopover"
          :show-arrow="false"
          :width="420"
          persistent
          placement="bottom-start"
        >
          <template #reference>
            <ElButton @click="showFilterPopover = !showFilterPopover">
              <IconifyIcon class="mr-1.5" icon="ep:plus" />高级筛选
            </ElButton>
          </template>
          <ElForm class="max-h-[360px] overflow-y-auto pr-1">
            <ElFormItem
              class="font-bold"
              label="事项类型"
              label-position="top"
              prop="types"
            >
              <ElSelect
                v-model="queryParams.types"
                class="!w-full"
                clearable
                collapse-tags
                collapse-tags-tooltip
                multiple
                placeholder="全部类型"
              >
                <ElOption
                  v-if="projectType === PmsProjectType.AGILE"
                  label="需求"
                  :value="PmsWorkItemType.REQUIREMENT"
                />
                <ElOption label="任务" :value="PmsWorkItemType.TASK" />
                <ElOption
                  v-if="projectType === PmsProjectType.AGILE"
                  label="缺陷"
                  :value="PmsWorkItemType.DEFECT"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem
              class="font-bold"
              label="状态"
              label-position="top"
              prop="statuses"
            >
              <ElSelect
                v-model="queryParams.statuses"
                class="!w-full"
                clearable
                collapse-tags
                collapse-tags-tooltip
                multiple
                placeholder="全部状态"
              >
                <ElOption
                  label="未开始"
                  :value="PmsWorkItemStatusType.PENDING"
                />
                <ElOption
                  label="进行中"
                  :value="PmsWorkItemStatusType.PROCESSING"
                />
                <ElOption
                  label="已完成"
                  :value="PmsWorkItemStatusType.COMPLETED"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem
              class="font-bold"
              label="优先级"
              label-position="top"
              prop="priorities"
            >
              <ElSelect
                v-model="queryParams.priorities"
                class="!w-full"
                clearable
                collapse-tags
                collapse-tags-tooltip
                multiple
                placeholder="全部优先级"
              >
                <ElOption
                  v-for="option in getDictOptions(
                    DICT_TYPE.PMS_WORK_ITEM_PRIORITY,
                    'number',
                  )"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem
              v-if="projectType === PmsProjectType.AGILE && !iterationId"
              class="font-bold"
              label="所属迭代"
              label-position="top"
            >
              <IterationSelect
                v-model="queryParams.iterationIds"
                multiple
                :project-id="projectId"
                placeholder="全部迭代"
              />
            </ElFormItem>
            <ElFormItem
              v-if="projectType === PmsProjectType.AGILE && !iterationId"
              class="font-bold"
              label="排除迭代"
              label-position="top"
            >
              <IterationSelect
                v-model="queryParams.excludedIterationIds"
                multiple
                :project-id="projectId"
                placeholder="不显示所选迭代"
              />
            </ElFormItem>
            <ElFormItem class="font-bold" label="负责人" label-position="top">
              <ProjectMemberSelect
                v-model="queryParams.assigneeUserIds"
                multiple
                :project-id="projectId"
                placeholder="全部负责人"
              />
            </ElFormItem>
            <ElFormItem class="font-bold" label="标签" label-position="top">
              <WorkItemLabelSelect
                v-model="queryParams.labelIds"
                placeholder="全部标签"
              />
            </ElFormItem>
            <ElFormItem v-if="!iterationId" prop="unplannedOnly">
              <ElCheckbox v-model="queryParams.unplannedOnly">
                只显示未规划事项
              </ElCheckbox>
            </ElFormItem>
          </ElForm>
          <div class="flex w-full justify-end pt-2">
            <ElButton @click="resetQuery">清空</ElButton>
            <ElButton @click="showFilterPopover = false">取消</ElButton>
            <ElButton type="primary" @click="handleAdvancedQuery">
              确认
            </ElButton>
          </div>
        </ElPopover>
      </div>
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
