<script setup lang="ts">
import { reactive, ref } from 'vue';

import { useVbenModal, type VbenFormProps } from '@vben/common-ui';
import {
  useVbenVxeGrid,
  type VxeGridListeners,
  type VxeGridProps,
} from '@vben/plugins/vxe-table';

import { getSchemaTableList } from '#/api/infra/codegen';
import {
  type DataSourceConfigApi,
  getDataSourceConfigList,
} from '#/api/infra/data-source-config';

import { CodegenImportTableModalData } from '../codegen.data';

// checked
const checkedStatus = ref<boolean>(false);

const dataSourceConfigList =
  ref<DataSourceConfigApi.DataSourceConfigRespVO[]>();

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
  onOpenChange: async (isOpen) => {
    if (isOpen) {
      // 获取数据源配置列表
      dataSourceConfigList.value = await getDataSourceConfigList();
      // 设置下拉框
      gridApi.formApi.updateSchema([
        {
          fieldName: 'dataSourceConfigId',
          componentProps: {
            options: dataSourceConfigList.value?.map((item) => ({
              label: item.name,
              value: item.id,
            })),
          },
        },
      ]);
      // 设置默认值
      gridApi.formApi.setFieldValue(
        'dataSourceConfigId',
        dataSourceConfigList.value?.[0]?.id,
      );

      // 加载表格数据
      gridApi.reload(await gridApi.formApi.getValues());
    }
  },
});
</script>

<template>
  <Modal>
    <Grid />
  </Modal>
</template>
