import type { VbenFormSchema } from '#/adapter/form';

import { h } from 'vue';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button, message } from 'ant-design-vue';

import { z } from '#/adapter/form';

/** 表单 */
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
      fieldName: 'format',
      label: '条码格式',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MES_WM_BARCODE_FORMAT, 'number'),
        placeholder: '请选择条码格式',
      },
      rules: 'required',
    },
    {
      fieldName: 'bizType',
      label: '业务类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE, 'number'),
        placeholder: '请选择业务类型',
      },
      dependencies: {
        triggerFields: ['id'],
        componentProps: (values) => ({
          disabled: !!values.id, // 编辑时业务类型不允许变更
        }),
      },
      rules: 'required',
    },
    {
      fieldName: 'contentFormat',
      label: '内容格式模板',
      component: 'Input',
      componentProps: {
        placeholder: '支持{BUSINESSCODE}占位符，如：WH-{BUSINESSCODE}',
      },
      rules: 'required',
    },
    {
      fieldName: 'contentExample',
      label: '内容样例',
      component: 'Input',
      componentProps: {
        placeholder: '如：WH-WH001',
      },
    },
    {
      fieldName: 'autoGenerateFlag',
      label: '自动生成',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      rules: z.boolean().default(true),
    },
    {
      fieldName: 'defaultTemplate',
      label: '默认打印模板',
      component: 'Input',
      componentProps: {
        placeholder: '请选择打印模板',
        readonly: true,
      },
      // TODO @芋艿：后续对接 UReport 报表选择器，实现打印模板选择功能
      suffix: () =>
        h(
          Button,
          {
            onClick: () => message.warning('打印模板选择功能暂未实现，敬请期待'),
          },
          { default: () => '设置' },
        ),
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
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
        rows: 2,
      },
    },
  ];
}
