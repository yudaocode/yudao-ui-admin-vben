<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectMemberApi } from '#/api/pms/pm/project/member';
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';
import type { PmsWorkItemStatusApi } from '#/api/pms/pm/workitem/status';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import {
  Avatar,
  Button,
  Dropdown,
  Menu,
  message,
  Progress,
  RadioGroup,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
} from 'antdv-next';
import dayjs from 'dayjs';
import draggable from 'vuedraggable';

import { useVbenForm } from '#/adapter/form';
import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProjectMemberList } from '#/api/pms/pm/project/member';
import {
  archiveWorkItem,
  deleteWorkItem,
  exportWorkItemList,
  getWorkItemBoard,
  getWorkItemPage,
  recycleWorkItem,
  restoreWorkItem,
  updateWorkItemSort,
  updateWorkItemStatus,
} from '#/api/pms/pm/workitem';
import { getWorkItemStatusList } from '#/api/pms/pm/workitem/status';
import {
  PmsWorkItemLifecycleStatus,
  PmsWorkItemStatusType,
} from '#/views/pms/pm/utils/constants';
import {
  formatPmsDate,
  getPriorityColor,
  getWorkItemStatusTagType,
} from '#/views/pms/pm/utils/format';

import WorkItemDetail from '../detail/work-item-detail.vue';
import WorkItemStatusList from '../status/status-list.vue';
import { useWorkItemGridColumns, useWorkItemSearchFormSchema } from './data';
import WorkItemForm from './modules/form.vue';
import WorkItemImportForm from './modules/import-form.vue';

defineOptions({ name: 'PmsWorkItemList' });

const props = defineProps<{
  defaultViewMode?: 'board' | 'list';
  editable: boolean;
  iterationId?: number;
  projectId: number;
  projectType: number;
  type: number;
}>();
const emit = defineEmits<{ changed: [] }>();
type BoardStatusGroup = {
  items: PmsWorkItemApi.WorkItem[];
  status: PmsWorkItemStatusApi.WorkItemStatus;
};
type BoardColumn = PmsWorkItemApi.WorkItemBoard & {
  statusGroups: BoardStatusGroup[];
};

const route = useRoute(); // 当前项目路由

