import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmArrivalNoticeApi } from '#/api/mes/wm/arrivalnotice';
import type { MesWmArrivalNoticeLineApi } from '#/api/mes/wm/arrivalnotice/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getRangePickerDefaultProps } from '#/utils';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdVendorSelect } from '#/views/mes/md/vendor/components';

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
      label: '通知单编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入通知单编号',
      },
      rules: 'required',
      suffix:
        formType === 'detail'
          ? undefined
          : () =>
              h(
                ElButton,
                {
                  onClick: async () => {
                    const code = await generateAutoCode(
                      MesAutoCodeRuleCode.WM_ARRIVAL_NOTICE_CODE,
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
      fieldName: 'purchaseOrderCode',
      label: '采购订单编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入采购订单编号',
      },
    },
    {
      fieldName: 'vendorId',
      label: '供应商',
      component: markRaw(MdVendorSelect),
      componentProps: {
        placeholder: '请选择供应商',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'arrivalDate',
      label: '到货日期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        format: 'YYYY-MM-DD',
        placeholder: '请选择到货日期',
        type: 'date',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'contactName',
      label: '联系人',
      component: 'Input',
      componentProps: {
        placeholder: '请输入联系人',
      },
    },
    {
      fieldName: 'contactTelephone',
      label: '联系方式',
      component: 'Input',
      componentProps: {
        placeholder: '请输入联系方式',
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
        clearable: true,
        placeholder: '请输入通知单编号',
      },
    },
    {
      fieldName: 'name',
      label: '通知单名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入通知单名称',
      },
    },
    {
      fieldName: 'purchaseOrderCode',
      label: '采购订单编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入采购订单编号',
      },
    },
    {
      fieldName: 'vendorId',
      label: '供应商',
      component: markRaw(MdVendorSelect),
      componentProps: {
        placeholder: '请选择供应商',
      },
    },
    {
      fieldName: 'arrivalDate',
      label: '到货日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmArrivalNoticeApi.ArrivalNotice>['columns'] {
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
      field: 'purchaseOrderCode',
      title: '采购订单编号',
      minWidth: 140,
    },
    {
      field: 'vendorName',
      title: '供应商名称',
      minWidth: 120,
    },
    {
      field: 'contactName',
      title: '联系人',
      minWidth: 100,
    },
    {
      field: 'contactTelephone',
      title: '联系方式',
      minWidth: 120,
    },
    {
      field: 'arrivalDate',
      title: '到货日期',
      width: 180,
      formatter: 'formatDate',
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_ARRIVAL_NOTICE_STATUS },
      },
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 通知单行子表的字段 */
export function useLineGridColumns(
  editable: boolean,
): VxeTableGridOptions<MesWmArrivalNoticeLineApi.ArrivalNoticeLine>['columns'] {
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
      field: 'arrivalQuantity',
      title: '到货数量',
      width: 100,
    },
    {
      field: 'iqcCheckFlag',
      title: '是否检验',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'qualifiedQuantity',
      title: '合格数量',
      width: 100,
    },
    {
      field: 'iqcCode',
      title: '检验单号',
      minWidth: 140,
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
      fieldName: 'arrivalQuantity',
      label: '到货数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 0.01,
        placeholder: '请输入到货数量',
        precision: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'iqcCheckFlag',
      label: '是否检验',
      component: 'Switch',
      rules: z.boolean().default(false),
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
