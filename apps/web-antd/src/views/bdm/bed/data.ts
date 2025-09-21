import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BedApi } from '#/api/bdm/bed';

import { getApartmentListByFloorId } from '#/api/bdm/apartment';
import { floorIdField, floorIdFilterField } from '#/views/bdm/apartment/data';
import {
  zoneIdCompositeField,
  zoneIdCompositeFilterField,
} from '#/views/bdm/building/data';
import { buildingIdField, buildingIdFilterField } from '#/views/bdm/floor/data';

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
    buildingIdField,
    floorIdField,
    apartmentIdField,
    {
      fieldName: 'name',
      label: '床位名称',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入床位名称',
      },
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
    buildingIdFilterField,
    floorIdFilterField,
    apartmentIdFilterField,
    {
      fieldName: 'name',
      label: '床位名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入床位名称',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<BedApi.Bed>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '床位编号',
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
      field: 'buildingName',
      title: '所属楼栋',
      minWidth: 120,
    },
    {
      field: 'floorName',
      title: '所属楼层',
      minWidth: 120,
    },
    {
      field: 'apartmentName',
      title: '所属楼层',
      minWidth: 120,
    },
    {
      field: 'name',
      title: '床位名称',
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

export const apartmentIdFilterField = {
  fieldName: 'apartmentId',
  label: '所属房屋',
  component: 'ApiSelect',
  componentProps: {
    options: [],
    fieldNames: { label: 'name', value: 'id' },
    placeholder: '请选择所属房屋',
  },
  dependencies: {
    triggerFields: ['floorId'],
    componentProps: async (values: any) => ({
      options: await getApartmentOptions(values.floorId),
    }),
  },
};

export const apartmentIdField = {
  ...apartmentIdFilterField,
  rules: 'required',
};

async function getApartmentOptions(floorId?: number) {
  return floorId === undefined
    ? Promise.resolve([])
    : getApartmentListByFloorId(floorId);
}
