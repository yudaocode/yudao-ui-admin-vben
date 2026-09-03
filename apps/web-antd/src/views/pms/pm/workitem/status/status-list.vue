<script lang="ts" setup>
import type { PmsWorkItemStatusApi } from '#/api/pms/pm/workitem/status';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  Input,
  message,
  Radio,
  Select,
  Tabs,
  Tag,
} from 'ant-design-vue';
import draggable from 'vuedraggable';

import {
  createWorkItemStatus,
  getWorkItemBoardConfig,
  getWorkItemStatusList,
  updateDefaultWorkItemStatus,
  updateWorkItemBoardConfig,
  updateWorkItemStatusConfig,
  updateWorkItemStatusSort,
} from '#/api/pms/pm/workitem/status';
import {
  PmsWorkItemStatusType,
  PmsWorkItemType,
} from '#/views/pms/pm/utils/constants';

import StatusDeleteForm from './status-delete-form.vue';

defineOptions({ name: 'PmsWorkItemStatusList' });

const emit = defineEmits(['success']);

interface WorkItemBoard extends PmsWorkItemStatusApi.WorkItemBoard {
  statuses: PmsWorkItemStatusApi.WorkItemStatus[];
}

// 定义 success 事件，用于操作成功后的回调

const loading = ref(false); // 数据提交中
const projectId = ref(0); // 项目编号
const type = ref<number>(PmsWorkItemType.TASK); // 工作项类型
const statusList = ref<PmsWorkItemStatusApi.WorkItemStatus[]>([]); // 状态列表
const activeTab = ref<'board' | 'status'>('status'); // 当前配置页签
const boardList = ref<WorkItemBoard[]>([]); // 看板列及其状态
const unassignedStatuses = ref<PmsWorkItemStatusApi.WorkItemStatus[]>([]); // 未放入看板的状态
const defaultStatusId = ref<number>(); // 初始状态编号

const [StatusDeleteFormModal, statusDeleteFormModalApi] = useVbenModal({
  connectedComponent: StatusDeleteForm,
});

/** 查询状态列表 */
async function getStatusList() {
  loading.value = true;
  try {
    statusList.value = await getWorkItemStatusList(projectId.value, type.value);
    defaultStatusId.value = statusList.value.find(
      (status) => status.defaultStatus,
    )?.id;
    await getBoardConfig();
  } finally {
    loading.value = false;
  }
}

/** 查询看板列和状态映射 */
async function getBoardConfig() {
  const config = await getWorkItemBoardConfig(projectId.value, type.value);
  const statusMap = new Map(
    statusList.value.map((status) => [status.id, status]),
  );
  boardList.value = config.boards.map((board) => ({
    ...board,
    statuses: board.statusIds
      .map((statusId) => statusMap.get(statusId)!)
      .filter(Boolean),
  }));
  unassignedStatuses.value = config.unassignedStatusIds
    .map((statusId) => statusMap.get(statusId)!)
    .filter(Boolean);
}

/** 添加状态 */
function handleAdd() {
  statusList.value.push({
    id: -Date.now(),
    projectId: projectId.value,
    workItemType: type.value,
    name: '',
    statusType: PmsWorkItemStatusType.PROCESSING,
    defaultStatus: false,
    sort: statusList.value.length + 1,
  });
  unassignedStatuses.value.push(statusList.value[statusList.value.length - 1]!);
}

/** 添加看板列 */
function handleAddBoard() {
  boardList.value.push({
    id: -Date.now(),
    name: '',
    statusIds: [],
    statuses: [],
  });
}

/** 删除看板列，列内状态移回未放入看板区域 */
function handleDeleteBoard(index: number) {
  unassignedStatuses.value.push(...boardList.value[index]!.statuses);
  boardList.value.splice(index, 1);
}

/** 删除状态 */
function handleDelete(status: PmsWorkItemStatusApi.WorkItemStatus) {
  // 未保存的状态直接从列表移除
  if (status.id < 0) {
    statusList.value = statusList.value.filter((item) => item.id !== status.id);
    unassignedStatuses.value = unassignedStatuses.value.filter(
      (item) => item.id !== status.id,
    );
    boardList.value.forEach((board) => {
      board.statuses = board.statuses.filter((item) => item.id !== status.id);
    });
    return;
  }
  // 已保存的状态需要迁移工作项后删除
  statusDeleteFormModalApi.setData({ id: status.id }).open();
}

/** 删除状态成功 */
async function handleDeleteSuccess() {
  await getStatusList();
  emit('success');
}

