import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmSalesNoticeApi } from '#/api/mes/wm/salesnotice';
import type { MesWmSalesNoticeLineApi } from '#/api/mes/wm/salesnotice/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { MdClientSelect } from '#/views/mes/md/client/components';
import { MdItemSelect } from '#/views/mes/md/item/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'finish' | 'update';

/** 表单头部是否只读（详情、执行出库态） */
function isHeaderReadonly(formType: FormType): boolean {
  return formType === 'detail' || formType === 'finish';
}

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
      label: '通知单编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入通知单编号',
      },
      rules: 'required',
      suffix: isHeaderReadonly(formType)
        ? undefined
        : () =>
            h(
              Button,
              {
                type: 'default',
                onClick: async () => {
                  const code = await generateAutoCode(
                    MesAutoCodeRuleCode.WM_SALES_NOTICE_CODE,
                  );
                  await formApi?.setFieldValue('code', code);
                },
              },
              { default: () => '生成' },
            ),
    },
    {
      fieldName: 'name',
      label: '通知单名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入通知单名称',
      },
      rules: 'required',
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
      fieldName: 'clientId',
      label: '客户',
      component: markRaw(MdClientSelect),
      componentProps: {
        placeholder: '请选择客户',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'salesDate',
      label: '发货日期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        format: 'YYYY-MM-DD',
        placeholder: '请选择发货日期',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'recipientName',
      label: '收货人',
      component: 'Input',
      componentProps: {
        placeholder: '请输入收货人',
      },
    },
    {
      fieldName: 'recipientTelephone',
      label: '联系方式',
      component: 'Input',
      componentProps: {
        placeholder: '请输入联系方式',
      },
    },
    {
      fieldName: 'recipientAddress',
      label: '收货地址',
      component: 'Input',
      componentProps: {
        placeholder: '请输入收货地址',
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
      label: '通知单编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入通知单编号',
      },
    },
    {
      fieldName: 'name',
      label: '通知单名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入通知单名称',
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
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmSalesNoticeApi.SalesNotice>['columns'] {
  return [
    {
      field: 'code',
      title: '通知单编号',
      minWidth: 160,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '通知单名称',
      minWidth: 150,
    },
    {
      field: 'salesOrderCode',
      title: '销售订单编号',
      minWidth: 140,
    },
    {
      field: 'clientName',
      title: '客户名称',
      minWidth: 120,
    },
    {
      field: 'salesDate',
      title: '发货日期',
      width: 180,
      formatter: 'formatDate',
    },
    {
      field: 'recipientName',
      title: '收货人',
      minWidth: 100,
    },
    {
      field: 'recipientTelephone',
      title: '联系方式',
      minWidth: 120,
    },
    {
      field: 'recipientAddress',
      title: '收货地址',
      minWidth: 200,
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_SALES_NOTICE_STATUS },
      },
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 通知单行子表的字段 */
export function useLineGridColumns(
  editable: boolean,
): VxeTableGridOptions<MesWmSalesNoticeLineApi.SalesNoticeLine>['columns'] {
  return [
    {
      field: 'itemCode',
      title: '物料编码',
      minWidth: 120,
    },
    {
      field: 'itemName',
      title: '物料名称',
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
      title: '发货数量',
      width: 100,
    },
    {
      field: 'batchCode',
      title: '批次号',
      minWidth: 120,
    },
    {
      field: 'oqcCheckFlag',
      title: '是否检验',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 120,
    },
    ...(editable
      ? [
          {
            title: '操作',
            width: 120,
            fixed: 'right',
            slots: { default: 'actions' },
          } as const,
        ]
      : []),
  ];
}

/** 通知单行新增/修改的表单 */
export function useLineFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'itemId',
      label: '物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择物料',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'quantity',
      label: '发货数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0.01,
        placeholder: '请输入发货数量',
        precision: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入批次号',
      },
    },
    {
      fieldName: 'oqcCheckFlag',
      label: '是否检验',
      component: 'Switch',
      rules: z.boolean().default(true),
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
