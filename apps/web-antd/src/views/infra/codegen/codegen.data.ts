import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { CodegenApi } from '#/api/infra/codegen';

import { getDataSourceConfigList } from '#/api/infra/data-source-config';
import { $t } from '#/locales';

export namespace CodegenDefaultData {
  /**
   * 代码生成字段定义 表格配置
   */
  export const tableColumns: VxeGridProps<CodegenApi.CodegenTableRespVO>['columns'] =
    [
      {
        type: 'checkbox',
        width: 50,
      },
      {
        type: 'seq',
        width: 50,
      },
      { field: 'id', title: '编号', width: 100 },
      { field: 'tableName', title: '表名' },
      { field: 'tableComment', title: '表描述' },
      { field: 'className', title: '实体类名' },
      { field: 'createTime', title: '创建时间', formatter: 'formatDateTime' },
      { field: 'updateTime', title: '更新时间', formatter: 'formatDateTime' },
      {
        field: 'action',
        fixed: 'right',
        width: 'auto',
        slots: { default: 'action' },
        title: $t('page.action.action'),
      },
    ];
  /**
   * 代码生成表定义 表格查询表单配置
   */
  export const formSchema: VbenFormProps['schema'] = [
    {
      label: '表名称',
      fieldName: 'tableName',
      component: 'Input',
    },
    {
      label: '表描述',
      fieldName: 'tableComment',
      component: 'Input',
    },
    {
      label: '创建时间',
      fieldName: 'createTime',
      component: 'DatePicker',
      componentProps: {
        type: 'daterange',
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
      },
    },
  ];
}

//* ****************************** ImportTableModal.vue *******************************//

export namespace CodegenImportTableModalData {
  /**
   * 导入表 表格配置
   */
  export const tableColumns: VxeGridProps<CodegenApi.DatabaseTableRespVO>['columns'] =
    [
      { type: 'checkbox', width: 50 },
      { type: 'seq', title: '序号', width: 50 },
      { field: 'name', title: '表名' },
      { field: 'comment', title: '表描述' },
    ];

  /**
   * 导入表 表格查询表单配置
   */
  export const formSchema: VbenFormProps['schema'] = [
    {
      label: '数据源',
      fieldName: 'dataSourceConfigId',
      component: 'ApiSelect',
      componentProps: {
        defaultSelectedFirst: true,
        allowClear: true,
        placeholder: '请选择数据源',
        api: getDataSourceConfigList,
        labelField: 'name',
        valueField: 'id',
      },
      componentEvents: (events, formApi) => {
        return {
          optionsChange: (value: any) => {
            // 设置默认选中第一个
            formApi.setFieldValue('dataSourceConfigId', value[0].id);
          },
        };
      },
    },
    {
      label: '表名称',
      fieldName: 'name',
      component: 'Input',
    },
    {
      label: '表描述',
      fieldName: 'comment',
      component: 'Input',
    },
  ];
}