/** 保存状态设置 */
async function submitForm() {
  // 校验状态名称、看板列名称和初始状态
  const names = statusList.value.map((status) => status.name.trim());
  const boardNames = boardList.value.map((board) => board.name.trim());
  if (names.some((name) => !name)) {
    message.warning('状态名称不能为空');
    return;
  }
  if (new Set(names).size !== names.length) {
    message.warning('状态名称不能重复');
    return;
  }
  if (boardNames.some((name) => !name)) {
    message.warning('看板列名称不能为空');
    return;
  }
  if (new Set(boardNames).size !== boardNames.length) {
    message.warning('看板列名称不能重复');
    return;
  }
  if (!defaultStatusId.value) {
    message.warning('请选择初始状态');
    return;
  }

  // 创建或更新状态配置
  loading.value = true;
  try {
    for (const status of statusList.value) {
      if (status.id < 0) {
        const oldId = status.id;
        status.id = await createWorkItemStatus({
          id: status.id,
          projectId: projectId.value,
          workItemType: type.value,
          name: status.name.trim(),
          statusType: status.statusType,
          description: status.description,
          defaultStatus: status.defaultStatus,
          sort: status.sort,
        });
        if (defaultStatusId.value === oldId) {
          defaultStatusId.value = status.id;
        }
      } else {
        await updateWorkItemStatusConfig({
          id: status.id,
          projectId: status.projectId,
          workItemType: status.workItemType,
          name: status.name.trim(),
          statusType: status.statusType,
          description: status.description,
          defaultStatus: status.defaultStatus,
          sort: status.sort,
        });
      }
    }
    // 更新初始状态和显示顺序
    await updateDefaultWorkItemStatus(defaultStatusId.value);
    await updateWorkItemStatusSort(statusList.value.map((status) => status.id));
    await updateWorkItemBoardConfig(
      projectId.value,
      type.value,
      boardList.value.map((board) => ({
        id: board.id,
        name: board.name.trim(),
        statusIds: board.statuses.map((status) => status.id),
      })),
    );
    message.success('状态设置已保存');
    modalApi.close();
    // 发送操作成功的事件
    emit('success');
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  class: 'w-[900px]',
  async onConfirm() {
    await submitForm();
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as { projectId: number; type: number };
    projectId.value = data.projectId;
    type.value = data.type;
    activeTab.value = 'status';
    await getStatusList();
  },
});
</script>

<template>
  <Modal
    :title="`${getDictLabel(DICT_TYPE.PMS_WORK_ITEM_TYPE, type) || '-'}状态设置`"
  >
    <Alert
      :message="
        activeTab === 'status'
          ? '状态用于业务流转，初始状态用于新建工作项。'
          : '拖动状态到看板列；未放入看板的状态仍可用于工作项流转，但不会显示为看板列。'
      "
      class="mb-4"
      show-icon
      type="info"
    />
    <Tabs v-model:active-key="activeTab">
      <Tabs.TabPane key="status" tab="状态管理">
        <draggable
          v-model="statusList"
          handle=".status-drag-handle"
          item-key="id"
        >
          <template #item="{ element }">
            <div class="mb-3 flex items-center gap-3">
              <IconifyIcon
                class="status-drag-handle w-6 cursor-move text-muted-foreground"
                icon="lucide:grip-vertical"
              />
              <Input
                v-model:value="element.name"
                class="min-w-[120px] flex-1"
                :maxlength="50"
                placeholder="状态名称"
              />
              <Select
                v-model:value="element.statusType"
                :options="
                  getDictOptions(
                    DICT_TYPE.PMS_WORK_ITEM_STATUS_TYPE,
                    'number',
                  ).map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))
                "
                class="!w-[120px]"
              />
              <Input
                v-model:value="element.description"
                class="min-w-[150px] flex-1"
                :maxlength="255"
                placeholder="状态描述"
              />
              <Radio
                :checked="defaultStatusId === element.id"
                class="!mr-0 w-16 shrink-0"
                @change="defaultStatusId = element.id"
              >
                初始
              </Radio>
              <Button
                :disabled="element.id === defaultStatusId"
                danger
                type="link"
                @click="handleDelete(element)"
              >
                删除
              </Button>
            </div>
          </template>
        </draggable>
        <Button class="mt-2" @click="handleAdd">添加状态</Button>
      </Tabs.TabPane>
      <Tabs.TabPane key="board" tab="看板配置">
        <div class="mb-3.5 rounded-md bg-accent p-3">
          <div class="mb-2 text-[13px] font-semibold">未放入看板</div>
          <draggable
            v-model="unassignedStatuses"
            class="flex min-h-[38px] flex-wrap gap-2"
            group="work-item-board-status"
            item-key="id"
          >
            <template #item="{ element }">
              <Tag class="cursor-move">{{ element.name }}</Tag>
            </template>
          </draggable>
        </div>
        <draggable
          v-model="boardList"
          handle=".board-drag-handle"
          item-key="id"
        >
          <template #item="{ element, index }">
            <div class="mb-3 rounded-md border border-solid border-border p-3">
              <div class="mb-2.5 flex items-center gap-2.5">
                <IconifyIcon
                  class="board-drag-handle cursor-move text-muted-foreground"
                  icon="lucide:grip-vertical"
                />
                <Input
                  v-model:value="element.name"
                  :maxlength="50"
                  placeholder="请输入看板列名称"
                />
                <Button danger type="link" @click="handleDeleteBoard(index)">
                  删除列
                </Button>
              </div>
              <draggable
                v-model="element.statuses"
                class="flex min-h-[38px] flex-wrap gap-2 rounded bg-accent p-2"
                group="work-item-board-status"
                item-key="id"
              >
                <template #item="{ element: status }">
                  <Tag class="cursor-move">{{ status.name }}</Tag>
                </template>
              </draggable>
            </div>
          </template>
        </draggable>
        <Button @click="handleAddBoard">
          <IconifyIcon class="mr-1" icon="lucide:plus" />添加看板列
        </Button>
      </Tabs.TabPane>
    </Tabs>

    <!-- 删除状态并迁移工作项对话框 -->
    <StatusDeleteFormModal @success="handleDeleteSuccess" />
  </Modal>
</template>