const { hasAccessByCodes } = useAccess();
const loading = ref(true); // 看板数据加载中
const boardSaving = ref(false); // 看板拖拽保存中
const viewMode = ref<'board' | 'list'>(props.defaultViewMode || 'list'); // 当前展示模式
const board = ref<BoardColumn[]>([]); // 工作项看板
const statusOptions = ref<PmsWorkItemStatusApi.WorkItemStatus[]>([]); // 看板状态列表
const memberOptions = ref<PmsProjectMemberApi.ProjectMember[]>([]); // 负责人筛选选项
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  projectId: props.projectId,
  type: props.type,
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
  rootOnly: true,
  lifecycleStatus: PmsWorkItemLifecycleStatus.ACTIVE as number,
}); // 查询参数
const workItemTypeName = computed(
  () => getDictLabel(DICT_TYPE.PMS_WORK_ITEM_TYPE, props.type) || '-',
); // 工作项业务名称
const memberMap = computed(
  () => new Map(memberOptions.value.map((member) => [member.userId, member])),
); // 项目成员 Map
const isActiveLifecycle = computed(
  () => queryParams.lifecycleStatus === PmsWorkItemLifecycleStatus.ACTIVE,
); // 是否展示当前工作项
const hasBoardFilter = computed(() =>
  Boolean(
    queryParams.name ||
    queryParams.statuses.length > 0 ||
    queryParams.priorities.length > 0 ||
    queryParams.iterationId ||
    queryParams.iterationIds.length > 0 ||
    queryParams.excludedIterationIds.length > 0 ||
    queryParams.assigneeUserIds.length > 0 ||
    queryParams.labelIds.length > 0,
  ),
); // 看板是否正在筛选，筛选结果不允许拖拽排序

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useWorkItemGridColumns(props.type, props.projectType),
    height: 'auto',
    pagerConfig: {
      pageSize: queryParams.pageSize,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          queryParams.pageNo = page.currentPage;
          queryParams.pageSize = page.pageSize;
          const [data] = await Promise.all([getWorkItemPage(queryParams)]);
          // 查询状态选项，供列表快捷修改和看板展示使用
          statusOptions.value = await getWorkItemStatusList(
            props.projectId,
            props.type,
          );
          return data;
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

/** 查询工作项 */
async function getWorkItemList() {
  // 列表模式由 Grid 代理查询并保持当前页，这里只查询看板数据
  if (viewMode.value !== 'board') {
    await gridApi.reload();
    return;
  }
  loading.value = true;
  try {
    const boardData = await getWorkItemBoard(queryParams);
    board.value = boardData.map((column) => ({
      ...column,
      statusGroups: column.statuses.map((status) => ({
        status,
        items: column.items.filter((item) => item.statusId === status.id),
      })),
    }));
    // 查询状态选项，供列表快捷修改和看板展示使用
    statusOptions.value = await getWorkItemStatusList(
      props.projectId,
      props.type,
    );
  } finally {
    loading.value = false;
  }
}

/** 从第一页重新查询 */
function handleQuery() {
  queryParams.pageNo = 1;
  if (viewMode.value === 'list') {
    gridApi.query();
  } else {
    getWorkItemList();
  }
}

/** 获得看板列包含的状态名称 */
function getBoardColumnStatusNames(column: PmsWorkItemApi.WorkItemBoard) {
  return column.statuses.map((item) => item.name).join(' · ');
}

/** 获得看板列内工作项数量 */
function getBoardColumnItemCount(column: BoardColumn) {
  return column.statusGroups.reduce(
    (count, group) => count + group.items.length,
    0,
  );
}

/** 提交筛选 */
async function handleFilterSubmit(values: any) {
  Object.assign(queryParams, {
    name: undefined,
    statuses: [],
    priorities: [],
    iterationIds: [],
    excludedIterationIds: [],
    assigneeUserIds: [],
    labelIds: [],
    lifecycleStatus: PmsWorkItemLifecycleStatus.ACTIVE,
    ...values,
  });
  const switchedToList = !isActiveLifecycle.value && viewMode.value === 'board';
  if (!isActiveLifecycle.value) {
    viewMode.value = 'list';
  }
  if (!switchedToList) {
    handleQuery();
  }
}

const [FilterForm] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useWorkItemSearchFormSchema({
    projectId: props.projectId,
    projectType: props.projectType,
    iterationId: props.iterationId,
    showLifecycle: true,
    namePlaceholder: `请输入${workItemTypeName.value}标题`,
    assigneeUserIds: queryParams.assigneeUserIds,
  }),
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  handleSubmit: handleFilterSubmit,
  handleReset: handleFilterSubmit,
});

/** 切换展示模式 */
function handleViewModeChange() {
  // 切回列表时 Grid 重新挂载会自动查询，看板需要主动查询
  if (viewMode.value === 'board') {
    getWorkItemList();
  }
}

const [WorkItemFormModal, workItemFormModalApi] = useVbenModal({
  destroyOnClose: true,
  connectedComponent: WorkItemForm,
});
const [WorkItemDetailDrawer, workItemDetailDrawerApi] = useVbenDrawer({
  connectedComponent: WorkItemDetail,
});
const [WorkItemStatusListModal, workItemStatusListModalApi] = useVbenModal({
  destroyOnClose: true,
  connectedComponent: WorkItemStatusList,
});
const [WorkItemImportFormModal, workItemImportFormModalApi] = useVbenModal({
  destroyOnClose: true,
  connectedComponent: WorkItemImportForm,
});

/** 打开工作项详情 */
function openDetail(workItem: PmsWorkItemApi.WorkItem) {
  workItemDetailDrawerApi.setData({ id: workItem.id! }).open();
}

/** 打开工作项新增表单 */
function openCreateForm() {
  workItemFormModalApi
    .setData({
      formType: 'create',
      createContext: {
        projectId: props.projectId,
        projectType: props.projectType,
        type: props.type,
        iterationId: props.iterationId,
      },
    })
    .open();
}

/** 刷新工作项数据 */
async function refreshWorkItems() {
  await getWorkItemList();
}

/** 刷新工作项并通知上层统计同步 */
async function handleDataChanged() {
  await refreshWorkItems();
  emit('changed');
}

/** 打开工作项编辑表单 */
function openEditForm(workItem: PmsWorkItemApi.WorkItem) {
  workItemFormModalApi.setData({ formType: 'update', id: workItem.id }).open();
}

