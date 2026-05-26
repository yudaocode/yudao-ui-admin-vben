<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProProcessContentApi } from '#/api/mes/pro/process/content';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteProcessContent,
  getProcessContentListByProcessId,
} from '#/api/mes/pro/process/content';
import { $t } from '#/locales';

import { useContentGridColumns } from '../data';
import ContentForm from './content-form.vue';

const props = defineProps<{
  formType: FormType;
  processId: number;
}>();

const isEditable = ref(props.formType !== 'detail'); // 是否可编辑
const list = ref<MesProProcessContentApi.ProcessContent[]>([]);

const [ContentFormModal, contentFormModalApi] = useVbenModal({
  connectedComponent: ContentForm,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    autoResize: true,
    border: true,
    columns: useContentGridColumns(),
    data: list.value,
    minHeight: 240,
    pagerConfig: { enabled: false },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    showOverflow: true,
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<MesProProcessContentApi.ProcessContent>,
});

/** 加载工序内容列表 */
async function getList() {
  gridApi.setLoading(true);
  try {
    list.value = await getProcessContentListByProcessId(props.processId);
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

/** 新增工序步骤 */
function handleCreate() {
  const maxSort = Math.max(0, ...list.value.map((item) => item.sort || 0));
  contentFormModalApi
    .setData({ maxSort, processId: props.processId })
    .open();
}

/** 编辑工序步骤 */
function handleEdit(row: MesProProcessContentApi.ProcessContent) {
  contentFormModalApi.setData({ id: row.id, processId: props.processId }).open();
}

/** 删除工序步骤 */
async function handleDelete(row: MesProProcessContentApi.ProcessContent) {
  await deleteProcessContent(row.id!);
  message.success($t('ui.actionMessage.deleteSuccess', ['工序步骤']));
  await getList();
}

watch(
  () => props.processId,
  (value) => {
    if (value) {
      getList();
    }
  },
  { immediate: true },
);
</script>

<template>
  <ContentFormModal @success="getList" />
  <div v-if="isEditable" class="mb-3 flex items-center justify-start">
    <TableAction
      :actions="[
        {
          label: $t('ui.actionTitle.create', ['步骤']),
          type: 'primary',
          onClick: handleCreate,
        },
      ]"
    />
  </div>
  <Grid class="w-full" table-title="工序操作步骤">
    <template #actions="{ row }">
      <TableAction
        :actions="[
          {
            label: $t('common.edit'),
            type: 'link',
            ifShow: () => isEditable,
            onClick: handleEdit.bind(null, row),
          },
          {
            label: $t('common.delete'),
            type: 'link',
            danger: true,
            ifShow: () => isEditable,
            popConfirm: {
              title: $t('ui.actionMessage.deleteConfirm', ['工序步骤']),
              confirm: handleDelete.bind(null, row),
            },
          },
        ]"
      />
    </template>
  </Grid>
</template>
