import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ZoneApi } from '#/api/bdm/zone';

import { getAreaTree } from '#/api/system/area';

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
      fieldName: 'name',
      label: '区域名称',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入区域名称',
      },
    },
    {
      fieldName: 'abbreviation',
      label: '区域简称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入区域简称',
      },
    },
    {
      fieldName: 'areaId',
      label: '所属地区',
      rules: 'required',
      component: 'ApiTreeSelect',
      componentProps: {
        api: () => getAreaTree(),
        fieldNames: { label: 'name', value: 'id', children: 'children' },
      },
    },
    {
      fieldName: 'address',
      label: '详细地址',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入详细地址',
      },
    },
    {
      fieldName: 'coverImage',
      label: '封面图片',
      rules: 'required',
      component: 'ImageUpload',
    },
    {
      fieldName: 'carouselImages',
      label: '轮播图片',
      rules: 'required',
      component: 'ImageUpload',
      componentProps: {
        maxNumber: 9,
      },
    },
    {
      fieldName: 'longitude',
      label: '经度',
      rules: 'required',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        controlsPosition: 'right',
        placeholder: '请输入经度',
      },
      defaultValue: 0,
    },
    {
      fieldName: 'latitude',
      label: '纬度',
      rules: 'required',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        controlsPosition: 'right',
        placeholder: '请输入纬度',
      },
      defaultValue: 0,
    },
    {
      fieldName: 'sort',
      label: '显示顺序',
      rules: 'required',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        controlsPosition: 'right',
        placeholder: '请输入显示顺序',
      },
      defaultValue: 0,
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'areaId',
      label: '所属地区',
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: () => getAreaTree(),
        fieldNames: { label: 'name', value: 'id', children: 'children' },
        placeholder: '请选择所属地区',
      },
    },
    {
      fieldName: 'name',
      label: '区域名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入区域名称',
      },
    },
    {
      fieldName: 'abbreviation',
      label: '区域简称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入区域简称',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<ZoneApi.Zone>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '区域编号',
      minWidth: 120,
    },
    {
      field: 'coverImage',
      title: '封面图片',
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'areaName',
      title: '所属地区',
      minWidth: 120,
    },
    {
      field: 'name',
      title: '区域名称',
      minWidth: 120,
    },
    {
      field: 'abbreviation',
      title: '区域简称',
      minWidth: 120,
    },
    {
      field: 'address',
      title: '详细地址',
      minWidth: 120,
    },
    {
      field: 'sort',
      title: '显示顺序',
      minWidth: 120,
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

export const areaIdFilterField = {
  fieldName: 'areaId',
  label: '所属地区',
  component: 'ApiTreeSelect',
  componentProps: {
    allowClear: true,
    api: () => getAreaTree(),
    fieldNames: { label: 'name', value: 'id', children: 'children' },
    showSearch: true,
    filterTreeNode: (input: string, treeNode: any) =>
      treeNode.name.toLowerCase().includes(input.toLowerCase()),
    placeholder: '请选择所属地区',
  },
};

export const areaIdField = { ...areaIdFilterField, rules: 'required' };
