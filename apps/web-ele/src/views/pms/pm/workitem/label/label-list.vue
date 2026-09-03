<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsWorkItemLabelApi } from '#/api/pms/pm/workitem/label';

import { nextTick } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElButton, ElMessage, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteWorkItemLabel,
  getWorkItemLabelList,
} from '#/api/pms/pm/workitem/label';

import { useLabelGridColumns } from './data';
import LabelForm from './label-form.vue';

defineOptions({ name: 'PmsWorkItemLabelList' });

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const [LabelFormModal, labelFormModalApi] = useVbenModal({
  connectedComponent: LabelForm,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useLabelGridColumns(),
    height: 360,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          const list = await getWorkItemLabelList();
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
  } as VxeTableGridOptions<PmsWorkItemLabelApi.WorkItemLabel>,
});

/** 打开标签表单 */
function openForm(label?: PmsWorkItemLabelApi.WorkItemLabel) {
  labelFormModalApi.setData({ id: label?.id }).open();
}

/** 标签表单提交成功 */
async function handleFormSuccess() {
  await gridApi.query();
  emit('success');
}

/** 删除工作项标签 */
async function handleDelete(label: PmsWorkItemLabelApi.WorkItemLabel) {
  if (!label.id) {
    return;
  }
  await deleteWorkItemLabel(label.id);
  ElMessage.success('删除成功');
  await gridApi.query();
  emit('success');
}

const [Modal] = useVbenModal({
  class: 'w-[680px]',
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
  <Modal title="工作项标签管理">
    <div class="mb-3 flex justify-end">
      <ElButton type="primary" @click="openForm()">新增标签</ElButton>
    </div>
    <!-- 标签列表 -->
    <Grid>
      <template #name="{ row }">
        <ElTag :color="row.color" effect="dark">{{ row.name }}</ElTag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              onClick: openForm.bind(null, row),
            },
            {
              label: '删除',
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              popConfirm: {
                title: `确认删除标签“${row.name}”吗？`,
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 标签表单 -->
    <LabelFormModal @success="handleFormSuccess" />
  </Modal>
</template>
