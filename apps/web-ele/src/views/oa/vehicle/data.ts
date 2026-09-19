import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { handleTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { getSimpleDeptList } from '#/api/system/dept';
import { getRangePickerDefaultProps } from '#/utils';
import { OA_VEHICLE_STATUS } from '#/views/oa/utils/constants';

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
        clearable: true,
        defaultExpandAll: true,
        checkStrictly: true,
      },
    },
    {
      fieldName: 'no',
      label: '车牌号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入车牌号',
      },
      rules: 'required',
    },
    {
      fieldName: 'name',
      label: '车辆名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入车辆名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_VEHICLE_STATUS, 'number'),
        placeholder: '请选择状态',
      },
      rules: z.number().default(OA_VEHICLE_STATUS.IDLE),
    },
    {
      fieldName: 'type',
      label: '车型',
      component: 'Input',
      componentProps: {
        placeholder: '请输入车型',
      },
      rules: 'required',
    },
    {
      fieldName: 'category',
      label: '车辆分类',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_VEHICLE_CATEGORY, 'string'),
        placeholder: '请选择车辆分类',
        clearable: true,
      },
    },
    {
      fieldName: 'brandModel',
      label: '品牌型号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入品牌型号',
      },
    },
    {
      fieldName: 'seatCount',
      label: '座位数',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        precision: 0,
        controlsPosition: 'right',
        placeholder: '请输入座位数',
      },
      rules: 'required',
    },
    {
      fieldName: 'barePrice',
      label: '裸车价格（元）',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 2,
        controlsPosition: 'right',
        placeholder: '请输入裸车价格',
      },
      rules: 'required',
    },
    {
      fieldName: 'compulsoryInsuranceExpireTime',
      label: '交强险到期时间',
      component: 'DatePicker',
      componentProps: {
        type: 'datetime',
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择交强险到期时间',
      },
    },
    {
      fieldName: 'commercialInsuranceExpireTime',
      label: '商业险到期时间',
      component: 'DatePicker',
      componentProps: {
        type: 'datetime',
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择商业险到期时间',
      },
    },
    {
      fieldName: 'inspectionExpireTime',
      label: '年检到期时间',
      component: 'DatePicker',
      componentProps: {
        type: 'datetime',
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择年检到期时间',
      },
    },
    {
      fieldName: 'picUrl',
      label: '车辆照片',
      component: 'ImageUpload',
    },
    {
      fieldName: 'sort',
      label: '显示顺序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 0,
        controlsPosition: 'right',
        placeholder: '请输入显示顺序',
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: '请输入备注',
      },
      formItemClass: 'col-span-2',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
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
        clearable: true,
        defaultExpandAll: true,
      },
    },
    {
      fieldName: 'no',
      label: '车牌号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入车牌号',
      },
    },
    {
      fieldName: 'name',
      label: '车辆名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入车辆名称',
      },
    },
    {
      fieldName: 'category',
      label: '分类',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_VEHICLE_CATEGORY, 'string'),
        clearable: true,
        placeholder: '请选择分类',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_VEHICLE_STATUS, 'number'),
        clearable: true,
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'type',
      label: '车型',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入车型',
      },
    },
    {
      fieldName: 'brandModel',
      label: '品牌型号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入品牌型号',
      },
    },
    {
      fieldName: 'compulsoryInsuranceExpireTime',
      label: '交强险到期时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
    {
      fieldName: 'commercialInsuranceExpireTime',
      label: '商业险到期时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
    {
      fieldName: 'inspectionExpireTime',
      label: '年检到期时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'deptName',
      title: '所属部门',
      minWidth: 140,
    },
    {
      field: 'no',
      title: '车牌号',
      minWidth: 140,
    },
    {
      field: 'name',
      title: '车辆名称',
      minWidth: 160,
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_VEHICLE_STATUS },
      },
    },
    {
      field: 'picUrl',
      title: '车辆照片',
      width: 100,
      slots: { default: 'picUrl' },
    },
    {
      field: 'type',
      title: '车型',
      minWidth: 100,
    },
    {
      field: 'category',
      title: '分类',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_VEHICLE_CATEGORY },
      },
    },
    {
      field: 'brandModel',
      title: '品牌型号',
      minWidth: 130,
    },
    {
      field: 'seatCount',
      title: '座位数',
      width: 90,
    },
    {
      field: 'barePrice',
      title: '裸车价格（元）',
      width: 140,
    },
    {
      field: 'compulsoryInsuranceExpireTime',
      title: '交强险到期时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'commercialInsuranceExpireTime',
      title: '商业险到期时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'inspectionExpireTime',
      title: '年检到期时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'sort',
      title: '显示顺序',
      width: 100,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 180,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
