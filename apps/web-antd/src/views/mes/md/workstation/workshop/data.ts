import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdWorkshopApi } from '#/api/mes/md/workstation/workshop';

import { h } from 'vue';

import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getSimpleUserList } from '#/api/system/user';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改车间的表单 */
export function useFormSchema(
  formType: FormType,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
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
      label: '车间编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入车间编码',
      },
      dependencies: {
        triggerFields: ['id'],
        componentProps: (values) => ({
          disabled: !!values.id,
        }),
      },
      rules: 'required',
      suffix:
        formType === 'detail'
          ? undefined
          : () =>
              h(
                Button,
                {
                  type: 'default',
                  onClick: async () => {
                    const code = await generateAutoCode(
                      MesAutoCodeRuleCode.MD_WORKSHOP_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '车间名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入车间名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'area',
      label: '面积',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        precision: 2,
      },
    },
    {
      fieldName: 'chargeUserId',
      label: '负责人',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择负责人',
        valueField: 'id',
      },
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
      formItemClass: 'col-span-2',
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
      label: '车间编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入车间编码',
      },
    },
    {
      fieldName: 'name',
      label: '车间名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入车间名称',
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
export function useGridColumns(): VxeTableGridOptions<MesMdWorkshopApi.Workshop>['columns'] {
  return [
    {
      field: 'code',
      title: '车间编码',
      minWidth: 150,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '车间名称',
      minWidth: 150,
    },
    {
      field: 'area',
      title: '面积',
      width: 120,
    },
    {
      field: 'chargeUserName',
      title: '负责人',
      width: 140,
    },
    {
      field: 'status',
      title: '状态',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 180,
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
