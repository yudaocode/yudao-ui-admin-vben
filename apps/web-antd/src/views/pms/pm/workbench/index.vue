<script lang="ts" setup>
import type { PmsProjectMemberApi } from '#/api/pms/pm/project/member';
import type { PmsWorkbenchApi } from '#/api/pms/pm/workbench';
import type { PmsWorkItemStatusApi } from '#/api/pms/pm/workitem/status';

import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Badge,
  Button,
  DatePicker,
  Input,
  message,
  Select,
  Table,
  Tabs,
} from 'ant-design-vue';

import { getProjectMemberList } from '#/api/pms/pm/project/member';
import {
  getWorkbenchCount,
  getWorkbenchIterationPage,
  getWorkbenchWorkItemPage,
} from '#/api/pms/pm/workbench';
import { getWorkItem, updateWorkItem, updateWorkItemStatus } from '#/api/pms/pm/workitem';
import { getWorkItemStatusList } from '#/api/pms/pm/workitem/status';
import IterationSelect from '#/views/pms/pm/iteration/components/iteration-select.vue';
import {
  PmsWorkbenchTab,
  PmsWorkbenchTabOptions,
  PmsWorkItemPriorityOptions,
  PmsWorkItemStatusType,
  PmsWorkItemType,
} from '#/views/pms/pm/utils/constants';
import { getIterationStatusName, getPriorityName } from '#/views/pms/pm/utils/format';
import WorkItemDetail from '#/views/pms/pm/workitem/detail/work-item-detail.vue';

import ProjectSelect from './components/project-select.vue';

defineOptions({ name: 'PmsWorkbench' });

type WorkbenchTab = (typeof PmsWorkbenchTab)[keyof typeof PmsWorkbenchTab];
type QuickUpdateField = 'assigneeUserId' | 'endTime' | 'priority';
type QuickEditField = 'statusId' | QuickUpdateField;

const { push } = useRouter(); // 路由操作
const activeTab = ref<WorkbenchTab>(PmsWorkbenchTab.ALL); // 当前事项类型
const tabs = PmsWorkbenchTabOptions; // 工作台事项页签
const priorityOptions = PmsWorkItemPriorityOptions; // 工作项优先级选项
const countData = ref<PmsWorkbenchApi.WorkbenchCount>({
  requirementCount: 0,
  taskCount: 0,
  defectCount: 0,
  iterationCount: 0,
}); // 各事项数量
const displayCountData = computed(() => ({
  ...countData.value,
  allCount:
    countData.value.requirementCount +
    countData.value.taskCount +
    countData.value.defectCount,
})); // “全部”页签只展示工作项，不包含独立的迭代页签
const loading = ref(false); // 列表加载中
const workItemList = ref<PmsWorkbenchApi.WorkbenchWorkItem[]>([]); // 工作项列表
const iterationList = ref<PmsWorkbenchApi.WorkbenchIteration[]>([]); // 迭代列表
const total = ref(0); // 列表总数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  projectId: undefined as number | undefined,
  name: undefined as string | undefined,
  status: undefined as number | undefined,
  priority: undefined as number | undefined,
  iterationId: undefined as number | undefined,
  endTime: undefined as string[] | undefined,
}); // 查询参数
const statusOptionMap = ref<Record<string, PmsWorkItemStatusApi.WorkItemStatus[]>>({}); // 状态选项
const memberOptionMap = ref<Record<number, PmsProjectMemberApi.ProjectMember[]>>({}); // 成员选项
const quickEditingKey = ref<string>(); // 当前行内编辑字段

const workItemColumns = [
  { key: 'serialNumber', title: 'ID', width: 90 },
  { key: 'name', title: '标题' },
  { key: 'priority', title: '优先级', width: 120 },
  { key: 'statusId', title: '状态', width: 140 },
  { key: 'assigneeUserId', title: '处理人', width: 150 },
  { dataIndex: 'creatorUserName', key: 'creatorUserName', title: '创建人', width: 120 },
  { dataIndex: 'projectName', key: 'projectName', title: '所属项目' },
  { key: 'endTime', title: '截止日期', width: 190 },
  { key: 'createTime', title: '创建日期', width: 180 },
];

