import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { handleTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { getSimpleDeptList } from '#/api/system/dept';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
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
      fieldName: 'deptId',
      label: '所属部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => {
          const data = await getSimpleDeptList();
          return handleTree(data);
        },
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择所属部门',
        defaultExpandAll: true,
      },
      rules: 'required',
    },
    {
      fieldName: 'name',
      label: '物品名称',
      component: 'Input',
      componentProps: {
        maxlength: 128,
        placeholder: '请输入物品名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'no',
      label: '物品编码',
      component: 'Input',
      componentProps: {
        maxlength: 64,
        placeholder: '请输入物品编码',
      },
    },
    {
      fieldName: 'category',
      label: '类别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SUPPLY_CATEGORY, 'number'),
        placeholder: '请选择类别',
      },
      rules: 'required',
    },
    {
      fieldName: 'manageType',
      label: '管理类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SUPPLY_MANAGE_TYPE, 'number'),
        placeholder: '请选择管理类型',
      },
      rules: 'required',
    },
    {
      fieldName: 'model',
      label: '规格型号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入规格型号',
      },
    },
    {
      fieldName: 'unit',
      label: '计量单位',
      component: 'Input',
      componentProps: {
        placeholder: '请输入计量单位',
      },
    },
    {
      fieldName: 'referencePrice',
      label: '参考单价',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 2,
        controlsPosition: 'right',
        placeholder: '请输入参考单价',
      },
    },
    {
      fieldName: 'stockQuantity',
      label: '库存数量',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 0,
        controlsPosition: 'right',
        placeholder: '请输入库存数量',
      },
      defaultValue: 0,
      rules: 'required',
    },
    {
      fieldName: 'minStockQuantity',
      label: '最低库存预警',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 0,
        controlsPosition: 'right',
        placeholder: '请输入最低库存预警值',
      },
      defaultValue: 0,
      rules: 'required',
    },
    {
      fieldName: 'picUrl',
      label: '物品图片',
      component: 'ImageUpload',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '正常', value: CommonStatusEnum.ENABLE },
          { label: '停用', value: CommonStatusEnum.DISABLE },
        ],
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: {
        precision: 0,
        controlsPosition: 'right',
        placeholder: '请输入排序',
      },
      defaultValue: 0,
      rules: 'required',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        maxlength: 500,
        placeholder: '请输入备注',
      },
      formItemClass: 'col-span-2',
    },
  ];
}

/** 入库的表单 */
export function useStockFormSchema(): VbenFormSchema[] {
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
      fieldName: 'name',
      label: '物品名称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'stockQuantity',
      label: '当前库存',
      component: 'InputNumber',
      componentProps: {
        disabled: true,
        precision: 0,
        controlsPosition: 'right',
      },
    },
    {
      fieldName: 'quantity',
      label: '入库数量',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        precision: 0,
        controlsPosition: 'right',
        placeholder: '请输入入库数量',
      },
      rules: 'required',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '物品名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入物品名称',
      },
    },
    {
      fieldName: 'no',
      label: '物品编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入物品编码',
      },
    },
    {
      fieldName: 'category',
      label: '类别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SUPPLY_CATEGORY, 'number'),
        clearable: true,
        placeholder: '请选择类别',
      },
    },
    {
      fieldName: 'manageType',
      label: '管理类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SUPPLY_MANAGE_TYPE, 'number'),
        clearable: true,
        placeholder: '请选择管理类型',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '正常', value: CommonStatusEnum.ENABLE },
          { label: '停用', value: CommonStatusEnum.DISABLE },
        ],
        clearable: true,
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '物品名称',
      minWidth: 140,
    },
    {
      field: 'no',
      title: '物品编码',
      minWidth: 120,
    },
    {
      field: 'category',
      title: '类别',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_SUPPLY_CATEGORY },
      },
    },
    {
      field: 'manageType',
      title: '管理类型',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_SUPPLY_MANAGE_TYPE },
      },
    },
    {
      field: 'model',
      title: '规格型号',
      minWidth: 100,
    },
    {
      field: 'unit',
      title: '计量单位',
      width: 80,
    },
    {
      field: 'referencePrice',
      title: '参考单价',
      width: 100,
      align: 'right',
      formatter: 'formatAmount2',
    },
    {
      field: 'stockQuantity',
      title: '库存数量',
      width: 100,
      align: 'center',
      slots: { default: 'stockQuantity' },
    },
    {
      field: 'minStockQuantity',
      title: '最低库存',
      width: 90,
      align: 'center',
    },
    {
      field: 'picUrl',
      title: '图片',
      width: 80,
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 80,
      slots: { default: 'statusTag' },
    },
    {
      field: 'deptName',
      title: '所属部门',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
