<script lang="ts" setup>
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime, getFileNameFromUrl } from '@vben/utils';

import {
  ElAvatar,
  ElButton,
  ElCollapse,
  ElCollapseItem,
  ElDatePicker,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElInputNumber,
  ElLink,
  ElMessage,
  ElOption,
  ElSelect,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTooltip,
} from 'element-plus';

import { getProject } from '#/api/pms/pm/project';
import {
  archiveWorkItem,
  getWorkItem,
  recycleWorkItem,
  updateWorkItem,
  updateWorkItemStatus,
} from '#/api/pms/pm/workitem';
import IterationSelect from '#/views/pms/pm/iteration/components/iteration-select.vue';
import ProjectMemberSelect from '#/views/pms/pm/project/components/project-member-select.vue';
import {
  PmsProjectStatus,
  PmsProjectType,
  PmsWorkItemLifecycleStatus,
  PmsWorkItemType,
} from '#/views/pms/pm/utils/constants';
import {
  getWorkItemStatusTagType,
} from '#/views/pms/pm/utils/format';

import WorkItemForm from '../form/work-item-form.vue';
import WorkItemStatusSelect from '../status/work-item-status-select.vue';
import WorkItemWorkLogList from '../worklog/worklog-list.vue';
import WorkItemActivity from './work-item-activity.vue';
import WorkItemComment from './work-item-comment.vue';
import WorkItemSubtaskList from './work-item-subtask-list.vue';

defineOptions({ name: 'PmsWorkItemDetail' });

// TODO @AI：详情里可编辑字段（时间、负责人等）尽量抽 schema；as any、v-loading 对齐 system user 的 lock。三端模板差异也收一下。

const emit = defineEmits<{ success: [] }>(); // 定义 success 事件，用于详情变更后的回调

const { hasAccessByCodes } = useAccess();
const loading = ref(false); // 详情加载中
const editable = ref(false); // 是否允许编辑
const projectType = ref<number>(PmsProjectType.GENERAL); // 项目类型
const workItem = ref<PmsWorkItemApi.WorkItem>(); // 工作项详情
const activeTab = ref('comment'); // 当前协作信息页签
const expandedPanels = ref(['basic']); // 展开的属性面板
const workItemActivityRef = ref<InstanceType<typeof WorkItemActivity>>(); // 工作项动态 Ref
const workItemTypeName = computed(() =>
  getDictLabel(DICT_TYPE.PMS_WORK_ITEM_TYPE, workItem.value?.type || 0) || '-',
); // 工作项类型名称
const canUpdate = computed(
  () => editable.value && hasAccessByCodes(['pms:pm:work-item:update']),
); // 是否允许更新工作项

type InlineEditField =
  | 'assigneeUserId'
  | 'endTime'
  | 'estimatedHours'
  | 'iterationId'
  | 'priority'
  | 'progress'
  | 'relatedRequirementId'
  | 'startTime'
  | 'statusId';
const inlineEditingField = ref<InlineEditField>(); // 当前正在编辑的属性

/** 开始编辑工作项属性 */
function startInlineEditing(field: InlineEditField) {
  if (canUpdate.value) {
    inlineEditingField.value = field;
  }
}

/** 结束编辑工作项属性 */
function cancelInlineEditing() {
  inlineEditingField.value = undefined;
}

/** 判断工作项属性是否处于编辑状态 */
function isInlineEditing(field: InlineEditField) {
  return inlineEditingField.value === field;
}

/** 查询工作项详情 */
async function getWorkItemDetail(id: number) {
  loading.value = true;
  try {
    const currentWorkItem = await getWorkItem(id);
    const project = await getProject(currentWorkItem.projectId);
    workItem.value = currentWorkItem;
    projectType.value = project.type;
    editable.value = Boolean(
      project.writeStatus &&
      project.status === PmsProjectStatus.ACTIVE &&
      currentWorkItem.lifecycleStatus === PmsWorkItemLifecycleStatus.ACTIVE,
    );
  } finally {
    loading.value = false;
  }
}

