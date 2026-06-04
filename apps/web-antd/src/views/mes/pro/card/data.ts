import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProCardApi } from '#/api/mes/pro/card';
import type { MesProCardProcessApi } from '#/api/mes/pro/card/process';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesProWorkOrderStatusEnum } from '@vben/constants';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdWorkstationSelect } from '#/views/mes/md/workstation/components';
import { ProProcessSelect } from '#/views/mes/pro/process/components';
import { ProWorkOrderSelect } from '#/views/mes/pro/workorder/components';
import { UserSelect } from '#/views/system/user/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'finish' | 'update';

/** 表头是否只读（完成、详情态） */
function isHeaderReadonly(formType: FormType): boolean {
  return formType === 'detail' || formType === 'finish';
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
      fieldName: 'status',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'code',
      label: '流转卡编码',
      component: 'Input',
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请输入流转卡编码',
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
                      MesAutoCodeRuleCode.PRO_CARD_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              )
          : undefined,
    },
    {
      fieldName: 'workOrderId',
      label: '生产工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请选择生产工单',
        status: MesProWorkOrderStatusEnum.CONFIRMED,
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'itemId',
      label: '产品',
      component: markRaw(MdItemSelect),
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请选择产品',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'transferedQuantity',
      label: '流转数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        disabled: headerReadonly,
        min: 0,
        placeholder: '请输入流转数量',
        precision: 2,
      },
      rules: 'required',
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
      label: '流转卡编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入流转卡编码',
      },
    },
    {
      fieldName: 'workOrderId',
      label: '生产工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        placeholder: '请选择生产工单',
      },
    },
    {
      fieldName: 'itemId',
      label: '产品',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择产品',
      },
    },
    {
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入批次号',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesProCardApi.Card>['columns'] {
  return [
    {
      field: 'code',
      title: '流转卡编码',
      width: 160,
      slots: { default: 'code' },
    },
    {
      field: 'workOrderCode',
      title: '生产工单编号',
      width: 160,
    },
    {
      field: 'workOrderName',
      title: '工单名称',
      minWidth: 150,
    },
    {
      field: 'batchCode',
      title: '批次号',
      width: 120,
    },
    {
      field: 'itemCode',
      title: '产品物料编码',
      width: 140,
    },
    {
      field: 'itemName',
      title: '产品物料名称',
      minWidth: 120,
    },
    {
      field: 'specification',
      title: '规格型号',
      width: 120,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 80,
    },
    {
      field: 'transferedQuantity',
      title: '流转数量',
      width: 100,
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_WORK_ORDER_STATUS },
      },
    },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 工序记录子表的字段 */
export function useProcessGridColumns(
  editable: boolean,
): VxeTableGridOptions<MesProCardProcessApi.CardProcess>['columns'] {
  return [
    {
      field: 'sort',
      title: '序号',
      width: 60,
    },
    {
      field: 'processName',
      title: '工序名称',
      minWidth: 120,
    },
    {
      field: 'processCode',
      title: '工序编码',
      width: 120,
    },
    {
      field: 'inputTime',
      title: '进入工序时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'outputTime',
      title: '出工序时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'inputQuantity',
      title: '投入数量',
      width: 100,
    },
    {
      field: 'outputQuantity',
      title: '产出数量',
      width: 100,
    },
    {
      field: 'unqualifiedQuantity',
      title: '不良品数量',
      width: 100,
    },
    {
      field: 'workstationCode',
      title: '工位编码',
      width: 120,
    },
    {
      field: 'workstationName',
      title: '工位名称',
      minWidth: 120,
    },
    {
      field: 'nickname',
      title: '操作人',
      width: 100,
    },
    ...(editable
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

/** 工序记录新增/修改的表单 */
export function useProcessFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'sort',
      label: '序号',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入序号',
        precision: 0,
      },
    },
    {
      fieldName: 'processId',
      label: '工序',
      component: markRaw(ProProcessSelect),
      componentProps: {
        placeholder: '请选择工序',
      },
    },
    {
      fieldName: 'inputTime',
      label: '进入工序时间',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        placeholder: '请选择进入工序时间',
        showTime: true,
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'outputTime',
      label: '出工序时间',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        placeholder: '请选择出工序时间',
        showTime: true,
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'inputQuantity',
      label: '投入数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入投入数量',
        precision: 2,
      },
    },
    {
      fieldName: 'outputQuantity',
      label: '产出数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入产出数量',
        precision: 2,
      },
    },
    {
      fieldName: 'unqualifiedQuantity',
      label: '不合格数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入不合格数量',
        precision: 2,
      },
    },
    {
      fieldName: 'workstationId',
      label: '工位',
      component: markRaw(MdWorkstationSelect),
      componentProps: {
        placeholder: '请选择工位',
      },
    },
    {
      fieldName: 'userId',
      label: '操作人',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择操作人',
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

/** 流转卡选择弹窗的搜索表单 */
export function useCardSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '流转卡编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入流转卡编号',
      },
    },
    {
      fieldName: 'workOrderId',
      label: '生产工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        placeholder: '请选择生产工单',
      },
    },
    {
      fieldName: 'itemId',
      label: '产品物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择产品物料',
      },
    },
    {
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入批次号',
      },
    },
  ];
}

/** 流转卡选择弹窗的字段 */
export function useCardSelectGridColumns(
  multiple = false,
): VxeTableGridOptions<MesProCardApi.Card>['columns'] {
  return [
    {
      type: multiple ? 'checkbox' : 'radio',
      width: 50,
    },
    {
      field: 'code',
      title: '流转卡编号',
      width: 160,
    },
    {
      field: 'workOrderCode',
      title: '生产工单编号',
      width: 160,
    },
    {
      field: 'itemCode',
      title: '产品物料编码',
      width: 140,
    },
    {
      field: 'batchCode',
      title: '批次号',
      width: 120,
    },
    {
      field: 'itemName',
      title: '产品物料名称',
      minWidth: 150,
    },
    {
      field: 'specification',
      title: '规格型号',
      width: 120,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 80,
    },
    {
      field: 'transferedQuantity',
      title: '流转数量',
      width: 100,
    },
  ];
}
