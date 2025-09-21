import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { z } from '#/adapter/form';
import { getBedListByApartmentId } from '#/api/bdm/bed';
import { CommonStatusEnum, DICT_TYPE, getDictOptions } from '#/utils';
import { floorIdField } from '#/views/bdm/apartment/data';
import { apartmentIdField } from '#/views/bdm/bed/data';
import { zoneIdCompositeField } from '#/views/bdm/building/data';
import { buildingIdField } from '#/views/bdm/floor/data';

/** 修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'ImageUpload',
      fieldName: 'avatar',
      label: '头像',
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: '姓名',
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: '昵称',
    },
    {
      component: 'Input',
      fieldName: 'mobile',
      label: '手机',
      rules: 'required',
    },
    {
      fieldName: 'sex',
      label: '性别',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'birthday',
      label: '出生日期',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'x',
      },
    },
    ...zoneIdCompositeField,
    buildingIdField,
    floorIdField,
    apartmentIdField,
    bedIdField,
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE).optional(),
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '姓名',
      component: 'Input',
    },
    {
      fieldName: 'mobile',
      label: '手机',
      component: 'Input',
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'checkbox',
      width: 50,
    },
    {
      field: 'id',
      title: '住户编号',
      width: 80,
    },
    {
      field: 'name',
      title: '姓名',
      width: 100,
    },
    {
      field: 'mobile',
      title: '手机',
      width: 120,
    },
    {
      title: '住所',
      slots: {
        default: ({ row }) =>
          row.areaName +
          row.zoneName +
          row.buildingName +
          row.floorName +
          row.apartmentName,
      },
    },
    {
      field: 'status',
      title: '状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
      width: 60,
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

export const bedIdFilterField = {
  fieldName: 'bedId',
  label: '所属床位',
  component: 'ApiSelect',
  componentProps: {
    options: [],
    fieldNames: { label: 'name', value: 'id' },
    placeholder: '请选择所属床位',
  },
  dependencies: {
    triggerFields: ['apartmentId'],
    componentProps: async (values: any) => ({
      options: await getBedOptions(values.apartmentId),
    }),
  },
};

export const bedIdField = {
  ...bedIdFilterField,
};

async function getBedOptions(apartmentId?: number) {
  return apartmentId === undefined
    ? Promise.resolve([])
    : getBedListByApartmentId(apartmentId);
}