const iterationColumns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 100 },
  { key: 'name', title: '标题' },
  { key: 'status', title: '状态', width: 120 },
  { dataIndex: 'projectName', key: 'projectName', title: '所属项目' },
  { key: 'startTime', title: '开始日期', width: 180 },
  { key: 'endTime', title: '截止日期', width: 180 },
];

/** 获得行内编辑字段键 */
function getQuickEditKey(item: PmsWorkbenchApi.WorkbenchWorkItem, field: QuickEditField) {
  return `${item.id}-${field}`;
}

/** 判断字段是否处于行内编辑状态 */
function isQuickEditing(item: PmsWorkbenchApi.WorkbenchWorkItem, field: QuickEditField) {
  return quickEditingKey.value === getQuickEditKey(item, field);
}

/** 开始行内编辑 */
async function startQuickEdit(item: PmsWorkbenchApi.WorkbenchWorkItem, field: QuickEditField) {
  quickEditingKey.value = getQuickEditKey(item, field);
  if (field === 'statusId') {
    await getStatusOptions(item, true);
  } else if (field === 'assigneeUserId') {
    await getMemberOptions(item.projectId, true);
  }
}

/** 取消行内编辑 */
function cancelQuickEdit() {
  quickEditingKey.value = undefined;
}

/** 点击当前编辑器外部时退出行内编辑 */
function handleDocumentPointerDown(event: PointerEvent) {
  if (!quickEditingKey.value || !(event.target instanceof Element)) {
    return;
  }
  const activeEditor = document.querySelector(
    '.pms-workbench-table .ant-select, .pms-workbench-table .ant-picker',
  );
  const isEditorClick = activeEditor?.contains(event.target);
  const isPopupClick = event.target.closest(
    '.ant-select-dropdown, .ant-picker-dropdown',
  );
  if (!isEditorClick && !isPopupClick) {
    cancelQuickEdit();
  }
}

