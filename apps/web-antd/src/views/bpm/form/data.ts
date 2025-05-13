import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BpmFormApi } from '#/api/bpm/form';

import { useAccess } from '@vben/access';
import { $t } from '@vben/locales';

import { z } from '#/adapter/form';
import { CommonStatusEnum, DICT_TYPE, getDictOptions } from '#/utils';

const { hasAccessByCodes } = useAccess();

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
    {
      fieldName: 'name',
      label: '表单名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入表单名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '表单名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入表单名称',
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = BpmFormApi.FormVO>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      minWidth: 100,
    },
    {
      field: 'name',
      title: '表单名称',
      minWidth: 200,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 200,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },

    {
      field: 'remark',
      title: '备注',
      minWidth: 200,
    },

    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },

    {
      field: 'operation',
      title: '操作',
      minWidth: 150,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '流程名称',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'copy',
            text: $t('ui.actionTitle.copy'),
            show: hasAccessByCodes(['bpm:form:update']),
          },
          {
            code: 'edit',
            text: $t('ui.actionTitle.edit'),
            show: hasAccessByCodes(['bpm:form:update']),
          },
          {
            code: 'detail',
            text: $t('ui.actionTitle.detail'),
            show: hasAccessByCodes(['bpm:form:query']),
          },
          {
            code: 'delete',
            text: $t('ui.actionTitle.delete'),
            show: hasAccessByCodes(['bpm:form:delete']),
          },
        ],
      },
    },
  ];
}