/** 归档工作项 */
async function handleArchive(workItem: PmsWorkItemApi.WorkItem) {
  try {
    // 归档的二次确认
    await confirm(`确认归档${workItemTypeName.value}“${workItem.name}”吗？`);
    // 发起归档
    await archiveWorkItem(workItem.id!);
    message.success('归档成功');
    await handleDataChanged();
  } catch {}
}

/** 将工作项移入回收站 */
async function handleRecycle(workItem: PmsWorkItemApi.WorkItem) {
  try {
    // 删除的二次确认
    await confirm(
      `确认将${workItemTypeName.value}“${workItem.name}”移入回收站吗？`,
    );
    // 发起删除
    await recycleWorkItem(workItem.id!);
    message.success('已移入回收站');
    await handleDataChanged();
  } catch {}
}

/** 恢复工作项 */
async function handleRestore(workItem: PmsWorkItemApi.WorkItem) {
  try {
    // 恢复的二次确认
    await confirm(`确认恢复${workItemTypeName.value}“${workItem.name}”吗？`);
    // 发起恢复
    await restoreWorkItem(workItem.id!);
    message.success('恢复成功');
    await handleDataChanged();
  } catch {}
}

/** 彻底删除回收站中的工作项 */
async function handleDelete(workItem: PmsWorkItemApi.WorkItem) {
  try {
    // 删除的二次确认
    await confirm(
      `确认彻底删除${workItemTypeName.value}“${workItem.name}”吗？`,
    );
    // 发起删除
    await deleteWorkItem(workItem.id!);
    message.success('删除成功');
    await handleDataChanged();
  } catch {}
}

/** 打开状态设置弹窗 */
function openStatusConfig() {
  workItemStatusListModalApi
    .setData({ projectId: props.projectId, type: props.type })
    .open();
}

/** 处理工作项工具栏更多操作 */
function handleToolbarCommand(command: string) {
  if (command === 'status-config') {
    openStatusConfig();
  } else if (command === 'import') {
    workItemImportFormModalApi
      .setData({ projectId: props.projectId, type: props.type })
      .open();
  } else if (command === 'export') {
    handleExport();
  }
}

/** 判断工作项是否已经逾期 */
function isWorkItemOverdue(workItem: PmsWorkItemApi.WorkItem) {
  return (
    workItem.status !== PmsWorkItemStatusType.COMPLETED &&
    Boolean(workItem.endTime) &&
    dayjs(workItem.endTime).valueOf() < Date.now()
  );
}

/** 修改工作项状态 */
async function handleStatusChange(workItem: PmsWorkItemApi.WorkItem) {
  try {
    await updateWorkItemStatus(workItem.id!, workItem.statusId!);
    message.success('状态已更新');
    await handleDataChanged();
  } catch {
    await refreshWorkItems();
  }
}

/** 看板跨列移动工作项 */
async function handleBoardAdd(
  event: { newIndex?: number },
  statusGroup: BoardStatusGroup,
) {
  // 定位跨列拖入的工作项
  if (boardSaving.value || event.newIndex === undefined) {
    return;
  }
  const statusId = statusGroup.status.id;
  const workItem = statusGroup.items[event.newIndex];
  if (!workItem || workItem.statusId === statusId) {
    return;
  }
  // 更新工作项状态和目标列排序
  boardSaving.value = true;
  try {
    await updateWorkItemStatus(workItem.id!, statusId);
    // 筛选结果不是完整列数据，只更新状态，避免用部分结果覆盖完整排序。
    if (!hasBoardFilter.value) {
      await updateWorkItemSort(
        statusId,
        statusGroup.items.map((item) => item.id!),
      );
    }
    message.success('状态已更新');
    emit('changed');
  } finally {
    await getWorkItemList();
    boardSaving.value = false;
  }
}

/** 保存看板列内工作项顺序 */
async function handleBoardSort(statusGroup: BoardStatusGroup) {
  if (boardSaving.value) {
    return;
  }
  // 筛选状态下只允许跨列换状态，不能用部分结果持久化列内顺序。
  if (hasBoardFilter.value) {
    await getWorkItemList();
    return;
  }
  // 保存当前列的工作项顺序
  boardSaving.value = true;
  try {
    await updateWorkItemSort(
      statusGroup.status.id,
      statusGroup.items.map((item) => item.id!),
    );
  } catch {
    await getWorkItemList();
  } finally {
    boardSaving.value = false;
  }
}

