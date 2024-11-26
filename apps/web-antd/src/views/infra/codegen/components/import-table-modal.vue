<script setup lang="ts">
import { reactive, ref } from 'vue';

import { useVbenModal, type VbenFormProps } from '@vben/common-ui';
import {
  useVbenVxeGrid,
  type VxeGridListeners,
  type VxeGridProps,
} from '@vben/plugins/vxe-table';

import { getSchemaTableList } from '#/api/infra/codegen';

import { CodegenImportTableModalData } from '../codegen.data';

// checked
const checkedStatus = ref<boolean>(false);

/**
 * 表格查询表单配置
 */
const formOptions = reactive<any>({
  // 默认展开
  collapsed: false,
  schema: CodegenImportTableModalData.formSchema,
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  // 按下回车时是否提交表单
  submitOnEnter: false,
} as VbenFormProps);

/**
 * 表格配置
 */
const gridOptions = reactive<any>({
  columns: CodegenImportTableModalData.tableColumns,
  toolbarConfig: {
    enabled: false,
  },
  height: 'auto',
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async (_, values) => {
        return await getSchemaTableList(values);
      },
    },
  },
  pagerConfig: {
    enabled: false,
  },
} as VxeGridProps);

const gridEvents = reactive<any>({
  checkboxChange: (params) => {
    const { checked } = params;
    checkedStatus.value = checked;
  },
  checkboxAll: (params) => {
    const { checked } = params;
    checkedStatus.value = checked;
  },
} as VxeGridListeners);

// 使用表格组件
const [Grid, gridApi] = useVbenVxeGrid(
  reactive({
    formOptions,
    gridOptions,
    gridEvents,
  }),
);

const [Modal] = useVbenModal({
  class: 'w-[800px] h-[800px]',
  onOpened: async () => {
    gridApi.reload(await gridApi.formApi.getValues());
  },
});
</script>

<template>
  <Modal>
    <Grid />
  </Modal>
</template>
