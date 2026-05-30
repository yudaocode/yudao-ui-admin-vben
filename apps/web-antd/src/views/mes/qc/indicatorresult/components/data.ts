import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcIndicatorResultApi } from '#/api/mes/qc/indicatorresult';

import { h } from 'vue';

import { MesAutoCodeRuleCode } from '@vben/constants';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';

/** 表单类型 */
export type FormType = 'create' | 'update';

/** 新增/修改检测结果的表单 */
export function useQcIndicatorResultFormSchema(
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
      label: '样品编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入样品编号',
      },
      rules: 'required',
      suffix: () =>
        h(
          Button,
          {
            type: 'default',
            onClick: async () => {
              const code = await generateAutoCode(
                MesAutoCodeRuleCode.QC_INDICATOR_RESULT_CODE,
              );
              await formApi?.setFieldValue('code', code);
            },
          },
          { default: () => '生成' },
        ),
    },
    {
      fieldName: 'sn',
      label: '物资 SN',
      component: 'Input',
      componentProps: {
        placeholder: '请输入物资 SN',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入备注',
        rows: 2,
      },
    },
  ];
}

/** 检测结果列表的字段 */
export function useQcIndicatorResultGridColumns(): VxeTableGridOptions<MesQcIndicatorResultApi.IndicatorResult>['columns'] {
  return [
    {
      field: 'code',
      title: '样品编号',
      width: 200,
    },
    {
      field: 'sn',
      title: '物资SN',
      minWidth: 200,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 200,
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
