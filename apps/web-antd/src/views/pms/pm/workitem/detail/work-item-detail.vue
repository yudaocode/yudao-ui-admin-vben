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
  Avatar,
  Button,
  Collapse,
  DatePicker,
  Dropdown,
  InputNumber,
  Menu,
  message,
  Select,
  Tabs,
  Tag,
  Tooltip,
} from 'ant-design-vue';

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
  message.success('状态已更新');
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
    message.success('工作项已更新');
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
    message.success('归档成功');
    drawerApi.close();
    emit('success');
  } catch {}
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
    message.success('已移入回收站');
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
      class="flex h-full min-w-[900px] flex-col bg-background"
    >
      <!-- 工作项标题与操作 -->
      <header class="flex shrink-0 items-start justify-between gap-6 px-7 py-5">
        <div class="min-w-0 flex-1">
          <div class="mb-1 text-xs text-muted-foreground">
            创建于 {{ formatDateTime(workItem?.createTime) }}
          </div>
          <div class="flex min-w-0 items-center gap-2.5">
            <IconifyIcon
              class="shrink-0 text-primary"
              icon="lucide:list"
              :size="22"
            />
            <h2 class="m-0 truncate text-[22px] font-semibold leading-8">
              #{{ workItem?.serialNumber }} {{ workItem?.name }}
            </h2>
          </div>
          <div class="mt-2.5 flex flex-wrap items-center gap-2">
            <Tag
              v-for="label in workItem?.labels || []"
              :key="label.id"
              :color="label.color"
            >
              {{ label.name }}
            </Tag>
            <Tooltip
              v-for="name in workItem?.memberUserNames || []"
              :key="name"
              :title="name"
              placement="top"
            >
              <Avatar :size="26">{{ name.slice(0, 1) }}</Avatar>
            </Tooltip>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <Dropdown v-if="editable" trigger="click">
            <Button aria-label="更多操作">
              <IconifyIcon icon="lucide:ellipsis" />
            </Button>
            <template #overlay>
              <Menu @click="({ key }: any) => handleMoreCommand(key)">
                <Menu.Item key="edit">编辑</Menu.Item>
                <Menu.Item v-if="canUpdate" key="archive">归档</Menu.Item>
                <Menu.Divider v-if="canUpdate" />
                <Menu.Item v-if="canUpdate" key="recycle">移入回收站</Menu.Item>
              </Menu>
            </template>
          </Dropdown>
          <Button aria-label="关闭" shape="circle" @click="drawerApi.close()">
            <IconifyIcon icon="lucide:x" />
          </Button>
        </div>
      </header>

      <div
        class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_300px] border-0 border-t border-solid border-border"
      >
        <!-- 工作项内容与协作信息 -->
        <main class="min-w-0 overflow-y-auto px-8 py-6">
          <section class="mb-7">
            <div v-if="editable" class="mb-4 flex items-center gap-2">
              <Button type="link" @click="openEditForm">
                <IconifyIcon class="mr-1" icon="lucide:square-pen" />编辑描述
              </Button>
              <Button type="link" @click="openEditForm">
                <IconifyIcon class="mr-1" icon="lucide:paperclip" />上传附件
              </Button>
            </div>
            <h3 class="mb-3 mt-0 text-base font-semibold">
              {{ workItemTypeName }}描述
            </h3>
            <div
              v-if="workItem?.description"
              v-dompurify-html="workItem.description"
              class="min-h-12 break-words text-sm leading-6 [&_img]:max-w-full [&_p]:my-2"
            ></div>
            <div v-else class="py-2 text-[13px] text-muted-foreground">
              暂无描述
            </div>
          </section>

          <section v-if="workItem?.fileUrls?.length" class="mb-7">
            <h3 class="mb-3 mt-0 text-base font-semibold">附件</h3>
            <div class="flex flex-wrap gap-2.5">
              <a
                v-for="fileUrl in workItem.fileUrls"
                :key="fileUrl"
                class="rounded border border-solid border-border px-2.5 py-1.5 text-primary"
                :href="fileUrl"
                target="_blank"
              >
                <IconifyIcon class="mr-1.5" icon="lucide:paperclip" />
                {{ getFileNameFromUrl(fileUrl) }}
              </a>
            </div>
          </section>

          <!-- 评论、活动和扩展信息使用页签收敛，避免多个大表格纵向堆叠 -->
          <section v-if="workItem?.id">
            <h3 class="mb-2 mt-0 text-base font-semibold">活动日志</h3>
            <Tabs v-model:active-key="activeTab">
              <Tabs.TabPane key="comment" tab="评论">
                <WorkItemComment
                  :editable="editable"
                  :show-title="false"
                  :work-item-id="workItem.id"
                  @changed="workItemActivityRef?.getActivityList()"
                />
              </Tabs.TabPane>
              <Tabs.TabPane key="activity" tab="活动">
                <WorkItemActivity
                  ref="workItemActivityRef"
                  :show-title="false"
                  :work-item-id="workItem.id"
                />
              </Tabs.TabPane>
              <Tabs.TabPane key="subtask" tab="子工作项">
                <WorkItemSubtaskList
                  :editable="editable"
                  :parent-work-item="workItem"
                  :show-title="false"
                  @changed="handleExtensionChanged"
                />
              </Tabs.TabPane>
              <Tabs.TabPane key="worklog" tab="工时记录">
                <WorkItemWorkLogList
                  :editable="editable"
                  :show-title="false"
                  :work-item-id="workItem.id"
                  @changed="handleExtensionChanged"
                />
              </Tabs.TabPane>
            </Tabs>
          </section>
        </main>

        <!-- 工作项属性 -->
        <aside
          class="overflow-y-auto border-0 border-l border-solid border-border bg-background p-5"
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
          <Tag
            v-else-if="workItem && canUpdate"
            class="mb-4 cursor-pointer"
            :color="getWorkItemStatusTagType(workItem.status)"
            @click="startInlineEditing('statusId')"
          >
            {{ workItem.statusName }}
          </Tag>
          <Tag
            v-else
            class="mb-4"
            :color="getWorkItemStatusTagType(workItem?.status)"
          >
            {{ workItem?.statusName }}
          </Tag>

          <Collapse v-model:active-key="expandedPanels">
            <Collapse.Panel key="basic" header="基础信息">
              <div class="flex flex-col gap-0.5">
                <div
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-muted-foreground">负责人</span>
                  <ProjectMemberSelect
                    v-if="
                      workItem && canUpdate && isInlineEditing('assigneeUserId')
                    "
                    v-model="workItem.assigneeUserId"
                    class="!w-full"
                    :project-id="workItem.projectId"
                    @update:model-value="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <Button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    type="link"
                    @click="startInlineEditing('assigneeUserId')"
                  >
                    {{ workItem.assigneeUserName || '未分配' }}
                  </Button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-foreground"
                  >
                    {{ workItem?.assigneeUserName || '未分配' }}
                  </strong>
                </div>
                <div
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-muted-foreground">优先级</span>
                  <Select
                    v-if="workItem && canUpdate && isInlineEditing('priority')"
                    v-model:value="workItem.priority"
                    class="!w-full"
                    :options="
                      getDictOptions(
                        DICT_TYPE.PMS_WORK_ITEM_PRIORITY,
                        'number',
                      ).map((item) => ({
                        label: item.label,
                        value: item.value,
                      }))
                    "
                    @change="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <Button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    type="link"
                    @click="startInlineEditing('priority')"
                  >
                    {{ getDictLabel(DICT_TYPE.PMS_WORK_ITEM_PRIORITY, workItem?.priority) || '-' }}
                  </Button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-foreground"
                  >
                    {{ getDictLabel(DICT_TYPE.PMS_WORK_ITEM_PRIORITY, workItem?.priority) || '-' }}
                  </strong>
                </div>
                <div
                  v-if="projectType === PmsProjectType.AGILE"
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-muted-foreground">所属迭代</span>
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
                  <Button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    type="link"
                    @click="startInlineEditing('iterationId')"
                  >
                    {{ workItem?.iterationName || '待规划' }}
                  </Button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-foreground"
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
                  <span class="text-muted-foreground">关联需求</span>
                  <WorkItemSelect
                    v-if="
                      workItem &&
                      canUpdate &&
                      isInlineEditing('relatedRequirementId')
                    "
                    v-model="workItem.relatedRequirementId"
                    class="!w-full"
                    placeholder="请选择关联需求"
                    :project-id="workItem.projectId"
                    :type="PmsWorkItemType.REQUIREMENT"
                    @update:model-value="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <Button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    type="link"
                    @click="startInlineEditing('relatedRequirementId')"
                  >
                    {{ workItem?.relatedRequirementName || '未关联' }}
                  </Button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-foreground"
                  >
                    {{ workItem?.relatedRequirementName || '未关联' }}
                  </strong>
                </div>
                <div
                  v-if="workItem?.type === PmsWorkItemType.DEFECT"
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-muted-foreground">缺陷类型</span>
                  <strong class="min-w-0 truncate font-medium text-foreground">
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
                  <span class="text-muted-foreground">完成进度</span>
                  <InputNumber
                    v-if="workItem && canUpdate && isInlineEditing('progress')"
                    v-model:value="workItem.progress"
                    class="!w-full"
                    :controls="false"
                    :max="100"
                    :min="0"
                    @change="saveInlineWorkItem"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <Button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    type="link"
                    @click="startInlineEditing('progress')"
                  >
                    {{ workItem?.progress || 0 }}%
                  </Button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-foreground"
                  >
                    {{ workItem?.progress || 0 }}%
                  </strong>
                </div>
                <div
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-muted-foreground">预估工时</span>
                  <InputNumber
                    v-if="
                      workItem && canUpdate && isInlineEditing('estimatedHours')
                    "
                    v-model:value="workItem.estimatedHours"
                    class="!w-full"
                    :min="0"
                    @change="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <Button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    type="link"
                    @click="startInlineEditing('estimatedHours')"
                  >
                    {{
                      workItem?.estimatedHours == null
                        ? '-'
                        : `${workItem.estimatedHours} 小时`
                    }}
                  </Button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-foreground"
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
                  <span class="text-muted-foreground">开始时间</span>
                  <DatePicker
                    v-if="workItem && canUpdate && isInlineEditing('startTime')"
                    v-model:value="workItem.startTime as any"
                    class="!w-full"
                    allow-clear
                    placeholder="请选择开始时间"
                    show-time
                    value-format="x"
                    @change="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <Button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    type="link"
                    @click="startInlineEditing('startTime')"
                  >
                    {{ formatDateTime(workItem?.startTime) || '-' }}
                  </Button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-foreground"
                  >
                    {{ formatDateTime(workItem?.startTime) || '-' }}
                  </strong>
                </div>
                <div
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-muted-foreground">截止时间</span>
                  <DatePicker
                    v-if="workItem && canUpdate && isInlineEditing('endTime')"
                    v-model:value="workItem.endTime as any"
                    class="!w-full"
                    allow-clear
                    placeholder="请选择截止时间"
                    show-time
                    value-format="x"
                    @change="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <Button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-medium"
                    type="link"
                    @click="startInlineEditing('endTime')"
                  >
                    {{ formatDateTime(workItem?.endTime) || '-' }}
                  </Button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-medium text-foreground"
                  >
                    {{ formatDateTime(workItem?.endTime) || '-' }}
                  </strong>
                </div>
                <div
                  class="grid min-h-[42px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 text-[13px]"
                >
                  <span class="text-muted-foreground">创建时间</span>
                  <strong class="min-w-0 truncate font-medium text-foreground">
                    {{ formatDateTime(workItem?.createTime) || '-' }}
                  </strong>
                </div>
              </div>
            </Collapse.Panel>
          </Collapse>
        </aside>
      </div>
    </div>

    <!-- 工作项编辑表单 -->
    <WorkItemFormModal @success="handleFormSuccess" />
  </Drawer>
</template>
