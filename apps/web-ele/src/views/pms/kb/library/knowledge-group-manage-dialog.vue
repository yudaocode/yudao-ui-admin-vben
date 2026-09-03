<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeGroupApi } from '#/api/pms/kb/library/group';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElButton, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteKnowledgeGroup,
  getKnowledgeGroupList,
  updateKnowledgeGroupSort,
} from '#/api/pms/kb/library/group';
import { PmsKnowledgeGroupType } from '#/views/pms/kb/utils/constants';

import { useKnowledgeGroupGridColumns } from './data';
import KnowledgeGroupForm from './knowledge-group-form.vue';

defineOptions({ name: 'PmsKnowledgeGroupManageDialog' });

// TODO @AI：已用 VXE 的话补 destroyOnClose。拖拽排序列和 system 同类页对齐。

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const saving = ref(false); // 保存排序中

const [KnowledgeGroupFormModal, knowledgeGroupFormModalApi] = useVbenModal({
  destroyOnClose: true,
  connectedComponent: KnowledgeGroupForm,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useKnowledgeGroupGridColumns(),
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          const list = await getKnowledgeGroupList();
          return { list, total: list.length };
        },
      },
    },
    rowConfig: {
      drag: true,
      isHover: true,
      keyField: 'id',
    },
    rowDragConfig: {
      trigger: 'cell',
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<PmsKnowledgeGroupApi.KnowledgeGroup>,
});

/** 编辑知识库分组 */
function handleEdit(row: PmsKnowledgeGroupApi.KnowledgeGroup) {
  knowledgeGroupFormModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 保存分组排序 */
async function handleSaveSort() {
  const { fullData } = gridApi.grid.getTableData();
  saving.value = true;
  try {
    await updateKnowledgeGroupSort(
      (fullData as PmsKnowledgeGroupApi.KnowledgeGroup[]).map(
        (group, index) => ({ id: group.id!, sort: index }),
      ),
    );
    ElMessage.success('排序保存成功');
    // 发送操作成功的事件
    emit('success');
    await gridApi.query();
  } finally {
    saving.value = false;
  }
}

/** 删除知识库分组 */
async function handleDelete(row: PmsKnowledgeGroupApi.KnowledgeGroup) {
  // 发起删除
  await deleteKnowledgeGroup(row.id!);
  ElMessage.success('删除成功');
  // 刷新列表
  emit('success');
  await gridApi.query();
}

/** 处理分组数据变化 */
async function handleGroupChanged() {
  emit('success');
  await gridApi.query();
}

const [Modal] = useVbenModal({
  class: 'w-[720px]',
  footer: false,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    gridApi.query();
  },
});
</script>

<template>
  <Modal title="管理知识库分组">
    <div class="mb-4 flex justify-between">
      <span class="text-[13px] text-[var(--el-text-color-secondary)]">
        知识库分组是个人视图，不会影响其他成员
      </span>
      <ElButton
        v-access:code="['pms:kb:library:create']"
        type="primary"
        @click="
          knowledgeGroupFormModalApi.setData({ formType: 'create' }).open()
        "
      >
        新增分组
      </ElButton>
    </div>
    <!-- 分组列表 -->
    <Grid>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['pms:kb:library:update'],
              ifShow: row.type === PmsKnowledgeGroupType.CUSTOM,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '删除',
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['pms:kb:library:delete'],
              ifShow: row.type === PmsKnowledgeGroupType.CUSTOM,
              popConfirm: {
                title: `确认删除分组“${row.name}”吗？知识库会回到未分组。`,
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
    <div class="mt-4 flex justify-end gap-2">
      <ElButton
        v-access:code="['pms:kb:library:update']"
        :disabled="saving"
        type="primary"
        @click="handleSaveSort"
      >
        保存排序
      </ElButton>
    </div>

    <!-- 新增或修改知识库分组 -->
    <KnowledgeGroupFormModal @success="handleGroupChanged" />
  </Modal>
</template>
