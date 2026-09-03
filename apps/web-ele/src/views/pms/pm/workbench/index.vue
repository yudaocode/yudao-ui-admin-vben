<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectMemberApi } from '#/api/pms/pm/project/member';
import type { PmsWorkbenchApi } from '#/api/pms/pm/workbench';
import type { PmsWorkItemStatusApi } from '#/api/pms/pm/workitem/status';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page, useVbenDrawer } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import {
  ElBadge,
  ElButton,
  ElDatePicker,
  ElMessage,
  ElOption,
  ElSelect,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProjectMemberList } from '#/api/pms/pm/project/member';
import {
  getWorkbenchCount,
  getWorkbenchIterationPage,
  getWorkbenchWorkItemPage,
} from '#/api/pms/pm/workbench';
import {
  getWorkItem,
  updateWorkItem,
  updateWorkItemStatus,
} from '#/api/pms/pm/workitem';
import { getWorkItemStatusList } from '#/api/pms/pm/workitem/status';
import {
  PmsWorkbenchTab,
  PmsWorkbenchTabOptions,
  PmsWorkItemType,
} from '#/views/pms/pm/utils/constants';
import WorkItemDetail from '#/views/pms/pm/workitem/detail/work-item-detail.vue';

import {
  useIterationColumns,
  useSearchFormSchema,
  useWorkItemColumns,
} from './data';

defineOptions({ name: 'PmsWorkbench' });

type WorkbenchTab = (typeof PmsWorkbenchTab)[keyof typeof PmsWorkbenchTab];
type QuickUpdateField = 'assigneeUserId' | 'endTime' | 'priority';
type QuickEditField = 'statusId' | QuickUpdateField;

const { push } = useRouter(); // 路由操作
const activeTab = ref<WorkbenchTab>(PmsWorkbenchTab.ALL); // 当前事项类型
const tabs = PmsWorkbenchTabOptions; // 工作台事项页签
const priorityOptions = getDictOptions(
  DICT_TYPE.PMS_WORK_ITEM_PRIORITY,
  'number',
); // 工作项优先级选项
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
const statusOptionMap = ref<
  Record<string, PmsWorkItemStatusApi.WorkItemStatus[]>
>({}); // 状态选项
const memberOptionMap = ref<
  Record<number, PmsProjectMemberApi.ProjectMember[]>
>({}); // 成员选项
const quickEditingKey = ref<string>(); // 当前行内编辑字段

/** 获得行内编辑字段键 */
function getQuickEditKey(
  item: PmsWorkbenchApi.WorkbenchWorkItem,
  field: QuickEditField,
) {
  return `${item.id}-${field}`;
}

/** 判断字段是否处于行内编辑状态 */
function isQuickEditing(
  item: PmsWorkbenchApi.WorkbenchWorkItem,
  field: QuickEditField,
) {
  return quickEditingKey.value === getQuickEditKey(item, field);
}

/** 开始行内编辑 */
async function startQuickEdit(
  item: PmsWorkbenchApi.WorkbenchWorkItem,
  field: QuickEditField,
) {
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
// TODO @AI：点外部关闭依赖 antd/ele 各自 class，三端容易漏改；抽公共判断，或改成组件自身 blur。DatePicker 的 as any 去掉。
function handleDocumentPointerDown(event: PointerEvent) {
  if (!quickEditingKey.value || !(event.target instanceof Element)) {
    return;
  }
  const activeEditor = document.querySelector(
    '.pms-workbench-table .el-select, .pms-workbench-table .el-date-editor',
  );
  const isEditorClick = activeEditor?.contains(event.target);
  const isPopupClick = event.target.closest(
    '.el-select-dropdown, .el-picker-panel',
  );
  if (!isEditorClick && !isPopupClick) {
    cancelQuickEdit();
  }
}

/** 查询工作台列表 */
async function getWorkbenchItemList(
  formValues: Record<string, any>,
  pageNo: number,
  pageSize: number,
) {
  const params = { ...formValues, pageNo, pageSize, type: getWorkItemType() };
  if (activeTab.value === PmsWorkbenchTab.ITERATION) {
    return await getWorkbenchIterationPage(params);
  }
  return await getWorkbenchWorkItemPage(params);
}

/** 查询各页签数量 */
async function getCount(formValues: Record<string, any>) {
  countData.value = await getWorkbenchCount(formValues);
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

const workItemColumns = useWorkItemColumns(); // 工作项表格列
const iterationColumns = useIterationColumns(); // 迭代表格列

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useSearchFormSchema(handleProjectChange),
    submitOnEnter: true,
  },
  gridOptions: {
    columns: workItemColumns,
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          // 列表和页签数量共用同一套筛选条件
          const [data] = await Promise.all([
            getWorkbenchItemList(formValues, page.currentPage, page.pageSize),
            getCount(formValues),
          ]);
          return data;
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
  } as VxeTableGridOptions<PmsWorkbenchApi.WorkbenchWorkItem>,
});

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
async function getStatusOptions(
  item: PmsWorkbenchApi.WorkbenchWorkItem,
  visible: boolean,
) {
  const key = getWorkItemOptionKey(item);
  if (!visible || statusOptionMap.value[key]) {
    return;
  }
  statusOptionMap.value[key] = await getWorkItemStatusList(
    item.projectId,
    item.type,
  );
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
    ElMessage.success('状态已更新');
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
    ElMessage.success('工作项已更新');
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
  await gridApi.formApi.setFieldValue('iterationId', undefined);
  // 重新提交搜索表单，刷新列表和页签数量
  await gridApi.formApi.submit();
}

