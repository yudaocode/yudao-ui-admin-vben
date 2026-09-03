<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectMemberApi } from '#/api/pms/pm/project/member';
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';
import type { PmsWorkItemStatusApi } from '#/api/pms/pm/workitem/status';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';
import { getAllPageItems } from '@vben/utils';

import dayjs from 'dayjs';
import {
  ElAvatar,
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElPopover,
  ElProgress,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElSpace,
  ElTag,
  ElTooltip,
} from 'element-plus';
import draggable from 'vuedraggable';

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
import IterationSelect from '#/views/pms/pm/iteration/components/iteration-select.vue';
import ProjectMemberSelect from '#/views/pms/pm/project/components/project-member-select.vue';
import {
  PmsProjectType,
  PmsWorkItemLifecycleStatus,
  PmsWorkItemStatusType,
} from '#/views/pms/pm/utils/constants';
import {
  getPriorityColor,
  getWorkItemStatusTagType,
} from '#/views/pms/pm/utils/format';

import WorkItemDetail from '../detail/work-item-detail.vue';
import WorkItemForm from '../form/work-item-form.vue';
import WorkItemImportForm from '../import/import-form.vue';
import WorkItemLabelSelect from '../label/work-item-label-select.vue';
import WorkItemStatusList from '../status/status-list.vue';
import { useWorkItemGridColumns } from './data';

defineOptions({ name: 'PmsWorkItemList' });

// TODO @AI：筛选不要手写 Input/Select/Popover，放到 formOptions.schema，对齐 system user。height 用 auto。不要为前端搜索把全部分页拉下来。看板模式可保留自定义。
// TODO @AI：列表模式每次当前页查询都并行再拉一遍 getAllPageItems 全量缓存，随后才串行请求状态选项；这是按搜索刷新放大的重复网络开销，应改为服务端筛选/专用搜索接口，并把独立状态请求并入同一 Promise.all。
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
const showFilterPopover = ref(false); // 高级筛选是否展示
const viewMode = ref<'board' | 'list'>(props.defaultViewMode || 'list'); // 当前展示模式
const searchKeyword = ref(''); // 当前页前端搜索关键字
const searchableWorkItemList = ref<PmsWorkItemApi.WorkItem[]>([]); // 列表前端搜索数据
const board = ref<BoardColumn[]>([]); // 工作项看板
const statusOptions = ref<PmsWorkItemStatusApi.WorkItemStatus[]>([]); // 看板状态列表
const memberOptions = ref<PmsProjectMemberApi.ProjectMember[]>([]); // 负责人筛选选项
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  projectId: props.projectId,
  type: props.type,
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
const normalizedSearchKeyword = computed(() =>
  searchKeyword.value.trim().toLowerCase(),
); // 规范化搜索关键字
const filteredBoard = computed(() =>
  normalizedSearchKeyword.value
    ? board.value.map((column) => ({
        ...column,
        items: column.items.filter((item) => matchSearchKeyword(item)),
        statusGroups: column.statusGroups.map((statusGroup) => ({
          ...statusGroup,
          items: statusGroup.items.filter((item) => matchSearchKeyword(item)),
        })),
      }))
    : board.value,
); // 看板前端搜索结果
const memberMap = computed(
  () => new Map(memberOptions.value.map((member) => [member.userId, member])),
); // 项目成员 Map
const isActiveLifecycle = computed(
  () => queryParams.lifecycleStatus === PmsWorkItemLifecycleStatus.ACTIVE,
); // 是否展示当前工作项
const hasBoardFilter = computed(() =>
  Boolean(
    normalizedSearchKeyword.value ||
    queryParams.statuses.length ||
    queryParams.priorities.length ||
    queryParams.iterationId ||
    queryParams.iterationIds.length ||
    queryParams.excludedIterationIds.length ||
    queryParams.assigneeUserIds.length ||
    queryParams.labelIds.length,
  ),
); // 看板是否正在筛选，筛选结果不允许拖拽排序

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useWorkItemGridColumns(props.type, props.projectType),
    height: 600,
    pagerConfig: {
      pageSize: queryParams.pageSize,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          // 前端搜索时不分页，直接展示全量缓存的匹配结果
          if (normalizedSearchKeyword.value) {
            const list = searchableWorkItemList.value.filter((item) =>
              matchSearchKeyword(item),
            );
            return { list, total: list.length };
          }
          queryParams.pageNo = page.currentPage;
          queryParams.pageSize = page.pageSize;
          const [data, searchableItems] = await Promise.all([
            getWorkItemPage(queryParams),
            getAllPageItems<PmsWorkItemApi.WorkItem>((pageNo, pageSize) =>
              getWorkItemPage({ ...queryParams, pageNo, pageSize }),
            ),
          ]);
          searchableWorkItemList.value = searchableItems;
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
      enabled: false,
    },
  } as VxeTableGridOptions<PmsWorkItemApi.WorkItem>,
});

