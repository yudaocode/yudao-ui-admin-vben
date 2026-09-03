<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeDocumentLabelApi } from '#/api/pms/kb/content/document/label';

import { nextTick } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message, Tag } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteKnowledgeDocumentLabel,
  getKnowledgeDocumentLabelList,
} from '#/api/pms/kb/content/document/label';

import { useLabelManageGridColumns } from './data';
import KnowledgeLabelForm from './knowledge-label-form.vue';

defineOptions({ name: 'PmsKnowledgeLabelManageDialog' });

// TODO @AI：已用 VXE 的话补 destroyOnClose。操作列继续走 TableAction。

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const [KnowledgeLabelFormModal, knowledgeLabelFormModalApi] = useVbenModal({
  connectedComponent: KnowledgeLabelForm,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useLabelManageGridColumns(),
    height: 360,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          const list = await getKnowledgeDocumentLabelList();
          return { list, total: list.length };
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
  } as VxeTableGridOptions<PmsKnowledgeDocumentLabelApi.KnowledgeDocumentLabel>,
});

/** 打开新增或编辑标签表单 */
function openForm(label?: PmsKnowledgeDocumentLabelApi.KnowledgeDocumentLabel) {
  knowledgeLabelFormModalApi
    .setData(label ? { id: label.id } : undefined)
    .open();
}

/** 删除文档标签 */
async function handleDelete(
  label: PmsKnowledgeDocumentLabelApi.KnowledgeDocumentLabel,
) {
  // 发起删除
  await deleteKnowledgeDocumentLabel(label.id);
  message.success('删除成功');
  await handleLabelChanged();
}

/** 处理标签数据变化 */
async function handleLabelChanged() {
  await gridApi.query();
  emit('success');
}

const [Modal] = useVbenModal({
  class: 'w-[720px]',
  footer: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    await nextTick();
    gridApi.query();
  },
});
</script>

<template>
  <Modal title="管理文档标签">
    <div class="mb-4 flex items-center justify-between">
      <span class="text-[13px] text-muted-foreground">
        文档标签可用于归类和快速筛选知识文档
      </span>
      <Button
        v-access:code="['pms:kb:library:update']"
        type="primary"
        @click="openForm()"
      >
        新增标签
      </Button>
    </div>
    <!-- 标签列表 -->
    <Grid>
      <template #name="{ row }">
        <Tag :color="row.color">{{ row.name }}</Tag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['pms:kb:library:update'],
              onClick: openForm.bind(null, row),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['pms:kb:library:delete'],
              popConfirm: {
                title: `确认删除标签“${row.name}”吗？`,
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 新增或修改文档标签 -->
    <KnowledgeLabelFormModal @success="handleLabelChanged" />
  </Modal>
</template>