/** 切换页签 */
function handleTabChange() {
  gridApi.setGridOptions({
    columns:
      activeTab.value === PmsWorkbenchTab.ITERATION
        ? iterationColumns
        : workItemColumns,
  });
  gridApi.query();
}

/** 刷新工作台 */
function refreshWorkbench() {
  gridApi.query();
}

/** 初始化 */
onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown, true);
});

/** 销毁页面事件 */
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown, true);
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="PMS 手册（功能开启）"
        url="https://doc.iocoder.cn/pms/build/"
      />
    </template>

    <!-- 工作项列表 -->
    <Grid class="pms-workbench-table">
      <template #toolbar-actions>
        <!-- 工作项类型 -->
        <ElTabs
          v-model="activeTab"
          class="workbench-tabs w-full"
          @tab-change="handleTabChange"
        >
          <ElTabPane v-for="tab in tabs" :key="tab.value" :name="tab.value">
            <template #label>
              <ElBadge
                :hidden="
                  displayCountData[
                    tab.countKey as keyof typeof displayCountData
                  ] === 0
                "
                :value="
                  displayCountData[
                    tab.countKey as keyof typeof displayCountData
                  ]
                "
              >
                <span class="px-1.5">{{ tab.label }}</span>
              </ElBadge>
            </template>
          </ElTabPane>
        </ElTabs>
      </template>
      <template #serialNumber="{ row }"> #{{ row.serialNumber }} </template>
      <template #name="{ row }">
        <ElButton link type="primary" @click="openWorkItem(row)">
          {{ row.name }}
        </ElButton>
      </template>
      <template #priority="{ row }">
        <ElSelect
          v-if="isQuickEditing(row, 'priority')"
          v-model="row.priority"
          @blur="cancelQuickEdit"
          @change="handleQuickUpdate(row, 'priority')"
          @keyup.esc.stop="cancelQuickEdit"
        >
          <ElOption
            v-for="option in priorityOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
        <ElButton
          v-else-if="row.writeStatus"
          link
          @click="startQuickEdit(row, 'priority')"
        >
          {{ getDictLabel(DICT_TYPE.PMS_WORK_ITEM_PRIORITY, row.priority) || '-' }}
        </ElButton>
        <span v-else>
          {{ getDictLabel(DICT_TYPE.PMS_WORK_ITEM_PRIORITY, row.priority) || '-' }}
        </span>
      </template>
      <template #statusId="{ row }">
        <ElSelect
          v-if="isQuickEditing(row, 'statusId')"
          v-model="row.statusId"
          @blur="cancelQuickEdit"
          @visible-change="getStatusOptions(row, $event)"
          @change="handleStatusChange(row)"
          @keyup.esc.stop="cancelQuickEdit"
        >
          <ElOption
            v-for="status in getStatusOptionList(row)"
            :key="status.id"
            :label="status.name"
            :value="status.id"
          />
        </ElSelect>
        <ElButton
          v-else-if="row.writeStatus"
          link
          @click="startQuickEdit(row, 'statusId')"
        >
          {{ row.statusName }}
        </ElButton>
        <span v-else>{{ row.statusName }}</span>
      </template>
      <template #assigneeUserId="{ row }">
        <ElSelect
          v-if="isQuickEditing(row, 'assigneeUserId')"
          v-model="row.assigneeUserId"
          clearable
          filterable
          @blur="cancelQuickEdit"
          @visible-change="getMemberOptions(row.projectId, $event)"
          @change="handleQuickUpdate(row, 'assigneeUserId')"
          @keyup.esc.stop="cancelQuickEdit"
        >
          <ElOption
            v-for="member in getMemberOptionList(row)"
            :key="member.userId"
            :label="member.nickname"
            :value="member.userId"
          />
        </ElSelect>
        <ElButton
          v-else-if="row.writeStatus"
          link
          @click="startQuickEdit(row, 'assigneeUserId')"
        >
          {{ row.assigneeUserName || '未分配' }}
        </ElButton>
        <span v-else>{{ row.assigneeUserName || '-' }}</span>
      </template>
      <template #endTime="{ row }">
        <ElDatePicker
          v-if="isQuickEditing(row, 'endTime')"
          v-model="row.endTime"
          class="!w-[170px]"
          clearable
          placeholder="截止日期"
          type="datetime"
          value-format="x"
          @blur="cancelQuickEdit"
          @change="handleQuickUpdate(row, 'endTime')"
          @keyup.esc.stop="cancelQuickEdit"
        />
        <ElButton
          v-else-if="row.writeStatus"
          link
          @click="startQuickEdit(row, 'endTime')"
        >
          {{ formatDateTime(row.endTime) || '未设置' }}
        </ElButton>
        <span v-else>{{ formatDateTime(row.endTime) || '-' }}</span>
      </template>
      <template #createTime="{ row }">
        {{ formatDateTime(row.createTime) }}
      </template>
      <template #iterationName="{ row }">
        <ElButton
          link
          type="primary"
          @click="
            openIteration(row as unknown as PmsWorkbenchApi.WorkbenchIteration)
          "
        >
          {{ row.name }}
        </ElButton>
      </template>
      <template #iterationStartTime="{ row }">
        {{ formatDateTime(row.startTime) }}
      </template>
      <template #iterationEndTime="{ row }">
        {{ formatDateTime(row.endTime) }}
      </template>
    </Grid>

    <!-- 工作项详情 -->
    <WorkItemDetailDrawer @success="refreshWorkbench" />
  </Page>
</template>

<style lang="scss" scoped>
.workbench-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
}
</style>
