import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvMachineryApi } from '#/api/mes/dv/machinery';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesDvMachineryStatusEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { MdWorkshopSelect } from '#/views/mes/md/workstation/components';

import { DvMachineryTypeSelect } from './type/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改设备的表单 */
export function useFormSchema(formType: FormType, formApi?: VbenFormApi): VbenFormSchema[] {
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
      fieldName: 'code',
      label: '设备编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入设备编码',
      },
      dependencies: {
        triggerFields: ['id'],
        componentProps: (values) => ({ disabled: !!values.id }),
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
                    const code = await generateAutoCode(MesAutoCodeRuleCode.DV_MACHINERY_CODE);
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '设备名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入设备名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'brand',
      label: '品牌',
      component: 'Input',
      componentProps: {
        placeholder: '请输入品牌',
      },
    },
    {
      fieldName: 'machineryTypeId',
      label: '设备类型',
      component: markRaw(DvMachineryTypeSelect),
      componentProps: {
        placeholder: '请选择设备类型',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'workshopId',
      label: '所属车间',
      component: markRaw(MdWorkshopSelect),
      componentProps: {
        placeholder: '请选择所属车间',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'status',
      label: '设备状态',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.MES_DV_MACHINERY_STATUS, 'number'),
      },
      rules: z.number().default(MesDvMachineryStatusEnum.STOP),
    },
    {
      fieldName: 'specification',
      label: '规格型号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入规格型号',
      },
    },
    {
      fieldName: 'lastCheckTime',
      label: '最近点检时间',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        disabled: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        showTime: true,
        valueFormat: 'x',
      },
      dependencies: {
        triggerFields: ['id'],
        show: () => formType === 'detail',
      },
    },
    {
      fieldName: 'lastMaintenTime',
      label: '最近保养时间',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        disabled: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        showTime: true,
        valueFormat: 'x',
      },
      dependencies: {
        triggerFields: ['id'],
        show: () => formType === 'detail',
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
      label: '设备编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入设备编码',
      },
    },
    {
      fieldName: 'name',
      label: '设备名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入设备名称',
      },
    },
    {
      fieldName: 'workshopId',
      label: '所属车间',
      component: markRaw(MdWorkshopSelect),
      componentProps: {
        allowClear: true,
        placeholder: '请选择所属车间',
      },
    },
    {
      fieldName: 'status',
      label: '设备状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_DV_MACHINERY_STATUS, 'number'),
        placeholder: '请选择设备状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesDvMachineryApi.Machinery>['columns'] {
  return [
    {
      field: 'code',
      title: '设备编码',
      minWidth: 140,
      slots: {
        default: 'code',
      },
    },
    { field: 'name', title: '设备名称', minWidth: 140 },
    { field: 'brand', title: '品牌', minWidth: 120 },
    { field: 'specification', title: '规格型号', minWidth: 140 },
    { field: 'machineryTypeName', title: '设备类型', minWidth: 140 },
    { field: 'workshopName', title: '所属车间', minWidth: 140 },
    {
      field: 'status',
      title: '设备状态',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_DV_MACHINERY_STATUS },
      },
    },
    {
      field: 'lastCheckTime',
      title: '最近点检时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'lastMaintenTime',
      title: '最近保养时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: {
        default: 'actions',
      },
    },
  ];
}

/** 导入表单 */
export function useImportFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'file',
      label: '设备数据',
      component: 'Upload',
      rules: 'required',
      help: '仅允许导入 xls、xlsx 格式文件',
    },
    {
      fieldName: 'updateSupport',
      label: '是否覆盖',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      rules: z.boolean().default(false),
      help: '是否更新已经存在的设备数据',
    },
  ];
}

/** 设备选择弹窗的搜索表单 */
export function useMachinerySelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '设备编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入设备编码',
      },
    },
    {
      fieldName: 'name',
      label: '设备名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入设备名称',
      },
    },
    {
      fieldName: 'workshopId',
      label: '所属车间',
      component: markRaw(MdWorkshopSelect),
      componentProps: {
        allowClear: true,
        placeholder: '请选择所属车间',
      },
    },
  ];
}

/** 设备选择弹窗的字段 */
export function useMachinerySelectGridColumns(
  multiple = false,
): VxeTableGridOptions<MesDvMachineryApi.Machinery>['columns'] {
  return [
    { type: multiple ? 'checkbox' : 'radio', width: 50 },
    { field: 'code', title: '设备编码', width: 120 },
    { field: 'name', title: '设备名称', minWidth: 120 },
    { field: 'brand', title: '品牌', minWidth: 120 },
    { field: 'specification', title: '规格型号', minWidth: 120 },
    { field: 'workshopName', title: '所属车间', width: 120 },
    {
      field: 'status',
      title: '设备状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_DV_MACHINERY_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 160,
      formatter: 'formatDateTime',
    },
  ];
}
