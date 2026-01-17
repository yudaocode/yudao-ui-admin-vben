<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type {
  VxeGridPropTypes,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { BpmProcessExpressionApi } from '#/api/bpm/processExpression';

import { useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProcessExpressionPage } from '#/api/bpm/processExpression';

defineOptions({ name: 'ProcessExpressionSelectModal' });

const emit = defineEmits<{
  select: [expression: BpmProcessExpressionApi.ProcessExpression];
}>();

// 配置 VxeGrid
const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    showOverflow: true,
    minHeight: 300,
    proxyConfig: {
      ajax: {
        // 查询表达式列表
        query: async ({ page }, formValues) => {
          return await getProcessExpressionPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
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
  contentClass: 'bg-background-deep p-3',
  destroyOnClose: true,
});

// 选择表达式
function handleSelect(row: BpmProcessExpressionApi.ProcessExpression) {
  emit('select', row);
  modalApi.close();
}

/** 列表的搜索表单 */
function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '名字',
      component: 'Input',
      componentProps: {
        placeholder: '请输入名字',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      defaultValue: CommonStatusEnum.ENABLE,
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
        disabled: true,
      },
    },
  ];
}
function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'name', title: '名字', minWidth: 160 },
    { field: 'expression', title: '表达式', minWidth: 260 },
    {
      field: 'status',
      title: '状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'action',
      title: '操作',
      width: 120,
      slots: { default: 'action' },
    },
  ];
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
