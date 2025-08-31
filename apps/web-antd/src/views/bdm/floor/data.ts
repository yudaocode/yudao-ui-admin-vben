import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FloorApi } from '#/api/bdm/floor';

import { getBuildingListByZoneId } from '#/api/bdm/building';
import {
  zoneIdCompositeField,
  zoneIdCompositeFilterField,
} from '#/views/bdm/building/data';

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
    {
      fieldName: 'name',
      label: '楼层名称',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入楼层名称',
      },
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
    ...zoneIdCompositeFilterField,
    buildingIdFilterField,
    {
      fieldName: 'name',
      label: '楼层名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入楼层名称',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<FloorApi.Floor>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '楼层编号',
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
      field: 'name',
      title: '楼层名称',
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

export const buildingIdFilterField = {
  fieldName: 'buildingId',
  label: '所属楼栋',
  component: 'ApiSelect',
  componentProps: {
    options: [],
    fieldNames: { label: 'name', value: 'id' },
    placeholder: '请选择所属楼栋',
  },
  dependencies: {
    triggerFields: ['zoneId'],
    componentProps: async (values: any) => ({
      options: await getBuildingOptions(values.zoneId),
    }),
  },
};

export const buildingIdField = { ...buildingIdFilterField, rules: 'required' };

function getBuildingOptions(zoneId: number) {
  return zoneId === undefined
    ? Promise.resolve([])
    : getBuildingListByZoneId(zoneId);
}
