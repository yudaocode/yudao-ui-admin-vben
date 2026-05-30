import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdProductBomApi } from '#/api/mes/md/item/productBom';
import type { MesProWorkOrderApi } from '#/api/mes/pro/workorder';
import type { MesProWorkOrderBomApi } from '#/api/mes/pro/workorder/bom';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesProWorkOrderSourceTypeEnum, MesProWorkOrderTypeEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getRangePickerDefaultProps } from '#/utils';
import { MdClientSelect } from '#/views/mes/md/client/components';
import { MdItemSelect, MdProductBomSelect } from '#/views/mes/md/item/components';
import { MdVendorSelect } from '#/views/mes/md/vendor/components';

/** 表单类型 */
export type FormType = 'confirm' | 'create' | 'detail' | 'finish' | 'update';

/** 表头是否只读（确认、完成、详情态） */
function isHeaderReadonly(formType: FormType): boolean {
  return ['confirm', 'detail', 'finish'].includes(formType);
}

/** 新增/修改的表单 */
export function useFormSchema(
  formType: FormType,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
  const headerReadonly = isHeaderReadonly(formType);
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
      fieldName: 'parentId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'status',
      label: '工单状态',
      component: 'Select',
      componentProps: {
        disabled: true,
        options: getDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_STATUS, 'number'),
      },
      dependencies: {
        triggerFields: [''],
        show: () => formType !== 'create',
      },
    },
    {
      fieldName: 'code',
      label: '工单编码',
      component: 'Input',
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请输入工单编码',
      },
      rules: 'required',
      suffix:
        formType === 'create' || formType === 'update'
          ? () =>
              h(
                Button,
                {
                  type: 'default',
                  onClick: async () => {
                    const code = await generateAutoCode(
                      MesAutoCodeRuleCode.PRO_WORK_ORDER_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              )
          : undefined,
    },
    {
      fieldName: 'name',
      label: '工单名称',
      component: 'Input',
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请输入工单名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'orderSourceType',
      label: '工单来源',
      component: 'Select',
      componentProps: {
        disabled: headerReadonly,
        options: getDictOptions(
          DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE,
          'number',
        ),
        placeholder: '请选择工单来源',
        // 工单来源变更：非客户订单时清空来源单据编号和客户
        onChange: async (value: number) => {
          if (value !== MesProWorkOrderSourceTypeEnum.ORDER) {
            await formApi?.setValues({
              clientId: undefined,
              orderSourceCode: undefined,
            });
          }
        },
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'orderSourceCode',
      label: '来源单据编号',
      component: 'Input',
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请输入来源单据编号',
      },
      dependencies: {
        triggerFields: ['orderSourceType'],
        show: (values) =>
          values.orderSourceType === MesProWorkOrderSourceTypeEnum.ORDER,
      },
    },
    {
      fieldName: 'type',
      label: '工单类型',
      component: 'Select',
      componentProps: {
        disabled: headerReadonly,
        options: getDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_TYPE, 'number'),
        placeholder: '请选择工单类型',
        // 工单类型变更：非代工/采购时清空供应商
        onChange: async (value: number) => {
          if (
            value !== MesProWorkOrderTypeEnum.OUTSOURCE &&
            value !== MesProWorkOrderTypeEnum.PURCHASE
          ) {
            await formApi?.setFieldValue('vendorId', undefined);
          }
        },
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'productId',
      label: '产品',
      component: markRaw(MdItemSelect),
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请选择产品',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'quantity',
      label: '工单数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        disabled: headerReadonly,
        min: 1,
        placeholder: '请输入工单数量',
        precision: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'clientId',
      label: '客户',
      component: markRaw(MdClientSelect),
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请选择客户',
      },
      dependencies: {
        triggerFields: ['orderSourceType'],
        show: (values) =>
          values.orderSourceType === MesProWorkOrderSourceTypeEnum.ORDER,
      },
    },
    {
      fieldName: 'vendorId',
      label: '供应商',
      component: markRaw(MdVendorSelect),
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请选择供应商',
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) =>
          values.type === MesProWorkOrderTypeEnum.OUTSOURCE ||
          values.type === MesProWorkOrderTypeEnum.PURCHASE,
      },
    },
    {
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请输入批次号',
      },
    },
    {
      fieldName: 'requestDate',
      label: '需求日期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        disabled: headerReadonly,
        format: 'YYYY-MM-DD',
        placeholder: '请选择需求日期',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        disabled: headerReadonly,
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
      label: '工单编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入工单编码',
      },
    },
    {
      fieldName: 'name',
      label: '工单名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入工单名称',
      },
    },
    {
      fieldName: 'orderSourceCode',
      label: '来源单据',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入来源单据编号',
      },
    },
    {
      fieldName: 'productId',
      label: '产品',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择产品',
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
      fieldName: 'type',
      label: '工单类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_TYPE, 'number'),
        placeholder: '请选择工单类型',
      },
    },
    {
      fieldName: 'requestDate',
      label: '需求日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesProWorkOrderApi.WorkOrder>['columns'] {
  return [
    {
      field: 'code',
      title: '工单编码',
      fixed: 'left',
      width: 200,
      treeNode: true,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '工单名称',
      minWidth: 150,
    },
    {
      field: 'type',
      title: '工单类型',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_WORK_ORDER_TYPE },
      },
    },
    {
      field: 'orderSourceType',
      title: '工单来源',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE },
      },
    },
    {
      field: 'orderSourceCode',
      title: '来源单据编号',
      width: 140,
    },
    {
      field: 'productCode',
      title: '产品编码',
      width: 120,
    },
    {
      field: 'productName',
      title: '产品名称',
      minWidth: 120,
    },
    {
      field: 'productSpecification',
      title: '规格型号',
      width: 120,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 80,
    },
    {
      field: 'quantity',
      title: '工单数量',
      width: 100,
    },
    {
      field: 'quantityProduced',
      title: '已生产数量',
      width: 100,
    },
    {
      field: 'clientCode',
      title: '客户编码',
      width: 120,
    },
    {
      field: 'clientName',
      title: '客户名称',
      width: 120,
    },
    {
      field: 'requestDate',
      title: '需求日期',
      width: 180,
      formatter: 'formatDate',
    },
    {
      field: 'status',
      title: '工单状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_WORK_ORDER_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 工单 BOM 子表的字段 */
export function useBomGridColumns(
  editable: boolean,
  generatable: boolean,
): VxeTableGridOptions<MesProWorkOrderBomApi.WorkOrderBom>['columns'] {
  return [
    {
      field: 'itemCode',
      title: 'BOM 物料编码',
      width: 120,
    },
    {
      field: 'itemName',
      title: 'BOM 物料名称',
      minWidth: 150,
    },
    {
      field: 'itemSpecification',
      title: '规格型号',
      width: 120,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 80,
    },
    {
      field: 'itemOrProduct',
      title: '物料/产品',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_MD_ITEM_OR_PRODUCT },
      },
    },
    {
      field: 'quantity',
      title: '预计使用量',
      width: 120,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 120,
    },
    ...(editable || generatable
      ? [
          {
            title: '操作',
            width: 160,
            fixed: 'right',
            slots: { default: 'actions' },
          } as const,
        ]
      : []),
  ];
}