/** 导出工作项 */
async function handleExport() {
  const data = await exportWorkItemList(queryParams);
  downloadFileFromBlobPart({
    fileName: `${workItemTypeName.value}.xlsx`,
    source: data,
  });
}

defineExpose({ refresh: getWorkItemList });

/** 初始化 */
onMounted(() => {
  // 列表模式由 Grid 挂载时自动查询，看板模式需要主动查询
  if (viewMode.value === 'board') {
    getWorkItemList();
  }
  getProjectMemberList(props.projectId).then((list) => {
    memberOptions.value = list;
  });
});
</script>

<template>
  <div>
    <!-- 项目工作项筛选 -->
    <FilterForm class="mb-4" />

    <!-- 项目工作项操作 -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <RadioGroup
        v-model:value="viewMode"
        option-type="button"
        :options="[
          { label: '列表', value: 'list' },
          { label: '看板', value: 'board', disabled: !isActiveLifecycle },
        ]"
        @change="handleViewModeChange"
      />
      <!-- 创建与更多操作 -->
      <div class="flex items-center gap-2">
        <Button
          v-if="editable && isActiveLifecycle"
          v-access:code="['pms:pm:work-item:create']"
          type="primary"
          @click="openCreateForm"
        >
          创建{{ workItemTypeName }}
        </Button>
        <Dropdown :trigger="['click']">
          <Button aria-label="更多操作">
            <IconifyIcon icon="lucide:ellipsis" />
          </Button>
          <template #popupRender>
            <Menu @click="({ key }: any) => handleToolbarCommand(key)">
              <Menu.Item
                v-if="
                  editable &&
                  isActiveLifecycle &&
                  hasAccessByCodes(['pms:pm:work-item:update'])
                "
                key="status-config"
              >
                状态设置
              </Menu.Item>
              <Menu.Item
                v-if="
                  editable &&
                  isActiveLifecycle &&
                  hasAccessByCodes(['pms:pm:work-item:import'])
                "
                key="import"
              >
                导入
              </Menu.Item>
              <Menu.Item
                v-if="hasAccessByCodes(['pms:pm:work-item:export'])"
                key="export"
              >
                导出
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </div>
    </div>

    <template v-if="viewMode === 'list'">
      <!-- 列表 -->
      <Grid>
        <template #serialNumber="{ row }"> #{{ row.serialNumber }} </template>
        <template #name="{ row }">
          <Button type="link" @click="openDetail(row)">
            {{ row.name }}
          </Button>
        </template>
        <template #status="{ row }">
          <Select
            v-if="editable && isActiveLifecycle"
            v-model:value="row.statusId"
            :options="
              statusOptions.map((status) => ({
                label: status.name,
                value: status.id,
              }))
            "
            size="small"
            @change="handleStatusChange(row)"
          />
          <span v-else>{{ row.statusName }}</span>
        </template>
        <template #labels="{ row }">
          <Space wrap>
            <Tag
              v-for="label in row.labels"
              :key="label.id"
              :color="label.color"
            >
              {{ label.name }}
            </Tag>
          </Space>
        </template>
        <template #progress="{ row }">
          <Progress :percent="row.progress" :stroke-width="8" />
        </template>
        <template #actions="{ row }">
          <TableAction
            :actions="[
              {
                label: '编辑',
                type: 'link',
                icon: ACTION_ICON.EDIT,
                auth: ['pms:pm:work-item:update'],
                ifShow: editable && isActiveLifecycle,
                onClick: openEditForm.bind(null, row),
              },
              {
                label: '查看',
                type: 'link',
                icon: ACTION_ICON.VIEW,
                ifShow: !editable || !isActiveLifecycle,
                onClick: openDetail.bind(null, row),
              },
              {
                label: '归档',
                type: 'link',
                auth: ['pms:pm:work-item:update'],
                ifShow: editable && isActiveLifecycle,
                onClick: handleArchive.bind(null, row),
              },
              {
                label: '回收站',
                type: 'link',
                danger: true,
                auth: ['pms:pm:work-item:update'],
                ifShow:
                  editable &&
                  queryParams.lifecycleStatus !==
                    PmsWorkItemLifecycleStatus.RECYCLED,
                onClick: handleRecycle.bind(null, row),
              },
              {
                label: '恢复',
                type: 'link',
                auth: ['pms:pm:work-item:update'],
                ifShow: editable && !isActiveLifecycle,
                onClick: handleRestore.bind(null, row),
              },
              {
                label: '删除',
                type: 'link',
                danger: true,
                icon: ACTION_ICON.DELETE,
                auth: ['pms:pm:work-item:delete'],
                ifShow:
                  editable &&
                  queryParams.lifecycleStatus ===
                    PmsWorkItemLifecycleStatus.RECYCLED,
                onClick: handleDelete.bind(null, row),
              },
            ]"
          />
        </template>
      </Grid>
    </template>

    <Spin v-else :spinning="loading">
      <!-- 看板 -->
      <div class="flex min-h-[460px] gap-4 overflow-x-auto pb-3">
        <section
          v-for="column in board"
          :key="column.name"
          class="shrink-0 grow-0 basis-[300px] rounded-lg bg-accent p-3"
        >
          <header
            class="flex items-center justify-between px-1 pb-3 font-semibold"
          >
            <div>
              <span>{{ column.name }}</span>
              <div
                v-if="column.statuses.length > 1"
                class="mt-1 text-[11px] font-normal opacity-70"
              >
                {{ getBoardColumnStatusNames(column) }}
              </div>
            </div>
            <Tag>{{ getBoardColumnItemCount(column) }}</Tag>
          </header>
          <!-- 合并列按具体状态拆分投放区，避免拖入列后静默落到第一个状态 -->
          <div
            v-for="statusGroup in column.statusGroups"
            :key="statusGroup.status.id"
            class="mb-3 last:mb-0"
          >
            <div
              v-if="column.statusGroups.length > 1"
              class="mb-1.5 text-xs font-medium text-muted-foreground"
            >
              {{ statusGroup.status.name }}
            </div>
            <draggable
              v-model="statusGroup.items"
              class="min-h-[90px] rounded border border-dashed border-border p-1.5"
              :disabled="boardSaving || !editable"
              group="pms-work-items"
              item-key="id"
              @add="handleBoardAdd($event, statusGroup)"
              @update="handleBoardSort(statusGroup)"
            >
              <template #item="{ element }">
                <article
                  class="mb-2.5 cursor-pointer rounded-md border border-solid border-border bg-background p-3 shadow-sm last:mb-0"
                  @click="openDetail(element)"
                >
                  <div class="line-clamp-2 text-sm font-medium leading-[21px]">
                    {{ element.name }}
                  </div>
                  <div v-if="element.endTime" class="mt-2">
                    <Tag
                      :color="isWorkItemOverdue(element) ? 'red' : 'default'"
                    >
                      {{ formatPmsDate(element.endTime, 'MM月DD日') }}截止
                    </Tag>
                  </div>
                  <div class="mt-3 flex items-center justify-between gap-2">
                    <span
                      class="flex items-center gap-1 text-xs text-muted-foreground"
                    >
                      <IconifyIcon icon="lucide:list" :size="15" />#{{
                        element.serialNumber
                      }}
                    </span>
                    <div class="flex min-w-0 items-center gap-2">
                      <span
                        class="flex items-center gap-1 whitespace-nowrap text-xs"
                        :style="{ color: getPriorityColor(element.priority) }"
                      >
                        <span class="h-2 w-2 rounded-full bg-current"></span>
                        {{
                          getDictLabel(
                            DICT_TYPE.PMS_WORK_ITEM_PRIORITY,
                            element.priority,
                          ) || '-'
                        }}
                      </span>
                      <Tag :color="getWorkItemStatusTagType(element.status)">
                        {{ element.statusName }}
                      </Tag>
                      <Tooltip
                        :title="element.assigneeUserName || '未分配'"
                        placement="top"
                      >
                        <Avatar
                          :size="24"
                          :src="
                            memberMap.get(element.assigneeUserId || 0)?.avatar
                          "
                        >
                          {{ element.assigneeUserName?.slice(0, 1) || '未' }}
                        </Avatar>
                      </Tooltip>
                    </div>
                  </div>
                </article>
              </template>
            </draggable>
          </div>
        </section>
      </div>
    </Spin>

    <!-- 工作项新增、编辑表单 -->
    <WorkItemFormModal @success="handleDataChanged" />
    <!-- 工作项详情 -->
    <WorkItemDetailDrawer @success="handleDataChanged" />
    <!-- 状态设置弹窗 -->
    <WorkItemStatusListModal @success="getWorkItemList" />
    <!-- 工作项导入弹窗 -->
    <WorkItemImportFormModal @success="getWorkItemList" />
  </div>
</template>
