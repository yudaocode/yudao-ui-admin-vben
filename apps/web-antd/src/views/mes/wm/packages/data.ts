import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmPackageApi } from '#/api/mes/wm/packages';
import type { MesWmPackageLineApi } from '#/api/mes/wm/packages/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesProWorkOrderStatusEnum } from '@vben/constants';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getSimpleUserList } from '#/api/system/user';
import { MdClientSelect } from '#/views/mes/md/client/components';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdUnitMeasureSelect } from '#/views/mes/md/unitmeasure/components';
import { ProWorkOrderSelect } from '#/views/mes/pro/workorder/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改的表单 */
export function useFormSchema(
  formType: FormType,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'status',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'code',
      label: '装箱单编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入装箱单编号',
      },
      rules: 'required',
      suffix:
        formType === 'detail'
          ? undefined
          : () =>
              h(
                Button,
                {
                  type: 'default',
                  onClick: async () => {
                    const code = await generateAutoCode(
                      MesAutoCodeRuleCode.WM_PACKAGE_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              ),
    },
    {
      fieldName: 'packageDate',
      label: '装箱日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        placeholder: '请选择装箱日期',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'inspectorUserId',
      label: '检查员',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择检查员',
        valueField: 'id',
      },
    },
    {
      fieldName: 'salesOrderCode',
      label: '销售订单编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入销售订单编号',
      },
    },
    {
      fieldName: 'invoiceCode',
      label: '发票编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入发票编号',
      },
    },
    {
      fieldName: 'clientId',
      label: '客户',
      component: markRaw(MdClientSelect),
      componentProps: {
        placeholder: '请选择客户',
      },
    },
    {
      fieldName: 'sizeUnitId',
      label: '尺寸单位',
      component: markRaw(MdUnitMeasureSelect),
      componentProps: {
        placeholder: '请选择尺寸单位',
      },
    },
    {
      fieldName: 'length',
      label: '箱长度',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入箱长度',
        precision: 2,
      },
    },
    {
      fieldName: 'width',
      label: '箱宽度',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入箱宽度',
        precision: 2,
      },
    },
    {
      fieldName: 'height',
      label: '箱高度',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入箱高度',
        precision: 2,
      },
    },
    {
      fieldName: 'weightUnitId',
      label: '重量单位',
      component: markRaw(MdUnitMeasureSelect),
      componentProps: {
        placeholder: '请选择重量单位',
      },
    },
    {
      fieldName: 'netWeight',
      label: '净重',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入净重',
        precision: 2,
      },
    },
    {
      fieldName: 'grossWeight',
      label: '毛重',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入毛重',
        precision: 2,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '装箱单编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入装箱单编号',
      },
    },
    {
      fieldName: 'salesOrderCode',
      label: '销售订单编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入销售订单编号',
      },
    },
    {
      fieldName: 'clientId',
      label: '客户',
      component: markRaw(MdClientSelect),
      componentProps: {
        placeholder: '请选择客户',
      },
    },
    {
      fieldName: 'inspectorUserId',
      label: '检查员',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择检查员',
        valueField: 'id',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmPackageApi.Package>['columns'] {
  return [
    {
      field: 'code',
      title: '装箱单编号',
      minWidth: 250,
      fixed: 'left',
      treeNode: true,
      slots: { default: 'code' },
    },
    {
      field: 'packageDate',
      title: '装箱日期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'salesOrderCode',
      title: '销售订单编号',
      minWidth: 140,
    },
    {
      field: 'invoiceCode',
      title: '发票编号',
      minWidth: 120,
    },
    {
      field: 'clientCode',
      title: '客户编码',
      minWidth: 100,
    },
    {
      field: 'clientName',
      title: '客户名称',
      minWidth: 120,
    },
    {
      field: 'length',
      title: '箱长度',
      width: 80,
    },
    {
      field: 'width',
      title: '箱宽度',
      width: 80,
    },
    {
      field: 'height',
      title: '箱高度',
      width: 80,
    },
    {
      field: 'sizeUnitName',
      title: '尺寸单位',
      width: 90,
    },
    {
      field: 'netWeight',
      title: '净重',
      width: 80,
    },
    {
      field: 'grossWeight',
      title: '毛重',
      width: 80,
    },
    {
      field: 'weightUnitName',
      title: '重量单位',
      width: 90,
    },
    {
      field: 'inspectorName',
      title: '检查员',
      minWidth: 100,
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_PACKAGE_STATUS },
      },
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 子箱列表的字段 */
export function useSubPackageGridColumns(): VxeTableGridOptions<MesWmPackageApi.Package>['columns'] {
  return [
    {
      field: 'code',
      title: '装箱单编号',
      minWidth: 160,
      fixed: 'left',
    },
    {
      field: 'packageDate',
      title: '装箱日期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'salesOrderCode',
      title: '销售订单编号',
      minWidth: 140,
    },
    {
      field: 'invoiceCode',
      title: '发票编号',
      minWidth: 120,
    },
    {
      field: 'clientCode',
      title: '客户编码',
      minWidth: 100,
    },
    {
      field: 'clientName',
      title: '客户名称',
      minWidth: 120,
    },
    {
      field: 'netWeight',
      title: '净重',
      width: 80,
    },
    {
      field: 'grossWeight',
      title: '毛重',
      width: 80,
    },
    {
      field: 'weightUnitName',
      title: '重量单位',
      width: 90,
    },
    {
      field: 'inspectorName',
      title: '检查员',
      minWidth: 100,
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_PACKAGE_STATUS },
      },
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 装箱明细的表单 */
export function useLineFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'workOrderId',
      label: '生产工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        placeholder: '请选择生产工单',
        status: MesProWorkOrderStatusEnum.CONFIRMED,
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'itemId',
      label: '产品物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择产品物料',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'quantity',
      label: '装箱数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0.01,
        placeholder: '请输入装箱数量',
        precision: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'expireDate',
      label: '有效期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        placeholder: '请选择有效期',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}

/** 装箱明细列表的字段 */
export function useLineGridColumns(): VxeTableGridOptions<MesWmPackageLineApi.PackageLine>['columns'] {
  return [
    {
      field: 'itemCode',
      title: '产品物料编码',
      minWidth: 120,
    },
    {
      field: 'itemName',
      title: '产品物料名称',
      minWidth: 140,
    },
    {
      field: 'specification',
      title: '规格型号',
      minWidth: 120,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 80,
    },
    {
      field: 'quantity',
      title: '装箱数量',
      width: 100,
    },
    {
      field: 'workOrderCode',
      title: '生产工单编号',
      minWidth: 140,
    },
    {
      field: 'batchCode',
      title: '批次号',
      minWidth: 120,
    },
    {
      field: 'expireDate',
      title: '有效期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 选择弹窗的搜索表单 */
export function useSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '装箱单编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入装箱单编号',
      },
    },
    {
      fieldName: 'salesOrderCode',
      label: '销售订单编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入销售订单编号',
      },
    },
    {
      fieldName: 'clientId',
      label: '客户',
      component: markRaw(MdClientSelect),
      componentProps: {
        placeholder: '请选择客户',
      },
    },
    {
      fieldName: 'inspectorUserId',
      label: '检查员',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择检查员',
        valueField: 'id',
      },
    },
  ];
}

/** 选择弹窗的字段 */
export function useSelectGridColumns(
  multiple = true,
): VxeTableGridOptions<MesWmPackageApi.Package>['columns'] {
  return [
    {
      type: multiple ? 'checkbox' : 'radio',
      width: 50,
    },
    {
      field: 'code',
      title: '装箱单编号',
      minWidth: 160,
    },
    {
      field: 'packageDate',
      title: '装箱日期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'salesOrderCode',
      title: '销售订单编号',
      minWidth: 140,
    },
    {
      field: 'invoiceCode',
      title: '发票编号',
      minWidth: 120,
    },
    {
      field: 'clientCode',
      title: '客户编码',
      minWidth: 100,
    },
    {
      field: 'clientName',
      title: '客户名称',
      minWidth: 120,
    },
    {
      field: 'netWeight',
      title: '净重',
      width: 80,
    },
    {
      field: 'grossWeight',
      title: '毛重',
      width: 80,
    },
    {
      field: 'weightUnitName',
      title: '重量单位',
      width: 90,
    },
    {
      field: 'inspectorName',
      title: '检查员',
      minWidth: 100,
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_PACKAGE_STATUS },
      },
    },
  ];
}