/** 查询工作台列表 */
async function getWorkbenchItemList() {
  loading.value = true;
  try {
    const params = { ...queryParams, type: getWorkItemType() };
    if (activeTab.value === PmsWorkbenchTab.ITERATION) {
      const data = await getWorkbenchIterationPage(params);
      iterationList.value = data.list;
      workItemList.value = [];
      total.value = data.total;
      return;
    }
    const data = await getWorkbenchWorkItemPage(params);
    workItemList.value = data.list;
    iterationList.value = [];
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

/** 查询各页签数量 */
async function getCount() {
  countData.value = await getWorkbenchCount(queryParams);
}

/** 获得当前页签的工作项类型 */
function getWorkItemType(): number | undefined {
  const typeMap: Record<string, number> = {
    [PmsWorkbenchTab.REQUIREMENT]: PmsWorkItemType.REQUIREMENT,
    [PmsWorkbenchTab.TASK]: PmsWorkItemType.TASK,
    [PmsWorkbenchTab.DEFECT]: PmsWorkItemType.DEFECT,
  };
  return typeMap[activeTab.value];
}

/** 搜索工作台 */
function handleQuery() {
  queryParams.pageNo = 1;
  refreshWorkbench();
}

/** 重置工作台筛选条件 */
function resetQuery() {
  queryParams.name = undefined;
  queryParams.status = undefined;
  queryParams.priority = undefined;
  queryParams.iterationId = undefined;
  queryParams.endTime = undefined;
  handleQuery();
}

/** 获得工作项选项缓存键 */
function getWorkItemOptionKey(item: PmsWorkbenchApi.WorkbenchWorkItem) {
  return `${item.projectId}-${item.type}`;
}

/** 获得工作项状态选项 */
function getStatusOptionList(item: PmsWorkbenchApi.WorkbenchWorkItem) {
  return (
    statusOptionMap.value[getWorkItemOptionKey(item)] || [
      {
        id: item.statusId,
        projectId: item.projectId,
        workItemType: item.type,
        name: item.statusName,
        statusType: item.status,
        boardName: '',
        defaultStatus: false,
        sort: 0,
      },
    ]
  );
}

/** 获得项目成员选项 */
function getMemberOptionList(item: PmsWorkbenchApi.WorkbenchWorkItem) {
  const cachedOptions = memberOptionMap.value[item.projectId];
  if (cachedOptions) {
    return cachedOptions;
  }
  return item.assigneeUserId
    ? [
        {
          userId: item.assigneeUserId,
          nickname: item.assigneeUserName || `用户 #${item.assigneeUserId}`,
          level: 0,
          creatorStatus: false,
        },
      ]
    : [];
}

/** 查询工作项状态选项 */
async function getStatusOptions(item: PmsWorkbenchApi.WorkbenchWorkItem, visible: boolean) {
  const key = getWorkItemOptionKey(item);
  if (!visible || statusOptionMap.value[key]) {
    return;
  }
  statusOptionMap.value[key] = await getWorkItemStatusList(item.projectId, item.type);
}

/** 查询项目成员选项 */
async function getMemberOptions(projectId: number, visible: boolean) {
  if (!visible || memberOptionMap.value[projectId]) {
    return;
  }
  memberOptionMap.value[projectId] = await getProjectMemberList(projectId);
}

/** 修改工作项状态 */
async function handleStatusChange(item: PmsWorkbenchApi.WorkbenchWorkItem) {
  cancelQuickEdit();
  try {
    await updateWorkItemStatus(item.id, item.statusId);
    message.success('状态已更新');
  } finally {
    await refreshWorkbench();
  }
}

/** 快速修改工作项字段 */
async function handleQuickUpdate(
  item: PmsWorkbenchApi.WorkbenchWorkItem,
  field: QuickUpdateField,
) {
  cancelQuickEdit();
  try {
    // 1. 查询完整工作项，避免快速修改覆盖未展示字段
    const workItem = await getWorkItem(item.id);
    // 2. 合并并提交当前字段
    await updateWorkItem({ ...workItem, [field]: item[field] });
    message.success('工作项已更新');
  } finally {
    await refreshWorkbench();
  }
}

const [WorkItemDetailDrawer, workItemDetailDrawerApi] = useVbenDrawer({
  connectedComponent: WorkItemDetail,
});

/** 打开工作项详情 */
function openWorkItem(item: PmsWorkbenchApi.WorkbenchWorkItem) {
  workItemDetailDrawerApi.setData({ id: item.id }).open();
}

/** 打开迭代详情 */
async function openIteration(item: PmsWorkbenchApi.WorkbenchIteration) {
  await push({
    name: 'PmsIterationDetail',
    params: {
      id: item.id,
    },
  });
}

/** 切换项目 */
async function handleProjectChange() {
  queryParams.pageNo = 1;
  queryParams.iterationId = undefined;
  await refreshWorkbench();
}

/** 切换页签 */
function handleTabChange() {
  queryParams.pageNo = 1;
  getWorkbenchItemList();
}

/** 刷新工作台 */
async function refreshWorkbench() {
  await Promise.all([getCount(), getWorkbenchItemList()]);
}

/** 初始化 */
onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown, true);
  refreshWorkbench();
});

/** 销毁页面事件 */
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown, true);
});
</script>

