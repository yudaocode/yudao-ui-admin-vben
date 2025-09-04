import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ResidentApi } from '#/api/bdm/resident';

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
      fieldName: 'userId',
      label: '用户编号',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户编号',
      },
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
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<ResidentApi.Resident>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '住户编号',
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
      title: '房屋名称',
      minWidth: 120,
    },
    {
      field: 'userName',
      title: '用户姓名',
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

async function getApartmentOptions(buildingId?: number) {
  return buildingId === undefined
    ? Promise.resolve([])
    : getApartmentListByFloorId(buildingId);
}
