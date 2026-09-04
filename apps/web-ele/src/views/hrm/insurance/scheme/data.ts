import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { z } from '#/adapter/form';
import { AreaCascader } from '#/components/area';
import { HrmInsuranceSchemeType } from '#/views/hrm/utils/constants';
import { formatHrmMoney } from '#/views/hrm/utils/format';

/** 参保方案基础信息表单 */
export function useInsuranceBaseFormSchema(
  insuranceTypeList: any[] = [],
): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { maxlength: 64, placeholder: '请输入方案名称' },
      fieldName: 'name',
      label: '方案名称',
      rules: z.string().min(1, '方案名称不能为空'),
    },
    {
      component: markRaw(AreaCascader),
      componentProps: {
        clearable: true,
        changeOnSelect: true,
        placeholder: '请选择参保城市',
        selectableLevels: [2, 3],
      },
      fieldName: 'areaId',
      label: '参保城市',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: insuranceTypeList,
        placeholder: '请选择参保方案',
      },
      fieldName: 'householdType',
      label: '可选参保方案',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: [
          {
            label: '设置参保基数和比例',
            value: HrmInsuranceSchemeType.PROPORTION,
          },
          {
            label: '仅设置参保金额',
            value: HrmInsuranceSchemeType.AMOUNT,
          },
        ],
      },
      fieldName: 'type',
      formItemClass: 'col-span-3',
      label: '方案类型',
      rules: 'required',
    },
  ];
}

export function useGridColumns(): VxeGridProps['columns'] {
  return [
    { field: 'name', title: '方案名称', minWidth: 180 },
    { field: 'areaName', title: '参保城市', minWidth: 180 },
    {
      field: 'personalInsuranceAmount',
      title: '个人社保',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'corporateInsuranceAmount',
      title: '公司社保',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'personalProvidentFundAmount',
      title: '个人公积金',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'corporateProvidentFundAmount',
      title: '公司公积金',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    { field: 'useCount', title: '使用人数', width: 100, align: 'center' },
    {
      field: 'monthRecordCount',
      title: '历史月记录',
      width: 110,
      align: 'center',
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
