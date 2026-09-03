<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectGroupApi } from '#/api/pms/pm/project/group';

import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { ElButton, ElMessage, ElTooltip } from 'element-plus';
import Sortable from 'sortablejs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteProjectGroup,
  getProjectGroupList,
  updateProjectGroupSort,
} from '#/api/pms/pm/project/group';
import { PmsProjectGroupType } from '#/views/pms/pm/utils/constants';

import { useGridColumns } from './data';
import ProjectGroupForm from './project-group-form.vue';

defineOptions({ name: 'PmsProjectGroupList' });

// TODO @AI：删除改 TableAction popConfirm。补 destroyOnClose。

const emit = defineEmits(['success']); // 定义 success 事件，用于项目分组发生变化后的回调

const { hasAccessByCodes } = useAccess();
const sortLoading = ref(false); // 保存排序的加载中
const sortChanged = ref(false); // 分组排序是否发生变化
const groupList = ref<PmsProjectGroupApi.ProjectGroup[]>([]); // 项目分组列表
const gridWrapperRef = ref<HTMLElement>(); // 表格容器 Ref
let sortable: Sortable | undefined; // 表格拖拽实例

const [ProjectGroupFormModal, projectGroupFormModalApi] = useVbenModal({
  connectedComponent: ProjectGroupForm,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 440,
    pagerConfig: { enabled: false },
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async () => {
          const list = await getProjectGroupList();
          groupList.value = list;
          sortChanged.value = false;
          return { list, total: list.length };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<PmsProjectGroupApi.ProjectGroup>,
});

/** 项目分组发生变化 */
async function handleGroupChanged() {
  await gridApi.query();
  emit('success');
}

/** 打开项目分组表单 */
function openForm(group?: PmsProjectGroupApi.ProjectGroup) {
  projectGroupFormModalApi.setData(group).open();
}

/** 初始化表格拖拽排序 */
function initSortable() {
  sortable?.destroy();
  const tableBody = gridWrapperRef.value?.querySelector(
    '.vxe-table--body tbody',
  );
  if (!tableBody) {
    return;
  }
  sortable = Sortable.create(tableBody as HTMLElement, {
    animation: 150,
    disabled: !hasAccessByCodes(['pms:pm:project-group:update']),
    handle: '.drag-handle',
    onEnd: ({ newIndex, oldIndex }) => {
      if (
        oldIndex === undefined ||
        newIndex === undefined ||
        oldIndex === newIndex
      ) {
        return;
      }
      groupList.value.splice(
        newIndex,
        0,
        groupList.value.splice(oldIndex, 1)[0]!,
      );
      sortChanged.value = true;
    },
  });
}

/** 表格数据刷新后重建拖拽实例 */
watch(
  groupList,
  async () => {
    await nextTick();
    initSortable();
  },
  { flush: 'post' },
);

/** 保存排序按钮操作 */
async function handleSaveSort() {
  sortLoading.value = true;
  try {
    // 提交项目分组排序
    await updateProjectGroupSort(
      groupList.value.map((group, index) => ({ id: group.id!, sort: index })),
    );
    // 提示成功并关闭弹窗
    ElMessage.success('保存排序成功');
    emit('success');
    modalApi.close();
  } finally {
    sortLoading.value = false;
  }
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await confirm('是否确认删除该分组？');
    // 发起删除
    await deleteProjectGroup(id);
    ElMessage.success('删除成功');
    // 刷新列表
    await gridApi.query();
    emit('success');
  } catch {
  }
}

/** 销毁拖拽实例 */
function destroySortable() {
  sortable?.destroy();
  sortable = undefined;
}

const [Modal, modalApi] = useVbenModal({
  class: 'w-[760px]',
  footer: false,
  onClosed() {
    destroySortable();
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    gridApi.query();
  },
});

/** 销毁 */
onBeforeUnmount(() => destroySortable());
</script>

<template>
  <Modal title="管理分组">
    <!-- 分组说明与操作 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="text-[13px] text-muted-foreground">
        项目分组是个人视图，不会影响其他项目成员
      </div>
      <ElButton
        v-access:code="['pms:pm:project-group:create']"
        type="primary"
        @click="openForm()"
      >
        新增分组
      </ElButton>
    </div>

    <!-- 分组列表 -->
    <div ref="gridWrapperRef">
      <Grid>
        <template #sort>
          <ElTooltip content="拖动排序" placement="top">
            <IconifyIcon
              class="drag-handle cursor-move text-muted-foreground"
              icon="lucide:grip-vertical"
            />
          </ElTooltip>
        </template>
        <template #actions="{ row }">
          <template v-if="row.type === PmsProjectGroupType.CUSTOM">
            <ElButton
              v-access:code="['pms:pm:project-group:update']"
              link
              size="small"
              type="primary"
              @click="openForm(row)"
            >
              编辑
            </ElButton>
            <ElButton
              v-access:code="['pms:pm:project-group:delete']"
              link
              size="small"
              type="danger"
              @click="handleDelete(row.id as number)"
            >
              删除
            </ElButton>
          </template>
        </template>
      </Grid>
    </div>
    <div class="mt-4 flex justify-end gap-2">
      <ElButton
        v-access:code="['pms:pm:project-group:update']"
        :disabled="!sortChanged"
        :loading="sortLoading"
        type="primary"
        @click="handleSaveSort"
      >
        保存排序
      </ElButton>
      <ElButton @click="modalApi.close()">关闭</ElButton>
    </div>

    <!-- 新建或修改项目分组 -->
    <ProjectGroupFormModal @success="handleGroupChanged" />
  </Modal>
</template>