<template>
  <Page auto-content-height>
    <!-- 搜索工作栏 -->
    <!-- TODO @AI：这块是不是对齐 vue3 + ep 的风格？ -->
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <ProjectSelect
        v-model="queryParams.projectId"
        class="!w-[240px]"
        @change="handleProjectChange"
      />
      <Input
        v-model:value="queryParams.name"
        allow-clear
        class="!w-[240px]"
        placeholder="搜索标题或编号"
        @press-enter="handleQuery"
      />
      <Select
        v-model:value="queryParams.status"
        allow-clear
        class="!w-[240px]"
        :options="[
          { label: '未开始', value: PmsWorkItemStatusType.PENDING },
          { label: '进行中', value: PmsWorkItemStatusType.PROCESSING },
          { label: '已完成', value: PmsWorkItemStatusType.COMPLETED },
        ]"
        placeholder="全部状态"
      />
      <Select
        v-model:value="queryParams.priority"
        allow-clear
        class="!w-[240px]"
        :options="priorityOptions.map((item) => ({ label: item.label, value: item.value }))"
        placeholder="全部优先级"
      />
      <IterationSelect
        v-if="queryParams.projectId"
        v-model="queryParams.iterationId"
        class="!w-[240px]"
        :project-id="queryParams.projectId"
        placeholder="全部迭代"
      />
      <DatePicker.RangePicker
        v-model:value="(queryParams.endTime as any)"
        class="!w-[240px]"
        value-format="YYYY-MM-DD HH:mm:ss"
      />
      <Button @click="handleQuery">搜索</Button>
      <Button @click="resetQuery">重置</Button>
    </div>

    <div>
      <!-- 工作项类型 -->
      <Tabs v-model:active-key="activeTab" class="workbench-tabs" @change="handleTabChange">
        <Tabs.TabPane v-for="tab in tabs" :key="tab.value">
          <template #tab>
            <Badge
              :count="
                displayCountData[tab.countKey as keyof typeof displayCountData] === 0
                  ? 0
                  : displayCountData[tab.countKey as keyof typeof displayCountData]
              "
              :show-zero="false"
            >
              <span class="px-1.5">{{ tab.label }}</span>
            </Badge>
          </template>
        </Tabs.TabPane>
      </Tabs>

      <!-- 工作项表格 -->
      <!-- TODO @AI：这块可以使用 vxe data 方式么？ -->
      <Table
        v-if="activeTab !== PmsWorkbenchTab.ITERATION"
        :columns="workItemColumns"
        :data-source="workItemList"
        :loading="loading"
        :pagination="{
          current: queryParams.pageNo,
          pageSize: queryParams.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (count: number) => `共 ${count} 条`,
        }"
        class="pms-workbench-table"
        row-key="id"
        size="middle"
        @change="
          (pagination: any) => {
            queryParams.pageNo = pagination.current;
            queryParams.pageSize = pagination.pageSize;
            getWorkbenchItemList();
          }
        "
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'serialNumber'">
            #{{ record.serialNumber }}
          </template>
          <template v-else-if="column.key === 'name'">
            <Button type="link" @click="openWorkItem(record as PmsWorkbenchApi.WorkbenchWorkItem)">
              {{ record.name }}
            </Button>
          </template>
          <template v-else-if="column.key === 'priority'">
            <Select
              v-if="isQuickEditing(record as PmsWorkbenchApi.WorkbenchWorkItem, 'priority')"
              v-model:value="record.priority"
              :options="
                priorityOptions.map((item) => ({ label: item.label, value: item.value }))
              "
              @blur="cancelQuickEdit"
              @change="handleQuickUpdate(record as PmsWorkbenchApi.WorkbenchWorkItem, 'priority')"
              @keyup.esc.stop="cancelQuickEdit"
            />
            <Button
              v-else-if="record.writeStatus"
              type="link"
              @click="startQuickEdit(record as PmsWorkbenchApi.WorkbenchWorkItem, 'priority')"
            >
              {{ getPriorityName(record.priority) }}
            </Button>
            <span v-else>{{ getPriorityName(record.priority) }}</span>
          </template>
          <template v-else-if="column.key === 'statusId'">
            <Select
              v-if="isQuickEditing(record as PmsWorkbenchApi.WorkbenchWorkItem, 'statusId')"
              v-model:value="record.statusId"
              :options="
                getStatusOptionList(record as PmsWorkbenchApi.WorkbenchWorkItem).map((status) => ({
                  label: status.name,
                  value: status.id,
                }))
              "
              @blur="cancelQuickEdit"
              @dropdown-visible-change="getStatusOptions(record as PmsWorkbenchApi.WorkbenchWorkItem, $event)"
              @change="handleStatusChange(record as PmsWorkbenchApi.WorkbenchWorkItem)"
              @keyup.esc.stop="cancelQuickEdit"
            />
            <Button
              v-else-if="record.writeStatus"
              type="link"
              @click="startQuickEdit(record as PmsWorkbenchApi.WorkbenchWorkItem, 'statusId')"
            >
              {{ record.statusName }}
            </Button>
            <span v-else>{{ record.statusName }}</span>
          </template>
          <template v-else-if="column.key === 'assigneeUserId'">
            <Select
              v-if="isQuickEditing(record as PmsWorkbenchApi.WorkbenchWorkItem, 'assigneeUserId')"
              v-model:value="record.assigneeUserId"
              allow-clear
              :options="
                getMemberOptionList(record as PmsWorkbenchApi.WorkbenchWorkItem).map((member) => ({
                  label: member.nickname,
                  value: member.userId,
                }))
              "
              option-filter-prop="label"
              show-search
              @blur="cancelQuickEdit"
              @dropdown-visible-change="getMemberOptions((record as PmsWorkbenchApi.WorkbenchWorkItem).projectId, $event)"
              @change="handleQuickUpdate(record as PmsWorkbenchApi.WorkbenchWorkItem, 'assigneeUserId')"
              @keyup.esc.stop="cancelQuickEdit"
            />
            <Button
              v-else-if="record.writeStatus"
              type="link"
              @click="startQuickEdit(record as PmsWorkbenchApi.WorkbenchWorkItem, 'assigneeUserId')"
            >
              {{ record.assigneeUserName || '未分配' }}
            </Button>
            <span v-else>{{ record.assigneeUserName || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'endTime'">
            <DatePicker
              v-if="isQuickEditing(record as PmsWorkbenchApi.WorkbenchWorkItem, 'endTime')"
              v-model:value="record.endTime"
              allow-clear
              class="!w-[170px]"
              placeholder="截止日期"
              show-time
              value-format="x"
              @blur="cancelQuickEdit"
              @change="handleQuickUpdate(record as PmsWorkbenchApi.WorkbenchWorkItem, 'endTime')"
              @keyup.esc.stop="cancelQuickEdit"
            />
            <Button
              v-else-if="record.writeStatus"
              type="link"
              @click="startQuickEdit(record as PmsWorkbenchApi.WorkbenchWorkItem, 'endTime')"
            >
              {{ formatDateTime(record.endTime) || '未设置' }}
            </Button>
            <span v-else>{{ formatDateTime(record.endTime) || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDateTime(record.createTime) }}
          </template>
        </template>
      </Table>

      <!-- 迭代列表 -->
      <Table
        v-else
        :columns="iterationColumns"
        :data-source="iterationList"
        :loading="loading"
        :pagination="{
          current: queryParams.pageNo,
          pageSize: queryParams.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (count: number) => `共 ${count} 条`,
        }"
        row-key="id"
        size="middle"
        @change="
          (pagination: any) => {
            queryParams.pageNo = pagination.current;
            queryParams.pageSize = pagination.pageSize;
            getWorkbenchItemList();
          }
        "
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <Button type="link" @click="openIteration(record as PmsWorkbenchApi.WorkbenchIteration)">
              {{ record.name }}
            </Button>
          </template>
          <template v-else-if="column.key === 'status'">
            {{ getIterationStatusName(record.status) }}
          </template>
          <template v-else-if="column.key === 'startTime'">
            {{ formatDateTime(record.startTime) }}
          </template>
          <template v-else-if="column.key === 'endTime'">
            {{ formatDateTime(record.endTime) }}
          </template>
        </template>
      </Table>
    </div>

    <!-- 工作项详情 -->
    <WorkItemDetailDrawer @success="refreshWorkbench" />
  </Page>
</template>

<style lang="scss" scoped>
.workbench-tabs {
  :deep(.ant-tabs-nav) {
    margin-bottom: 0;
  }
}
</style>