/** 工单 BOM 新增/修改的表单 */
export function useBomFormSchema(
  isCreate: boolean,
  productId?: number,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'itemId',
      label: '物料',
      component: markRaw(MdProductBomSelect),
      componentProps: {
        itemId: productId,
        placeholder: '请选择物料',
        // BOM 物料选中后自动回填预计使用量
        onChange: async (bom?: MesMdProductBomApi.ProductBom) => {
          await formApi?.setFieldValue('quantity', bom?.quantity ?? undefined);
        },
      },
      rules: 'selectRequired',
      dependencies: {
        triggerFields: [''],
        show: () => isCreate,
      },
    },
    {
      fieldName: 'itemName',
      label: '物料',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      dependencies: {
        triggerFields: [''],
        show: () => !isCreate,
      },
    },
    {
      fieldName: 'unitMeasureName',
      label: '单位',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      dependencies: {
        triggerFields: [''],
        show: () => !isCreate,
      },
    },
    {
      fieldName: 'quantity',
      label: '预计使用量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入预计使用量',
        precision: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}

/** 工单选择弹窗的搜索表单 */
export function useWorkOrderSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '工单编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入工单编码',
      },
    },
    {
      fieldName: 'name',
      label: '工单名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入工单名称',
      },
    },
    {
      fieldName: 'productId',
      label: '产品',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择产品',
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
      fieldName: 'status',
      label: '工单状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_STATUS, 'number'),
        placeholder: '请选择工单状态',
      },
    },
  ];
}

/** 工单选择弹窗的字段 */
export function useWorkOrderSelectGridColumns(
  multiple = false,
): VxeTableGridOptions<MesProWorkOrderApi.WorkOrder>['columns'] {
  return [
    {
      type: multiple ? 'checkbox' : 'radio',
      width: 50,
    },
    {
      field: 'code',
      title: '工单编码',
      width: 180,
    },
    {
      field: 'name',
      title: '工单名称',
      minWidth: 180,
    },
    {
      field: 'orderSourceType',
      title: '工单来源',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE },
      },
    },
    {
      field: 'orderSourceCode',
      title: '订单编号',
      width: 140,
    },
    {
      field: 'productCode',
      title: '产品编号',
      width: 120,
    },
    {
      field: 'productName',
      title: '产品名称',
      minWidth: 150,
    },
    {
      field: 'productSpecification',
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
      title: '工单数量',
      width: 100,
    },
    {
      field: 'clientCode',
      title: '客户编码',
      width: 120,
    },
    {
      field: 'clientName',
      title: '客户名称',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '工单状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_WORK_ORDER_STATUS },
      },
    },
    {
      field: 'requestDate',
      title: '需求日期',
      width: 120,
      formatter: 'formatDate',
    },
  ];
}

/** 工单物料需求子表的字段（只读） */
export function useItemGridColumns(): VxeTableGridOptions<MesProWorkOrderBomApi.WorkOrderBom>['columns'] {
  return [
    {
      field: 'itemCode',
      title: '物料编码',
      width: 120,
    },
    {
      field: 'itemName',
      title: '物料名称',
      minWidth: 150,
    },
    {
      field: 'itemSpecification',
      title: '规格型号',
      width: 120,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 80,
    },
    {
      field: 'itemOrProduct',
      title: '物料/产品',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_MD_ITEM_OR_PRODUCT },
      },
    },
    {
      field: 'quantity',
      title: '需求数量',
      width: 120,
    },
  ];
}