const [WorkItemFormModal, workItemFormModalApi] = useVbenModal({
  connectedComponent: WorkItemForm,
});

/** 打开工作项编辑表单 */
function openEditForm() {
  if (workItem.value?.id) {
    workItemFormModalApi
      .setData({ formType: 'update', id: workItem.value.id })
      .open();
  }
}

/** 快速切换工作项状态 */
async function handleQuickStatusChange(statusId: number) {
  if (!workItem.value?.id) {
    return;
  }
  cancelInlineEditing();
  await updateWorkItemStatus(workItem.value.id, statusId);
  await getWorkItemDetail(workItem.value.id);
  ElMessage.success('状态已更新');
  workItemActivityRef.value?.getActivityList();
  emit('success');
}

/** 就地保存工作项属性 */
async function saveInlineWorkItem() {
  if (!workItem.value?.id) {
    return;
  }
  cancelInlineEditing();
  try {
    await updateWorkItem(workItem.value);
    await getWorkItemDetail(workItem.value.id);
    workItemActivityRef.value?.getActivityList();
    ElMessage.success('工作项已更新');
    emit('success');
  } catch {
    await getWorkItemDetail(workItem.value.id);
  }
}

/** 处理扩展信息变化 */
function handleExtensionChanged() {
  workItemActivityRef.value?.getActivityList();
  emit('success');
}

/** 处理工作项编辑成功 */
async function handleFormSuccess() {
  if (!workItem.value?.id) {
    return;
  }
  await getWorkItemDetail(workItem.value.id);
  emit('success');
}

/** 处理更多操作 */
function handleMoreCommand(command: 'archive' | 'edit' | 'recycle') {
  if (command === 'edit') {
    openEditForm();
    return;
  }
  if (command === 'archive') {
    handleArchive();
    return;
  }
  handleRecycle();
}

/** 归档工作项 */
async function handleArchive() {
  if (!workItem.value?.id) {
    return;
  }
  try {
    await confirm(
      `确认归档${workItemTypeName.value}“${workItem.value.name}”吗？`,
    );
    await archiveWorkItem(workItem.value.id);
    ElMessage.success('归档成功');
    drawerApi.close();
    emit('success');
  } catch {
  }
}

/** 将工作项移入回收站 */
async function handleRecycle() {
  if (!workItem.value?.id) {
    return;
  }
  try {
    await confirm(
      `确认将${workItemTypeName.value}“${workItem.value.name}”移入回收站吗？`,
    );
    await recycleWorkItem(workItem.value.id);
    ElMessage.success('已移入回收站');
    drawerApi.close();
    emit('success');
  } catch {
  }
}

const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-[76%]',
  header: false,
  destroyOnClose: true,
  footer: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      workItem.value = undefined;
      return;
    }
    const data = drawerApi.getData() as { id: number };
    activeTab.value = 'comment';
    inlineEditingField.value = undefined;
    await getWorkItemDetail(data.id);
  },
});
</script>

