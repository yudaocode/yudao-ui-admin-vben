<script lang="ts" setup>
import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { BpmProcessExpressionApi } from '#/api/bpm/processExpression';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum } from '@vben/constants';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProcessExpressionPage } from '#/api/bpm/processExpression';

defineOptions({ name: 'ProcessExpressionSelectModal' });

const emit = defineEmits<{
  select: [expression: BpmProcessExpressionApi.ProcessExpression];
}>();

// TODO @jason：这里是不是要迁移下？
// 查询参数
const queryParams = ref({
  status: CommonStatusEnum.ENABLE,
});

// 配置 VxeGrid
const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'name', title: '名字', minWidth: 160 },
      { field: 'expression', title: '表达式', minWidth: 260 },
      {
        field: 'action',
        title: '操作',
        width: 120,
        slots: { default: 'action' },
      },
    ],
    showOverflow: true,
    minHeight: 300,
    proxyConfig: {
      ajax: {
        // 查询表达式列表
        query: async ({ page }) => {
          return await getProcessExpressionPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            status: queryParams.value.status,
          });
        },
      },
    } as VxeGridPropTypes.ProxyConfig,
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      enabled: false,
    },
  },
});

// 配置 Modal
const [Modal, modalApi] = useVbenModal({
  showConfirmButton: false,
  destroyOnClose: true,
});

// 选择表达式
function handleSelect(row: BpmProcessExpressionApi.ProcessExpression) {
  emit('select', row);
  modalApi.close();
}
</script>

<template>
  <Modal class="w-4/5" title="请选择表达式">
    <Grid>
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              label: '选择',
              type: 'link',
              icon: 'lucide:pointer',
              onClick: handleSelect.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Modal>
</template>