/** 监听前端搜索关键字，切换分页并刷新表格 */
watch(normalizedSearchKeyword, (keyword) => {
  if (viewMode.value !== 'list') {
    return;
  }
  gridApi.setGridOptions({ pagerConfig: { enabled: !keyword } });
  gridApi.reload();
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

/** 判断工作项是否匹配前端搜索关键字 */
function matchSearchKeyword(workItem: PmsWorkItemApi.WorkItem) {
  return (
    workItem.name.toLowerCase().includes(normalizedSearchKeyword.value) ||
    String(workItem.serialNumber).includes(normalizedSearchKeyword.value)
  );
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

/** 确认高级筛选 */
function handleAdvancedQuery() {
  showFilterPopover.value = false;
  // 切回列表时 Grid 重新挂载会自动查询，无需重复触发
  const switchedToList = !isActiveLifecycle.value && viewMode.value === 'board';
  if (!isActiveLifecycle.value) {
    viewMode.value = 'list';
  }
  if (!switchedToList) {
    handleQuery();
  }
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.statuses = [];
  queryParams.priorities = [];
  queryParams.iterationIds = [];
  queryParams.excludedIterationIds = [];
  queryParams.assigneeUserIds = [];
  queryParams.labelIds = [];
  queryParams.lifecycleStatus = PmsWorkItemLifecycleStatus.ACTIVE;
  searchKeyword.value = '';
  showFilterPopover.value = false;
  handleQuery();
}

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

/** 刷新工作项数据，前端搜索时同步全量缓存 */
async function refreshWorkItems() {
  if (viewMode.value === 'list' && normalizedSearchKeyword.value) {
    searchableWorkItemList.value =
      await getAllPageItems<PmsWorkItemApi.WorkItem>((pageNo, pageSize) =>
        getWorkItemPage({ ...queryParams, pageNo, pageSize }),
      );
  }
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
    ElMessage.success('归档成功');
    await handleDataChanged();
  } catch {
  }
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
    ElMessage.success('已移入回收站');
    await handleDataChanged();
  } catch {
  }
}

/** 恢复工作项 */
async function handleRestore(workItem: PmsWorkItemApi.WorkItem) {
  try {
    // 恢复的二次确认
    await confirm(`确认恢复${workItemTypeName.value}“${workItem.name}”吗？`);
    // 发起恢复
    await restoreWorkItem(workItem.id!);
    ElMessage.success('恢复成功');
    await handleDataChanged();
  } catch {
  }
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
    ElMessage.success('删除成功');
    await handleDataChanged();
  } catch {
  }
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
    ElMessage.success('状态已更新');
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
    ElMessage.success('状态已更新');
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
    <!-- 项目工作项列表 -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <!-- 搜索与高级筛选 -->
      <div class="flex flex-wrap items-center gap-2">
        <ElInput
          v-model="searchKeyword"
          class="!w-[240px]"
          clearable
          :placeholder="`请输入${workItemTypeName}标题`"
        />
        <!-- 高级筛选 -->
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
            <ElFormItem class="font-bold" label="数据范围" label-position="top">
              <ElRadioGroup v-model="queryParams.lifecycleStatus">
                <ElRadioButton :value="PmsWorkItemLifecycleStatus.ACTIVE">
                  当前
                </ElRadioButton>
                <ElRadioButton :value="PmsWorkItemLifecycleStatus.ARCHIVED">
                  已归档
                </ElRadioButton>
                <ElRadioButton :value="PmsWorkItemLifecycleStatus.RECYCLED">
                  回收站
                </ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>
            <ElFormItem class="font-bold" label="语义状态" label-position="top">
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
                  v-for="option in getDictOptions(
                    DICT_TYPE.PMS_WORK_ITEM_STATUS_TYPE,
                    'number',
                  )"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem class="font-bold" label="优先级" label-position="top">
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
                @loaded="memberOptions = $event"
              />
            </ElFormItem>
            <ElFormItem class="font-bold" label="标签" label-position="top">
              <WorkItemLabelSelect
                v-model="queryParams.labelIds"
                placeholder="全部标签"
              />
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
        <!-- 展示模式 -->
        <ElRadioGroup v-model="viewMode" @change="handleViewModeChange">
          <ElRadioButton value="list">列表</ElRadioButton>
          <ElRadioButton :disabled="!isActiveLifecycle" value="board">
            看板
          </ElRadioButton>
        </ElRadioGroup>
      </div>

      <!-- 创建与更多操作 -->
      <div class="flex items-center gap-2">
        <ElButton
          v-if="editable && isActiveLifecycle"
          v-access:code="['pms:pm:work-item:create']"
          type="primary"
          @click="openCreateForm"
        >
          创建{{ workItemTypeName }}
        </ElButton>
        <ElDropdown trigger="click" @command="handleToolbarCommand">
          <ElButton aria-label="更多操作">
            <IconifyIcon icon="ep:more-filled" />
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem
                v-if="
                  editable &&
                  isActiveLifecycle &&
                  hasAccessByCodes(['pms:pm:work-item:update'])
                "
                command="status-config"
              >
                状态设置
              </ElDropdownItem>
              <ElDropdownItem
                v-if="
                  editable &&
                  isActiveLifecycle &&
                  hasAccessByCodes(['pms:pm:work-item:import'])
                "
                command="import"
              >
                导入
              </ElDropdownItem>
              <ElDropdownItem
                v-if="hasAccessByCodes(['pms:pm:work-item:export'])"
                command="export"
              >
                导出
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </div>
    </div>

    <template v-if="viewMode === 'list'">
      <!-- 列表 -->
      <Grid>
        <template #serialNumber="{ row }"> #{{ row.serialNumber }} </template>
        <template #name="{ row }">
          <ElButton link type="primary" @click="openDetail(row)">
            {{ row.name }}
          </ElButton>
        </template>
        <template #status="{ row }">
          <ElSelect
            v-if="editable && isActiveLifecycle"
            v-model="row.statusId"
            size="small"
            @change="handleStatusChange(row)"
          >
            <ElOption
              v-for="status in statusOptions"
              :key="status.id"
              :label="status.name"
              :value="status.id"
            />
          </ElSelect>
          <span v-else>{{ row.statusName }}</span>
        </template>
        <template #labels="{ row }">
          <ElSpace wrap>
            <ElTag
              v-for="label in row.labels"
              :key="label.id"
              :color="label.color"
              effect="dark"
              size="small"
            >
              {{ label.name }}
            </ElTag>
          </ElSpace>
        </template>
        <template #progress="{ row }">
          <ElProgress :percentage="row.progress" :stroke-width="8" />
        </template>
        <template #actions="{ row }">
          <TableAction
            :actions="[
              {
                label: '编辑',
                type: 'primary',
                link: true,
                icon: ACTION_ICON.EDIT,
                auth: ['pms:pm:work-item:update'],
                ifShow: editable && isActiveLifecycle,
                onClick: openEditForm.bind(null, row),
              },
              {
                label: '查看',
                type: 'primary',
                link: true,
                icon: ACTION_ICON.VIEW,
                ifShow: !editable || !isActiveLifecycle,
                onClick: openDetail.bind(null, row),
              },
              {
                label: '归档',
                link: true,
                auth: ['pms:pm:work-item:update'],
                ifShow: editable && isActiveLifecycle,
                onClick: handleArchive.bind(null, row),
              },
              {
                label: '回收站',
                type: 'danger',
                link: true,
                auth: ['pms:pm:work-item:update'],
                ifShow:
                  editable &&
                  queryParams.lifecycleStatus !==
                    PmsWorkItemLifecycleStatus.RECYCLED,
                onClick: handleRecycle.bind(null, row),
              },
              {
                label: '恢复',
                type: 'primary',
                link: true,
                auth: ['pms:pm:work-item:update'],
                ifShow: editable && !isActiveLifecycle,
                onClick: handleRestore.bind(null, row),
              },
              {
                label: '删除',
                type: 'danger',
                link: true,
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

    <div
      v-else
      v-loading="loading"
      class="flex min-h-[460px] gap-4 overflow-x-auto pb-3"
    >
      <!-- 看板 -->
      <section
        v-for="column in filteredBoard"
        :key="column.name"
        class="shrink-0 grow-0 basis-[300px] rounded-lg bg-[var(--el-fill-color-light)] p-3"
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
          <ElTag round size="small" type="info">
            {{ getBoardColumnItemCount(column) }}
          </ElTag>
        </header>
        <!-- 合并列按具体状态拆分投放区，避免拖入列后静默落到第一个状态 -->
        <div
          v-for="statusGroup in column.statusGroups"
          :key="statusGroup.status.id"
          class="mb-3 last:mb-0"
        >
          <div
            v-if="column.statusGroups.length > 1"
            class="mb-1.5 text-xs font-medium text-[var(--el-text-color-secondary)]"
          >
            {{ statusGroup.status.name }}
          </div>
          <draggable
            v-model="statusGroup.items"
            class="min-h-[90px] rounded border border-dashed border-[var(--el-border-color)] p-1.5"
            :disabled="boardSaving || !editable"
            group="pms-work-items"
            item-key="id"
            @add="handleBoardAdd($event, statusGroup)"
            @update="handleBoardSort(statusGroup)"
          >
            <template #item="{ element }">
              <article
                class="mb-2.5 cursor-pointer rounded-md border border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)] p-3 shadow-[var(--el-box-shadow-lighter)] last:mb-0"
                @click="openDetail(element)"
              >
                <div class="line-clamp-2 text-sm font-medium leading-[21px]">
                  {{ element.name }}
                </div>
                <div v-if="element.endTime" class="mt-2">
                  <ElTag
                    :type="isWorkItemOverdue(element) ? 'danger' : 'info'"
                    size="small"
                  >
                    {{ dayjs(element.endTime).format('MM月DD日') }}截止
                  </ElTag>
                </div>
                <div class="mt-3 flex items-center justify-between gap-2">
                  <span
                    class="flex items-center gap-1 text-xs text-[var(--el-text-color-secondary)]"
                  >
                    <IconifyIcon :size="15" icon="ep:list" />#{{
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
                    <ElTag
                      :type="getWorkItemStatusTagType(element.status)"
                      size="small"
                    >
                      {{ element.statusName }}
                    </ElTag>
                    <ElTooltip
                      :content="element.assigneeUserName || '未分配'"
                      placement="top"
                    >
                      <ElAvatar
                        :size="24"
                        :src="
                          memberMap.get(element.assigneeUserId || 0)?.avatar
                        "
                      >
                        {{ element.assigneeUserName?.slice(0, 1) || '未' }}
                      </ElAvatar>
                    </ElTooltip>
                  </div>
                </div>
              </article>
            </template>
          </draggable>
        </div>
      </section>
    </div>

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
