import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BuildingApi } from '#/api/bdm/building';

import { getZonePage } from '#/api/bdm/zone';
import { areaIdField, areaIdFilterField } from '#/views/bdm/zone/data';

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
    ...zoneIdCompositeField,
    {
      fieldName: 'name',
      label: '楼栋名称',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入楼栋名称',
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
        placeholder: '请输入显示顺序',
      },
      defaultValue: 0,
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    ...zoneIdCompositeFilterField,
    {
      fieldName: 'name',
      label: '楼栋名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入楼栋名称',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<BuildingApi.Building>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '楼栋编号',
      minWidth: 120,
    },
    {
      field: 'areaName',
      title: '所属地区',
      minWidth: 120,
    },
    {
      field: 'zoneName',
      title: '所属区域',
      minWidth: 120,
    },
    {
      field: 'name',
      title: '楼栋名称',
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

const zoneIdFilterField = {
  fieldName: 'zoneId',
  label: '所属区域',
  component: 'ApiSelect',
  componentProps: {
    showSearch: true,
    filterOption: (input: string, option: any) =>
      option.value.toLowerCase().includes(input.toLowerCase()),
    placeholder: '请选择所属区域',
  },
  dependencies: {
    triggerFields: ['areaId'],
    componentProps: async (values: any) => ({
      options: await getZoneOptions(values),
    }),
  },
};

export const zoneIdCompositeFilterField = [
  areaIdFilterField,
  zoneIdFilterField,
];

const zoneIdField = { ...zoneIdFilterField, rules: 'required' };

export const zoneIdCompositeField = [areaIdField, zoneIdField];

function getZoneOptions(values: any) {
  return values.areaId === undefined
    ? []
    : getZonePage({ areaId: values.areaId, pageNo: 1, pageSize: 100 }).then(
        (res) => {
          return res.list.map((item) => ({
            label: item.abbreviation,
            value: item.id,
          }));
        },
      );
}
