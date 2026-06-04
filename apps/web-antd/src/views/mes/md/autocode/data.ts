import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdAutoCodePartApi } from '#/api/mes/md/autocode/part';
import type { MesMdAutoCodeRuleApi } from '#/api/mes/md/autocode/rule';

import { CommonStatusEnum, DICT_TYPE, MesAutoCodePartTypeEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';

/** 新增/修改编码规则的表单 */
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
      fieldName: 'code',
      label: '规则编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入规则编码',
      },
      rules: 'required',
    },
    {
      fieldName: 'name',
      label: '规则名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入规则名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'description',
      label: '规则描述',
      component: 'Input',
      componentProps: {
        placeholder: '请输入规则描述',
      },
    },
    {
      fieldName: 'maxLength',
      label: '最大长度',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        max: 100,
        min: 1,
        precision: 0,
      },
      rules: 'required',
    },
    {
      fieldName: 'padded',
      label: '是否补齐',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
      },
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'paddedChar',
      label: '补齐字符',
      component: 'Input',
      componentProps: {
        maxLength: 1,
        placeholder: '请输入补齐字符',
      },
      dependencies: {
        triggerFields: ['padded'],
        show: (values) => values.padded === true,
      },
      rules: 'required',
    },
    {
      fieldName: 'paddedMethod',
      label: '补齐方式',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(
          DICT_TYPE.MES_MD_AUTO_CODE_PADDED_METHOD,
          'number',
        ),
      },
      dependencies: {
        triggerFields: ['padded'],
        show: (values) => values.padded === true,
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
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
      label: '规则编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入规则编码',
      },
    },
    {
      fieldName: 'name',
      label: '规则名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入规则名称',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesMdAutoCodeRuleApi.AutoCodeRule>['columns'] {
  return [
    {
      field: 'code',
      title: '规则编码',
      width: 150,
    },
    {
      field: 'name',
      title: '规则名称',
      width: 200,
    },
    {
      field: 'description',
      title: '规则描述',
      minWidth: 180,
    },
    {
      field: 'maxLength',
      title: '最大长度',
      width: 100,
      align: 'center',
    },
    {
      field: 'padded',
      title: '是否补齐',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 160,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 新增/修改编码规则分段的表单 */
export function usePartFormSchema(): VbenFormSchema[] {
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
      fieldName: 'ruleId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'sort',
      label: '分段排序',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 1,
        precision: 0,
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'length',
      label: '分段长度',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        max: 50,
        min: 1,
        precision: 0,
      },
      rules: 'required',
    },
    {
      fieldName: 'type',
      label: '分段类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_MD_AUTO_CODE_PART_TYPE, 'number'),
        placeholder: '请选择分段类型',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'dateFormat',
      label: '日期格式',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: 'yyyy', value: 'yyyy' },
          { label: 'yyyyMM', value: 'yyyyMM' },
          { label: 'yyyyMMdd', value: 'yyyyMMdd' },
          { label: 'yyyyMMddHH', value: 'yyyyMMddHH' },
          { label: 'yyyyMMddHHmm', value: 'yyyyMMddHHmm' },
        ],
        placeholder: '请选择日期格式',
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === MesAutoCodePartTypeEnum.DATE,
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'fixCharacter',
      label: '固定字符',
      component: 'Input',
      componentProps: {
        placeholder: '请输入固定字符',
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === MesAutoCodePartTypeEnum.FIX,
      },
      rules: 'required',
    },
    {
      fieldName: 'serialStartNo',
      label: '流水号起始值',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 1,
        precision: 0,
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === MesAutoCodePartTypeEnum.SERIAL,
      },
      rules: 'required',
    },
    {
      fieldName: 'serialStep',
      label: '流水号步长',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 1,
        precision: 0,
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === MesAutoCodePartTypeEnum.SERIAL,
      },
      rules: 'required',
    },
    {
      fieldName: 'cycleFlag',
      label: '是否循环',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === MesAutoCodePartTypeEnum.SERIAL,
      },
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'cycleMethod',
      label: '循环方式',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(
          DICT_TYPE.MES_MD_AUTO_CODE_CYCLE_METHOD,
          'number',
        ),
        placeholder: '请选择循环方式',
      },
      dependencies: {
        triggerFields: ['type', 'cycleFlag'],
        show: (values) =>
          values.type === MesAutoCodePartTypeEnum.SERIAL &&
          values.cycleFlag === true,
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}

/** 编码规则分段的字段 */
export function usePartGridColumns(): VxeTableGridOptions<MesMdAutoCodePartApi.AutoCodePart>['columns'] {
  return [
    {
      field: 'sort',
      title: '分段排序',
      width: 90,
      align: 'center',
    },
    {
      field: 'type',
      title: '分段类型',
      width: 120,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_MD_AUTO_CODE_PART_TYPE },
      },
    },
    {
      field: 'length',
      title: '分段长度',
      width: 90,
      align: 'center',
    },
    {
      field: 'dateFormat',
      title: '日期格式',
      width: 150,
      align: 'center',
    },
    {
      field: 'fixCharacter',
      title: '固定字符',
      width: 120,
      align: 'center',
    },
    {
      field: 'serialStartNo',
      title: '流水号起始',
      width: 110,
      align: 'center',
    },
    {
      field: 'serialStep',
      title: '流水号步长',
      width: 110,
      align: 'center',
    },
    {
      field: 'cycleFlag',
      title: '是否循环',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'cycleMethod',
      title: '循环方式',
      width: 120,
      align: 'center',
      slots: { default: 'cycleMethod' },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 160,
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