<template>
  <Drawer>
    <div
      v-loading="loading"
      class="flex h-full min-w-[900px] flex-col bg-[var(--el-bg-color)]"
    >
      <!-- 工作项标题与操作 -->
      <header class="flex shrink-0 items-start justify-between gap-6 px-7 py-5">
        <div class="min-w-0 flex-1">
          <div class="mb-1 text-xs text-[var(--el-text-color-secondary)]">
            创建于 {{ formatDateTime(workItem?.createTime) }}
          </div>
          <div class="flex min-w-0 items-center gap-2.5">
            <IconifyIcon
              class="shrink-0 text-[var(--el-color-primary)]"
              icon="ep:list"
              :size="22"
            />
            <h2 class="m-0 truncate text-[22px] font-semibold leading-8">
              #{{ workItem?.serialNumber }} {{ workItem?.name }}
            </h2>
          </div>
          <div class="mt-2.5 flex flex-wrap items-center gap-2">
            <ElTag
              v-for="label in workItem?.labels || []"
              :key="label.id"
              :color="label.color"
              effect="dark"
              size="small"
            >
              {{ label.name }}
            </ElTag>
            <ElTooltip
              v-for="name in workItem?.memberUserNames || []"
              :key="name"
              :content="name"
              placement="top"
            >
              <ElAvatar :size="26">{{ name.slice(0, 1) }}</ElAvatar>
            </ElTooltip>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <ElDropdown
            v-if="editable"
            trigger="click"
            @command="handleMoreCommand"
          >
            <ElButton aria-label="更多操作">
              <IconifyIcon icon="ep:more-filled" />
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem command="edit">编辑</ElDropdownItem>
                <ElDropdownItem v-if="canUpdate" command="archive">
                  归档
                </ElDropdownItem>
                <ElDropdownItem v-if="canUpdate" command="recycle" divided>
                  移入回收站
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
          <ElButton aria-label="关闭" circle @click="drawerApi.close()">
            <IconifyIcon icon="ep:close" />
          </ElButton>
        </div>
      </header>

      <div
        class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_300px] border-0 border-t border-solid border-[var(--el-border-color-lighter)]"
      >
        <!-- 工作项内容与协作信息 -->
        <main class="min-w-0 overflow-y-auto px-8 py-6">
          <section class="mb-7">
            <div v-if="editable" class="mb-4 flex items-center gap-2">
              <ElButton link type="primary" @click="openEditForm">
                <IconifyIcon class="mr-1" icon="ep:edit" />编辑描述
              </ElButton>
              <ElButton link type="primary" @click="openEditForm">
                <IconifyIcon class="mr-1" icon="ep:paperclip" />上传附件
              </ElButton>
            </div>
            <h3 class="mb-3 mt-0 text-base font-semibold">
              {{ workItemTypeName }}描述
            </h3>
            <div
              v-if="workItem?.description"
              v-dompurify-html="workItem.description"
              class="min-h-12 break-words text-sm leading-6 [&_img]:max-w-full [&_p]:my-2"
            ></div>
            <div
              v-else
              class="py-2 text-[13px] text-[var(--el-text-color-secondary)]"
            >
              暂无描述
            </div>
          </section>

          <section v-if="workItem?.fileUrls?.length" class="mb-7">
            <h3 class="mb-3 mt-0 text-base font-semibold">附件</h3>
            <div class="flex flex-wrap gap-2.5">
              <ElLink
                v-for="fileUrl in workItem.fileUrls"
                :key="fileUrl"
                class="rounded border border-solid border-[var(--el-border-color)] px-2.5 py-1.5"
                :href="fileUrl"
                target="_blank"
                type="primary"
              >
                <IconifyIcon class="mr-1.5" icon="ep:paperclip" />{{
                  getFileNameFromUrl(fileUrl)
                }}
              </ElLink>
            </div>
          </section>

          <!-- 评论、活动和扩展信息使用页签收敛，避免多个大表格纵向堆叠 -->
          <section v-if="workItem?.id">
            <h3 class="mb-2 mt-0 text-base font-semibold">活动日志</h3>
            <ElTabs v-model="activeTab">
              <ElTabPane label="评论" name="comment">
                <WorkItemComment
                  :editable="editable"
                  :show-title="false"
                  :work-item-id="workItem.id"
                  @changed="workItemActivityRef?.getActivityList()"
                />
              </ElTabPane>
              <ElTabPane label="活动" name="activity">
                <WorkItemActivity
                  ref="workItemActivityRef"
                  :show-title="false"
                  :work-item-id="workItem.id"
                />
              </ElTabPane>
              <ElTabPane label="子工作项" name="subtask">
                <WorkItemSubtaskList
                  :editable="editable"
                  :parent-work-item="workItem"
                  :show-title="false"
                  @changed="handleExtensionChanged"
                />
              </ElTabPane>
              <ElTabPane label="工时记录" name="worklog">
                <WorkItemWorkLogList
                  :editable="editable"
                  :show-title="false"
                  :work-item-id="workItem.id"
                  @changed="handleExtensionChanged"
                />
              </ElTabPane>
            </ElTabs>
          </section>
        </main>

        <!-- 工作项属性 -->
        <aside
          class="overflow-y-auto border-0 border-l border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)] p-5"
        >
          <WorkItemStatusSelect
            v-if="workItem && canUpdate && isInlineEditing('statusId')"
            v-model="workItem.statusId"
            class="mb-4 !w-full"
            :project-id="workItem.projectId"
            :work-item-type="workItem.type"
            @change="handleQuickStatusChange"
            @blur="cancelInlineEditing"
            @keyup.esc.stop="cancelInlineEditing"
          />
          <ElTag
            v-else-if="workItem && canUpdate"
            class="mb-4 cursor-pointer"
            :type="getWorkItemStatusTagType(workItem.status)"
            @click="startInlineEditing('statusId')"
          >
            {{ workItem.statusName }}
          </ElTag>
          <ElTag
            v-else
            class="mb-4"
            :type="getWorkItemStatusTagType(workItem?.status)"
          >
            {{ workItem?.statusName }}
          </ElTag>

          <ElCollapse v-model="expandedPanels">
            <ElCollapseItem name="basic" title="基础信息">
              <div class="flex flex-col gap-0.5">
                <div
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-[var(--el-text-color-secondary)]">负责人</span>
                  <ProjectMemberSelect
                    v-if="
                      workItem && canUpdate && isInlineEditing('assigneeUserId')
                    "
                    v-model="workItem.assigneeUserId"
                    class="!w-full"
                    clearable
                    :project-id="workItem.projectId"
                    @update:model-value="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <ElButton
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    link
                    @click="startInlineEditing('assigneeUserId')"
                  >
                    {{ workItem.assigneeUserName || '未分配' }}
                  </ElButton>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-[var(--el-text-color-regular)]"
                  >
                    {{ workItem?.assigneeUserName || '未分配' }}
                  </strong>
                </div>
                <div
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-[var(--el-text-color-secondary)]">优先级</span>
                  <ElSelect
                    v-if="workItem && canUpdate && isInlineEditing('priority')"
                    v-model="workItem.priority"
                    class="!w-full"
                    @change="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
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
                  <ElButton
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    link
                    @click="startInlineEditing('priority')"
                  >
                    {{ getDictLabel(DICT_TYPE.PMS_WORK_ITEM_PRIORITY, workItem?.priority) || '-' }}
                  </ElButton>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-[var(--el-text-color-regular)]"
                  >
                    {{ getDictLabel(DICT_TYPE.PMS_WORK_ITEM_PRIORITY, workItem?.priority) || '-' }}
                  </strong>
                </div>
                <div
                  v-if="projectType === PmsProjectType.AGILE"
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-[var(--el-text-color-secondary)]">所属迭代</span>
                  <IterationSelect
                    v-if="
                      workItem && canUpdate && isInlineEditing('iterationId')
                    "
                    v-model="workItem.iterationId"
                    class="!w-full"
                    :project-id="workItem.projectId"
                    @update:model-value="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <ElButton
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    link
                    @click="startInlineEditing('iterationId')"
                  >
                    {{ workItem?.iterationName || '待规划' }}
                  </ElButton>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-[var(--el-text-color-regular)]"
                  >
                    {{ workItem?.iterationName || '待规划' }}
                  </strong>
                </div>
                <div
                  v-if="
                    projectType === PmsProjectType.AGILE &&
                    workItem?.type !== PmsWorkItemType.REQUIREMENT
                  "
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-[var(--el-text-color-secondary)]">关联需求</span>
                  <WorkItemSelect
                    v-if="
                      workItem &&
                      canUpdate &&
                      isInlineEditing('relatedRequirementId')
                    "
                    v-model="workItem.relatedRequirementId"
                    class="!w-full"
                    clearable
                    placeholder="请选择关联需求"
                    :project-id="workItem.projectId"
                    :type="PmsWorkItemType.REQUIREMENT"
                    @update:model-value="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <ElButton
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    link
                    @click="startInlineEditing('relatedRequirementId')"
                  >
                    {{ workItem?.relatedRequirementName || '未关联' }}
                  </ElButton>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-[var(--el-text-color-regular)]"
                  >
                    {{ workItem?.relatedRequirementName || '未关联' }}
                  </strong>
                </div>
                <div
                  v-if="workItem?.type === PmsWorkItemType.DEFECT"
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-[var(--el-text-color-secondary)]">缺陷类型</span>
                  <strong
                    class="min-w-0 truncate font-medium text-[var(--el-text-color-regular)]"
                  >
                    {{
                      getDictLabel(
                        DICT_TYPE.PMS_WORK_ITEM_DEFECT_TYPE,
                        workItem.defectType,
                      ) || '-'
                    }}
                  </strong>
                </div>
                <div
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-[var(--el-text-color-secondary)]">完成进度</span>
                  <ElInputNumber
                    v-if="workItem && canUpdate && isInlineEditing('progress')"
                    v-model="workItem.progress"
                    class="!w-full"
                    :controls="false"
                    :max="100"
                    :min="0"
                    @change="saveInlineWorkItem"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <ElButton
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    link
                    @click="startInlineEditing('progress')"
                  >
                    {{ workItem?.progress || 0 }}%
                  </ElButton>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-[var(--el-text-color-regular)]"
                  >
                    {{ workItem?.progress || 0 }}%
                  </strong>
                </div>
                <div
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-[var(--el-text-color-secondary)]">预估工时</span>
                  <ElInputNumber
                    v-if="
                      workItem && canUpdate && isInlineEditing('estimatedHours')
                    "
                    v-model="workItem.estimatedHours"
                    class="!w-full"
                    :min="0"
                    @change="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <ElButton
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    link
                    @click="startInlineEditing('estimatedHours')"
                  >
                    {{
                      workItem?.estimatedHours == null
                        ? '-'
                        : `${workItem.estimatedHours} 小时`
                    }}
                  </ElButton>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-[var(--el-text-color-regular)]"
                  >
                    {{
                      workItem?.estimatedHours == null
                        ? '-'
                        : `${workItem.estimatedHours} 小时`
                    }}
                  </strong>
                </div>
                <div
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-[var(--el-text-color-secondary)]">开始时间</span>
                  <ElDatePicker
                    v-if="workItem && canUpdate && isInlineEditing('startTime')"
                    v-model="workItem.startTime"
                    class="!w-full"
                    clearable
                    placeholder="请选择开始时间"
                    type="datetime"
                    value-format="x"
                    @change="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <ElButton
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    link
                    @click="startInlineEditing('startTime')"
                  >
                    {{ formatDateTime(workItem?.startTime) || '-' }}
                  </ElButton>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-[var(--el-text-color-regular)]"
                  >
                    {{ formatDateTime(workItem?.startTime) || '-' }}
                  </strong>
                </div>
                <div
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-[var(--el-text-color-secondary)]">截止时间</span>
                  <ElDatePicker
                    v-if="workItem && canUpdate && isInlineEditing('endTime')"
                    v-model="workItem.endTime"
                    class="!w-full"
                    clearable
                    placeholder="请选择截止时间"
                    type="datetime"
                    value-format="x"
                    @change="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <ElButton
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    link
                    @click="startInlineEditing('endTime')"
                  >
                    {{ formatDateTime(workItem?.endTime) || '-' }}
                  </ElButton>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-[var(--el-text-color-regular)]"
                  >
                    {{ formatDateTime(workItem?.endTime) || '-' }}
                  </strong>
                </div>
                <div
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-[var(--el-text-color-secondary)]">创建时间</span>
                  <strong
                    class="min-w-0 truncate font-medium text-[var(--el-text-color-regular)]"
                  >
                    {{ formatDateTime(workItem?.createTime) || '-' }}
                  </strong>
                </div>
              </div>
            </ElCollapseItem>
          </ElCollapse>
        </aside>
      </div>
    </div>

    <!-- 工作项编辑表单 -->
    <WorkItemFormModal @success="handleFormSuccess" />
  </Drawer>
</template>
