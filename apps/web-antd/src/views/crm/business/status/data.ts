import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CrmBusinessStatusApi } from '#/api/crm/business/status';

import { useAccess } from '@vben/access';

import { z } from '#/adapter/form';
import {
  CommonStatusEnum,
  DICT_TYPE,
  getDictOptions,
  getRangePickerDefaultProps,
} from '#/utils';

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
      label: '状态组名',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'deptIds',
      label: '应用部门',
      component: 'TreeSelect',
      componentProps: {
        multiple: true,
        treeCheckable: true,
        showCheckedStrategy: 'SHOW_PARENT',
        placeholder: '请选择应用部门',
      },
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
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '状态组名',
      component: 'Input',
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = CrmBusinessStatusApi.BusinessStatus>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '状态组名',
      minWidth: 200,
    },
    {
      field: 'deptNames',
      title: '应用部门',
      minWidth: 200,
      formatter: ({ cellValue }) => {
        return cellValue?.length > 0 ? cellValue.join(' ') : '全公司';
      },
    },
    {
      field: 'creator',
      title: '创建人',
      minWidth: 100,
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
      width: 160,
      fixed: 'right',
      align: 'center',
      cellRender: {
        name: 'TableAction',
        props: {
          actions: [
            {
              label: '编辑',
              code: 'edit',
              show: hasAccessByCodes(['crm:business-status:update']),
            },
            {
              label: '删除',
              code: 'delete',
              show: hasAccessByCodes(['crm:business-status:delete']),
            },
          ],
          onActionClick,
        },
      },
    },
  ];
}
