<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';
import type { PmsWorkItemStatusApi } from '#/api/pms/pm/workitem/status';

import { ref, watch } from 'vue';

import { getAllPageItems } from '@vben/utils';

import {
  Button,
  Checkbox,
  Empty,
  Input,
  message,
  Popconfirm,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createWorkItem,
  getWorkItemPage,
  recycleWorkItem,
  updateWorkItemName,
  updateWorkItemStatus,
} from '#/api/pms/pm/workitem';
import { getWorkItemStatusList } from '#/api/pms/pm/workitem/status';
import {
  PmsWorkItemLifecycleStatus,
  PmsWorkItemStatusType,
} from '#/views/pms/pm/utils/constants';

import { useColumns } from './data';

defineOptions({ name: 'PmsWorkItemSubtaskList' });

// TODO @AI：已用 VXE 的话操作列走 TableAction，不要手写按钮。

const props = withDefaults(
  defineProps<{
    editable: boolean;
    parentWorkItem: PmsWorkItemApi.WorkItem;
    showTitle?: boolean;
  }>(),
  { showTitle: true },
);

const emit = defineEmits<{ changed: [] }>(); // 定义 changed 事件，用于子工作项变化后的回调

const loading = ref(false); // 子工作项列表加载中
const creating = ref(false); // 子工作项创建中
const statusSavingId = ref<number>(); // 正在更新状态的子工作项编号
const subtaskList = ref<PmsWorkItemApi.WorkItem[]>([]); // 子工作项列表
const statusList = ref<PmsWorkItemStatusApi.WorkItemStatus[]>([]); // 工作项状态列表
const newSubtaskName = ref(''); // 新子工作项标题
const editingId = ref<number>(); // 正在改名的子工作项编号
const editingName = ref(''); // 正在编辑的子工作项标题

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(),
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          loading.value = true;
          try {
            const params = {
              projectId: props.parentWorkItem.projectId,
              type: props.parentWorkItem.type,
              lifecycleStatus: PmsWorkItemLifecycleStatus.ACTIVE,
              parentId: props.parentWorkItem.id,
            };
            // 并行加载页面所需数据
            const [page, fetchedStatuses] = await Promise.all([
              getAllPageItems<PmsWorkItemApi.WorkItem>((pageNo, pageSize) =>
                getWorkItemPage({ ...params, pageNo, pageSize }),
              ),
              getWorkItemStatusList(
                props.parentWorkItem.projectId,
                props.parentWorkItem.type,
              ),
            ]);
            subtaskList.value = page;
            statusList.value = fetchedStatuses;
            return { list: page, total: page.length };
          } finally {
            loading.value = false;
          }
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

/** 创建子工作项 */
async function handleCreate() {
  // 校验子工作项标题
  const name = newSubtaskName.value.trim();
  if (!name) {
    message.warning('请输入子工作项标题');
    return;
  }
  // 继承父工作项的核心属性并创建子工作项
  creating.value = true;
  try {
    await createWorkItem({
      projectId: props.parentWorkItem.projectId,
      type: props.parentWorkItem.type,
      name,
      priority: props.parentWorkItem.priority,
      assigneeUserId: props.parentWorkItem.assigneeUserId,
      memberUserIds: props.parentWorkItem.memberUserIds,
      iterationId: props.parentWorkItem.iterationId,
      parentId: props.parentWorkItem.id,
      relatedRequirementId: props.parentWorkItem.relatedRequirementId,
      defectType: props.parentWorkItem.defectType,
      progress: 0,
      fileUrls: [],
      labelIds: [],
    });
    // 清空输入并刷新子工作项列表
    newSubtaskName.value = '';
    message.success('子工作项创建成功');
    await gridApi.query();
    emit('changed');
  } finally {
    creating.value = false;
  }
}

/** 开始重命名 */
function startRename(workItem: PmsWorkItemApi.WorkItem) {
  editingId.value = workItem.id;
  editingName.value = workItem.name;
}

/** 提交重命名 */
async function handleRename(workItem: PmsWorkItemApi.WorkItem) {
  // 校验子工作项标题
  const name = editingName.value.trim();
  if (!name) {
    message.warning('请输入子工作项标题');
    return;
  }
  // 更新标题并刷新列表
  await updateWorkItemName(workItem.id!, name);
  editingId.value = undefined;
  message.success('子工作项名称已更新');
  await gridApi.query();
  emit('changed');
}

/** 切换工作项状态 */
async function handleStatusChange(
  workItem: PmsWorkItemApi.WorkItem,
  completed: boolean,
) {
  // 查找目标语义对应的项目状态
  const targetType = completed
    ? PmsWorkItemStatusType.COMPLETED
    : PmsWorkItemStatusType.PENDING;
  const targetStatus = statusList.value.find(
    (status) => status.statusType === targetType,
  );
  if (!targetStatus) {
    message.warning(completed ? '请先配置已完成状态' : '请先配置未开始状态');
    return;
  }
  // 更新状态并刷新列表
  statusSavingId.value = workItem.id;
  try {
    await updateWorkItemStatus(workItem.id!, targetStatus.id);
    await gridApi.query();
    emit('changed');
  } finally {
    statusSavingId.value = undefined;
  }
}

/** 移入回收站 */
async function handleRecycle(workItem: PmsWorkItemApi.WorkItem) {
  await recycleWorkItem(workItem.id!);
  message.success('子工作项已移入回收站');
  await gridApi.query();
  emit('changed');
}

/** 监听父工作项变化并刷新子工作项 */
watch(
  () => props.parentWorkItem.id,
  () => gridApi.query(),
);
</script>

<template>
  <div>
    <div v-if="showTitle" class="mb-3 font-semibold">子工作项</div>
    <!-- 快速创建 -->
    <div v-if="editable" class="mb-3 flex gap-2">
      <Input
        v-model:value="newSubtaskName"
        :maxlength="100"
        placeholder="输入子工作项标题，按回车保存"
        @press-enter="handleCreate"
      />
      <Button :loading="creating" type="primary" @click="handleCreate">
        添加
      </Button>
    </div>
    <!-- 子工作项列表 -->
    <Grid>
      <template #completed="{ row }">
        <Checkbox
          :checked="row.status === PmsWorkItemStatusType.COMPLETED"
          :disabled="!editable || statusSavingId === row.id"
          @change="handleStatusChange(row, $event.target.checked)"
        />
      </template>
      <template #name="{ row }">
        <div v-if="editingId === row.id" class="flex gap-2">
          <Input
            v-model:value="editingName"
            :maxlength="100"
            size="small"
            @press-enter="handleRename(row)"
          />
          <Button size="small" type="link" @click="handleRename(row)">
            保存
          </Button>
          <Button size="small" type="link" @click="editingId = undefined">
            取消
          </Button>
        </div>
        <span v-else>{{ row.name }}</span>
      </template>
      <template #action="{ row }">
        <template v-if="editable">
          <Button size="small" type="link" @click="startRename(row)">
            改名
          </Button>
          <Popconfirm
            :title="`确认删除子工作项“${row.name}”吗？删除后可在回收站恢复。`"
            cancel-text="取消"
            ok-text="确定"
            @confirm="handleRecycle(row)"
          >
            <Button danger size="small" type="link">删除</Button>
          </Popconfirm>
        </template>
      </template>
    </Grid>
    <Empty
      v-if="!loading && subtaskList.length === 0"
      description="暂无子工作项"
    />
  </div>
</template>
