<script lang="ts" setup>
import type { PmsIterationApi } from '#/api/pms/pm/iteration';
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';

import { onMounted, reactive, ref } from 'vue';

import { confirm, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { getAllPageItems } from '@vben/utils';

import {
  Avatar,
  Button,
  Card,
  Dropdown,
  Empty,
  Input,
  Menu,
  MenuItem,
  message,
  Select,
  Spin,
  Tag,
} from 'antdv-next';
import dayjs from 'dayjs';
import draggable from 'vuedraggable';

import {
  completeIteration,
  createIteration,
  deleteIteration,
  getIterationPage,
} from '#/api/pms/pm/iteration';
import {
  createWorkItem,
  getWorkItemPage,
  recycleWorkItem,
  updateWorkItemIteration,
  updateWorkItemPlanningSort,
} from '#/api/pms/pm/workitem';
import IterationForm from '#/views/pms/pm/iteration/components/iteration-form.vue';
import IterationStartForm from '#/views/pms/pm/iteration/components/iteration-start-form.vue';
import {
  PmsIterationStatus,
  PmsWorkItemDefectType,
  PmsWorkItemPriority,
  PmsWorkItemType,
} from '#/views/pms/pm/utils/constants';
import {
  getIterationStatusTagType,
  getPriorityColor,
  getWorkItemStatusTagType,
} from '#/views/pms/pm/utils/format';
import WorkItemDetail from '#/views/pms/pm/workitem/detail/work-item-detail.vue';
import WorkItemForm from '#/views/pms/pm/workitem/form/work-item-form.vue';

defineOptions({ name: 'PmsPlanningBoard' });

// TODO @AI：看板可以保留自定义拖拽；antd/antdv-next 不要用 v-loading。日期格式抽到 format.ts，不要页面里 dayjs.format。
// TODO @AI：getPlanningData 先分页取全部迭代/待规划事项，再对每个迭代逐一分页取工作项，形成 N+1 且请求量随迭代数增长；优先补聚合规划接口或一次查询返回分组数据。

const props = defineProps<{
  editable: boolean;
  projectId: number;
  projectType: number;
}>();

interface QuickWorkItemDraft {
  name: string;
  type: number;
}

type PlanningIteration = Omit<PmsIterationApi.Iteration, 'id' | 'status'> & {
  expanded: boolean;
  id: number;
  list: PmsWorkItemApi.WorkItem[];
  status: number;
};

const loading = ref(true); // 加载中
const saving = ref(false); // 拖拽排序保存中
const creatingKey = ref(''); // 快速创建中的区域标识
const searchKeyword = ref(''); // 事项搜索关键字
const layoutMode = ref<'double' | 'single'>('double'); // 规划布局
const backlogCreating = ref(false); // 是否正在 Backlog 新建事项
const creatingIterationId = ref<number>(); // 正在新建事项的迭代编号
const iterationCreating = ref(false); // 是否正在新建迭代
const expandedIterationIds = new Set<number>(); // 缓存已展开的迭代
const iterationList = ref<PlanningIteration[]>([]); // 规划中的迭代列表
const unplannedWorkItems = ref<PmsWorkItemApi.WorkItem[]>([]); // 待规划工作项列表
const backlogDraft = reactive<QuickWorkItemDraft>({
  name: '',
  type: PmsWorkItemType.TASK,
}); // Backlog 快速创建草稿
const iterationDrafts = reactive<Record<number, QuickWorkItemDraft>>({}); // 各迭代快速创建草稿
const quickIterationName = ref(''); // 快速创建迭代名称
const draggedWorkItemId = ref<number>(); // 当前拖拽工作项编号

const [WorkItemFormModal, workItemFormModalApi] = useVbenModal({
  destroyOnClose: true,
  connectedComponent: WorkItemForm,
});
const [WorkItemDetailDrawer, workItemDetailDrawerApi] = useVbenDrawer({
  connectedComponent: WorkItemDetail,
});
const [IterationFormModal, iterationFormModalApi] = useVbenModal({
  destroyOnClose: true,
  connectedComponent: IterationForm,
});
const [IterationStartFormModal, iterationStartFormModalApi] = useVbenModal({
  destroyOnClose: true,
  connectedComponent: IterationStartForm,
});

/** 查询迭代规划数据 */
async function getPlanningData() {
  loading.value = true;
  try {
    // 并行加载页面所需数据
    const [plannedIterations, activeIterations, fetchedUnplannedWorkItems] =
      await Promise.all([
        getIterationList(PmsIterationStatus.PLANNED),
        getIterationList(PmsIterationStatus.ACTIVE),
        getWorkItemList({
          projectId: props.projectId,
          unplannedOnly: true,
          name: searchKeyword.value.trim() || undefined,
        }),
      ]);
    // 逐个加载迭代内工作项，并初始化快速创建草稿
    const projectIterations = [...activeIterations, ...plannedIterations];
    iterationList.value = await Promise.all(
      projectIterations.map(async (iteration) => {
        const iterationId = iteration.id!;
        iterationDrafts[iterationId] ||= {
          name: '',
          type: PmsWorkItemType.TASK,
        };
        return {
          ...iteration,
          id: iterationId,
          status: iteration.status!,
          expanded: expandedIterationIds.has(iterationId),
          list: await getWorkItemList({
            projectId: props.projectId,
            iterationId,
            name: searchKeyword.value.trim() || undefined,
          }),
        };
      }),
    );
    unplannedWorkItems.value = fetchedUnplannedWorkItems;
  } finally {
    loading.value = false;
  }
}

/** 查询指定状态的迭代列表 */
async function getIterationList(status: number) {
  return getAllPageItems<PmsIterationApi.Iteration>((pageNo, pageSize) =>
    getIterationPage({ pageNo, pageSize, projectId: props.projectId, status }),
  );
}

/** 查询规划视图的工作项列表 */
async function getWorkItemList(params: {
  iterationId?: number;
  name?: string;
  projectId: number;
  unplannedOnly?: boolean;
}) {
  return getAllPageItems<PmsWorkItemApi.WorkItem>((pageNo, pageSize) =>
    getWorkItemPage({ ...params, planningOnly: true, pageNo, pageSize }),
  );
}

/** 展开或折叠迭代，并保留刷新前的状态 */
function toggleIteration(iteration: PlanningIteration) {
  iteration.expanded = !iteration.expanded;
  if (iteration.expanded) {
    expandedIterationIds.add(iteration.id);
  } else {
    expandedIterationIds.delete(iteration.id);
  }
}

/** 处理工作项更多操作 */
function handleWorkItemCommand(
  command: string,
  workItem: PmsWorkItemApi.WorkItem,
) {
  if (command === 'edit') {
    workItemFormModalApi
      .setData({ formType: 'update', id: workItem.id })
      .open();
  } else if (command === 'recycle') {
    handleRecycleWorkItem(workItem);
  }
}

/** 将工作项移入回收站 */
async function handleRecycleWorkItem(workItem: PmsWorkItemApi.WorkItem) {
  try {
    await confirm(`确认将事项“${workItem.name}”移入回收站吗？`);
    await recycleWorkItem(workItem.id!);
    message.success('已移入回收站');
    await getPlanningData();
  } catch {
  }
}

/** 处理迭代操作 */
function handleIterationCommand(command: string, iteration: PlanningIteration) {
  if (command === 'start') {
    iterationStartFormModalApi.setData(iteration).open();
  } else if (command === 'complete') {
    handleCompleteIteration(iteration);
  } else if (command === 'edit') {
    iterationFormModalApi
      .setData({
        formType: 'update',
        id: iteration.id,
        projectId: props.projectId,
      })
      .open();
  } else if (command === 'delete') {
    handleDeleteIteration(iteration);
  }
}

/** 完成迭代 */
async function handleCompleteIteration(iteration: PlanningIteration) {
  try {
    await confirm(`确认完成迭代“${iteration.name}”吗？`);
    await completeIteration(iteration.id);
    expandedIterationIds.delete(iteration.id);
    message.success('迭代已完成');
    await getPlanningData();
  } catch {
  }
}

/** 删除迭代 */
async function handleDeleteIteration(iteration: PlanningIteration) {
  try {
    await confirm(`确认删除迭代“${iteration.name}”吗？`);
    await deleteIteration(iteration.id);
    expandedIterationIds.delete(iteration.id);
    message.success('删除成功');
    await getPlanningData();
  } catch {
  }
}

/** 记录当前拖拽工作项，支持投放到折叠迭代标题 */
function handlePlanningDragStart(event: { item?: HTMLElement }) {
  const workItemId = event.item?.dataset.workItemId;
  draggedWorkItemId.value = workItemId ? Number(workItemId) : undefined;
}

/** 将工作项投放到折叠的迭代标题 */
async function handleCollapsedIterationDrop(iteration: PlanningIteration) {
  const workItemId = draggedWorkItemId.value;
  if (
    iteration.expanded ||
    !workItemId ||
    iteration.list.some((item) => item.id === workItemId)
  ) {
    return;
  }
  saving.value = true;
  try {
    await updateWorkItemIteration(workItemId, iteration.id);
    await updateWorkItemPlanningSort(props.projectId, iteration.id, [
      ...iteration.list.map((item) => item.id!),
      workItemId,
    ]);
    message.success(`已规划到“${iteration.name}”`);
    await getPlanningData();
  } catch {
    await getPlanningData();
  } finally {
    saving.value = false;
    draggedWorkItemId.value = undefined;
  }
}

/** 打开工作项详情 */
function openWorkItem(workItem: PmsWorkItemApi.WorkItem) {
  workItemDetailDrawerApi.setData({ id: workItem.id! }).open();
}

/** 拖拽工作项到迭代 */
async function handlePlanDrop(
  iteration: PlanningIteration,
  event: { newIndex: number },
) {
  // 获得拖入目标迭代的工作项
  const workItem = iteration.list[event.newIndex];
  if (!workItem) {
    return;
  }
  // 更新所属迭代和迭代内排序
  saving.value = true;
  try {
    await updateWorkItemIteration(workItem.id!, iteration.id);
    await updateWorkItemPlanningSort(
      props.projectId,
      iteration.id,
      iteration.list.map((item) => item.id!),
    );
    message.success(`已规划到“${iteration.name}”`);
  } catch {
    await getPlanningData();
  } finally {
    saving.value = false;
  }
}

/** 拖拽工作项回待规划 */
async function handleUnplanDrop(event: { newIndex: number }) {
  // 获得拖回待规划区域的工作项
  const workItem = unplannedWorkItems.value[event.newIndex];
  if (!workItem) {
    return;
  }
  // 清空所属迭代并保存待规划列表排序
  saving.value = true;
  try {
    await updateWorkItemIteration(workItem.id!);
    await updateWorkItemPlanningSort(
      props.projectId,
      undefined,
      unplannedWorkItems.value.map((item) => item.id!),
    );
    message.success('已移回待规划');
  } catch {
    await getPlanningData();
  } finally {
    saving.value = false;
  }
}

/** 保存规划列表排序 */
async function handlePlanningSort(
  iterationId: number | undefined,
  list: PmsWorkItemApi.WorkItem[],
  event: {
    from?: HTMLElement;
    newIndex?: number;
    oldIndex?: number;
    to?: HTMLElement;
  },
) {
  // 跨列表拖拽由对应的规划方法处理，这里只保存当前列表内排序
  if (
    event.from !== event.to ||
    event.oldIndex === event.newIndex ||
    saving.value
  ) {
    return;
  }
  saving.value = true;
  try {
    await updateWorkItemPlanningSort(
      props.projectId,
      iterationId,
      list.map((item) => item.id!),
    );
    message.success('排序已保存');
  } catch {
    await getPlanningData();
  } finally {
    saving.value = false;
  }
}

/** 快速创建工作项 */
async function createQuickWorkItem(
  draft: QuickWorkItemDraft,
  iterationId?: number,
) {
  // 校验工作项标题
  const name = draft.name.trim();
  if (!name) {
    message.warning('请输入事项标题');
    return;
  }
  // 创建工作项
  creatingKey.value = iterationId ? `iteration-${iterationId}` : 'backlog';
  try {
    await createWorkItem({
      projectId: props.projectId,
      type: draft.type,
      name,
      priority: PmsWorkItemPriority.MEDIUM,
      memberUserIds: [],
      defectType:
        draft.type === PmsWorkItemType.DEFECT
          ? PmsWorkItemDefectType.FUNCTION
          : undefined,
      iterationId,
      fileUrls: [],
      labelIds: [],
    });
    // 清空草稿并刷新规划数据
    draft.name = '';
    backlogCreating.value = false;
    creatingIterationId.value = undefined;
    message.success('事项创建成功');
    await getPlanningData();
  } finally {
    creatingKey.value = '';
  }
}

/** 快速创建迭代 */
async function createQuickIteration() {
  // 校验迭代名称
  const name = quickIterationName.value.trim();
  if (!name) {
    message.warning('请输入迭代名称');
    return;
  }
  // 创建待开始迭代
  creatingKey.value = 'iteration';
  try {
    await createIteration({
      projectId: props.projectId,
      name,
    });
    // 清空草稿并刷新规划数据
    quickIterationName.value = '';
    iterationCreating.value = false;
    message.success('迭代创建成功');
    await getPlanningData();
  } finally {
    creatingKey.value = '';
  }
}

defineExpose({ refresh: getPlanningData });

/** 初始化 */
onMounted(() => {
  getPlanningData();
});
</script>

<template>
  <!-- 待规划工作项 -->
  <Spin :spinning="loading">
    <!-- 搜索与布局 -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Input
        v-model:value="searchKeyword"
        allow-clear
        class="!w-[240px]"
        placeholder="搜索事项"
        @clear="getPlanningData"
        @press-enter="getPlanningData"
      />
      <Select
        v-model:value="layoutMode"
        class="!w-[130px]"
        :options="[
          { label: '双栏展示', value: 'double' },
          { label: '单栏展示', value: 'single' },
        ]"
      />
    </div>

    <!-- Backlog 与迭代规划面板 -->
    <div
      class="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-4 max-[1200px]:grid-cols-1"
      :class="{ '!grid-cols-1': layoutMode === 'single' }"
    >
      <!-- Backlog 区域：展示尚未规划到迭代的工作项 -->
      <Card>
        <template #title>
          <span class="font-semibold">Backlog 共 {{ unplannedWorkItems.length }} 个事项</span>
        </template>
        <draggable
          v-model="unplannedWorkItems"
          class="min-h-[420px] p-1"
          :disabled="!editable || saving || Boolean(searchKeyword.trim())"
          group="pms-planning"
          item-key="id"
          @start="handlePlanningDragStart"
          @add="handleUnplanDrop"
          @end="handlePlanningSort(undefined, unplannedWorkItems, $event)"
        >
          <template #item="{ element }">
            <article
              :data-work-item-id="element.id"
              class="mb-2 flex cursor-move items-center gap-3 rounded-md border border-solid border-border bg-background p-3 hover:border-primary"
            >
              <div
                class="flex min-w-0 flex-1 items-center justify-between gap-3"
              >
                <Button type="link" @click.stop="openWorkItem(element)">
                  #{{ element.serialNumber }} {{ element.name }}
                </Button>
                <div class="flex shrink-0 items-center gap-2.5">
                  <span
                    class="flex items-center gap-1 text-xs"
                    :style="{ color: getPriorityColor(element.priority) }"
                  >
                    <span class="h-2 w-2 rounded-full bg-current"></span>
                    {{ getDictLabel(DICT_TYPE.PMS_WORK_ITEM_PRIORITY, element.priority) || '-' }}
                  </span>
                  <Tag :color="getWorkItemStatusTagType(element.status)">
                    {{ element.statusName }}
                  </Tag>
                  <Avatar :size="24">
                    {{ element.assigneeUserName?.slice(0, 1) || '未' }}
                  </Avatar>
                  <Dropdown v-if="editable">
                    <Button type="link" @click.stop>
                      <IconifyIcon icon="lucide:ellipsis" />
                    </Button>
                    <template #popupRender>
                      <Menu
                        @click="
                          ({ key }: any) => handleWorkItemCommand(key, element)
                        "
                      >
                        <MenuItem key="edit">编辑事项</MenuItem>
                        <MenuItem key="recycle">移入回收站</MenuItem>
                      </Menu>
                    </template>
                  </Dropdown>
                </div>
              </div>
            </article>
          </template>
        </draggable>
        <Button
          v-if="editable && !backlogCreating"
          class="mt-2"
          type="link"
          @click="backlogCreating = true"
        >
          <IconifyIcon icon="lucide:plus" />新建事项
        </Button>
        <div
          v-if="editable && backlogCreating"
          class="flex items-center gap-2 border-0 border-t border-solid border-border pt-3"
          @click.stop
        >
          <Select
            v-model:value="backlogDraft.type"
            class="!w-[92px]"
            :options="
              getDictOptions(DICT_TYPE.PMS_WORK_ITEM_TYPE, 'number').map(
                (item) => ({
                label: item.label,
                value: item.value,
                }),
              )
            "
          />
          <Input
            v-model:value="backlogDraft.name"
            :maxlength="100"
            placeholder="快速创建待规划事项"
            @press-enter="createQuickWorkItem(backlogDraft)"
          />
          <Button
            v-access:code="['pms:pm:work-item:create']"
            :loading="creatingKey === 'backlog'"
            type="primary"
            @click="createQuickWorkItem(backlogDraft)"
          >
            创建
          </Button>
          <Button @click="backlogCreating = false">取消</Button>
        </div>
      </Card>

      <!-- 迭代规划区域：按迭代组织工作项，并支持跨区域拖拽规划 -->
      <div class="flex flex-col gap-3">
        <Empty v-if="iterationList.length === 0" description="暂无可规划迭代" />
        <Card v-for="iteration in iterationList" :key="iteration.id">
          <template #title>
            <div
              class="flex cursor-pointer items-center justify-between gap-4"
              @dragover.prevent="!iteration.expanded"
              @drop.prevent="handleCollapsedIterationDrop(iteration)"
              @click="toggleIteration(iteration)"
            >
              <div class="flex min-w-0 items-center gap-2">
                <IconifyIcon
                  :icon="
                    iteration.expanded
                      ? 'lucide:chevron-down'
                      : 'lucide:chevron-right'
                  "
                />
                <span class="truncate font-medium">{{ iteration.name }}</span>
                <span class="shrink-0 text-[13px] text-muted-foreground">
                  共 {{ iteration.list.length }} 个事项
                </span>
                <Dropdown v-if="editable" :trigger="['click']">
                  <Button type="link" @click.stop>
                    <IconifyIcon icon="lucide:ellipsis" />
                  </Button>
                  <template #popupRender>
                    <Menu
                      @click="
                        ({ key }: any) => handleIterationCommand(key, iteration)
                      "
                    >
                      <MenuItem
                        v-if="iteration.status === PmsIterationStatus.PLANNED"
                        v-access:code="['pms:pm:iteration:update']"
                        key="start"
                      >
                        开始迭代
                      </MenuItem>
                      <MenuItem
                        v-if="iteration.status === PmsIterationStatus.ACTIVE"
                        v-access:code="['pms:pm:iteration:update']"
                        key="complete"
                      >
                        完成迭代
                      </MenuItem>
                      <MenuItem
                        v-access:code="['pms:pm:iteration:update']"
                        key="edit"
                      >
                        编辑迭代
                      </MenuItem>
                      <MenuItem
                        v-access:code="['pms:pm:iteration:delete']"
                        key="delete"
                      >
                        删除迭代
                      </MenuItem>
                    </Menu>
                  </template>
                </Dropdown>
              </div>
              <div class="flex shrink-0 items-center gap-3">
                <span class="text-xs text-muted-foreground">
                  {{
                    iteration.startTime
                      ? dayjs(iteration.startTime).format('YYYY-MM-DD')
                      : '--'
                  }}
                  至
                  {{
                    iteration.endTime
                      ? dayjs(iteration.endTime).format('YYYY-MM-DD')
                      : '--'
                  }}
                </span>
                <Tag :color="getIterationStatusTagType(iteration.status)">
                  {{ getDictLabel(DICT_TYPE.PMS_ITERATION_STATUS, iteration.status) || '-' }}
                </Tag>
              </div>
            </div>
          </template>
          <draggable
            v-show="iteration.expanded"
            v-model="iteration.list"
            class="min-h-[72px] p-1"
            :disabled="!editable || saving || Boolean(searchKeyword.trim())"
            group="pms-planning"
            item-key="id"
            @start="handlePlanningDragStart"
            @add="handlePlanDrop(iteration, $event)"
            @end="handlePlanningSort(iteration.id, iteration.list, $event)"
          >
            <template #item="{ element }">
              <article
                :data-work-item-id="element.id"
                class="mb-2 flex cursor-move items-center gap-3 rounded-md border border-solid border-border bg-background p-3 hover:border-primary"
              >
                <div
                  class="flex min-w-0 flex-1 items-center justify-between gap-3"
                >
                  <Button type="link" @click.stop="openWorkItem(element)">
                    #{{ element.serialNumber }} {{ element.name }}
                  </Button>
                  <div class="flex shrink-0 items-center gap-2.5">
                    <span
                      class="flex items-center gap-1 text-xs"
                      :style="{ color: getPriorityColor(element.priority) }"
                    >
                      <span class="h-2 w-2 rounded-full bg-current"></span>
                      {{ getDictLabel(DICT_TYPE.PMS_WORK_ITEM_PRIORITY, element.priority) || '-' }}
                    </span>
                    <Tag :color="getWorkItemStatusTagType(element.status)">
                      {{ element.statusName }}
                    </Tag>
                    <Avatar :size="24">
                      {{ element.assigneeUserName?.slice(0, 1) || '未' }}
                    </Avatar>
                    <Dropdown v-if="editable">
                      <Button type="link" @click.stop>
                        <IconifyIcon icon="lucide:ellipsis" />
                      </Button>
                      <template #popupRender>
                        <Menu
                          @click="
                            ({ key }: any) =>
                              handleWorkItemCommand(key, element)
                          "
                        >
                          <MenuItem key="edit">编辑事项</MenuItem>
                          <MenuItem key="recycle">移入回收站</MenuItem>
                        </Menu>
                      </template>
                    </Dropdown>
                  </div>
                </div>
              </article>
            </template>
          </draggable>
          <Button
            v-if="
              editable &&
              iteration.expanded &&
              creatingIterationId !== iteration.id
            "
            class="mt-2"
            type="link"
            @click="creatingIterationId = iteration.id"
          >
            <IconifyIcon icon="lucide:plus" />新建事项
          </Button>
          <div
            v-if="
              editable &&
              iteration.expanded &&
              creatingIterationId === iteration.id
            "
            class="flex items-center gap-2 border-0 border-t border-solid border-border pt-3"
            @click.stop
          >
            <Select
              v-model:value="iterationDrafts[iteration.id]!.type"
              class="!w-[92px]"
              :options="
                getDictOptions(DICT_TYPE.PMS_WORK_ITEM_TYPE, 'number').map(
                  (item) => ({
                  label: item.label,
                  value: item.value,
                  }),
                )
              "
            />
            <Input
              v-model:value="iterationDrafts[iteration.id]!.name"
              :maxlength="100"
              :placeholder="`在“${iteration.name}”中快速创建事项`"
              @press-enter="
                createQuickWorkItem(
                  iterationDrafts[iteration.id]!,
                  iteration.id,
                )
              "
            />
            <Button
              v-access:code="['pms:pm:work-item:create']"
              :loading="creatingKey === `iteration-${iteration.id}`"
              type="primary"
              @click="
                createQuickWorkItem(
                  iterationDrafts[iteration.id]!,
                  iteration.id,
                )
              "
            >
              创建
            </Button>
            <Button @click="creatingIterationId = undefined">取消</Button>
          </div>
        </Card>
        <Button
          v-if="editable && !iterationCreating"
          class="self-start"
          type="link"
          @click="iterationCreating = true"
        >
          <IconifyIcon icon="lucide:plus" />新建迭代
        </Button>
        <Card v-if="editable && iterationCreating">
          <div class="flex items-center gap-2">
            <Input
              v-model:value="quickIterationName"
              :maxlength="100"
              placeholder="快速创建迭代"
              @press-enter="createQuickIteration"
            />
            <Button
              v-access:code="['pms:pm:iteration:create']"
              :loading="creatingKey === 'iteration'"
              type="primary"
              @click="createQuickIteration"
            >
              创建迭代
            </Button>
            <Button @click="iterationCreating = false">取消</Button>
          </div>
        </Card>
      </div>
    </div>

    <!-- 工作项编辑表单 -->
    <WorkItemFormModal @success="getPlanningData" />
    <!-- 工作项详情 -->
    <WorkItemDetailDrawer @success="getPlanningData" />
    <IterationFormModal @success="getPlanningData" />
    <IterationStartFormModal @success="getPlanningData" />
  </Spin>
</template>
