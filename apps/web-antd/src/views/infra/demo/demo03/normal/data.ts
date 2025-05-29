import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { Demo03StudentApi } from '#/api/infra/demo/demo03/normal';

import { useAccess } from '@vben/access';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

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
      label: '名字',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入名字',
      },
    },
    {
      fieldName: 'sex',
      label: '性别',
      rules: 'required',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      fieldName: 'birthday',
      label: '出生日期',
      rules: 'required',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'description',
      label: '简介',
      rules: 'required',
      component: 'RichTextarea',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '名字',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入名字',
      },
    },
    {
      fieldName: 'sex',
      label: '性别',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number'),
        placeholder: '请选择性别',
      },
    },
    {
      fieldName: 'description',
      label: '简介',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入简介',
      },
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
export function useGridColumns(
  onActionClick?: OnActionClickFn<Demo03StudentApi.Demo03Student>,
): VxeTableGridOptions<Demo03StudentApi.Demo03Student>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
    },
    {
      field: 'name',
      title: '名字',
    },
    {
      field: 'sex',
      title: '性别',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_USER_SEX },
      },
    },
    {
      field: 'birthday',
      title: '出生日期',
      formatter: 'formatDateTime',
    },
    {
      field: 'description',
      title: '简介',
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 200,
      align: 'center',
      fixed: 'right',
      showOverflow: false,
      cellRender: {
        attrs: {
          nameField: 'id',
          nameTitle: '学生',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: hasAccessByCodes(['infra:demo03-student:update']),
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['infra:demo03-student:delete']),
          },
        ],
      },
    },
  ];
}

// ==================== 子表（学生课程） ====================

/** 新增/修改列表的字段 */
export function useDemo03CourseGridEditColumns(
  onActionClick?: OnActionClickFn<Demo03StudentApi.Demo03Course>,
): VxeTableGridOptions<Demo03StudentApi.Demo03Course>['columns'] {
  return [
    {
      field: 'name',
      title: '名字',
      slots: { default: 'name' },
    },
    {
      field: 'score',
      title: '分数',
      slots: { default: 'score' },
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 60,
      align: 'center',
      fixed: 'right',
      showOverflow: false,
      cellRender: {
        attrs: {
          nameField: 'id',
          nameTitle: '学生',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'delete',
            show: hasAccessByCodes(['infra:demo03-student:delete']),
          },
        ],
      },
    },
  ];
}

// ==================== 子表（学生班级） ====================

/** 新增/修改的表单 */
export function useDemo03GradeFormSchema(): VbenFormSchema[] {
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
      label: '名字',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入名字',
      },
    },
    {
      fieldName: 'teacher',
      label: '班主任',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入班主任',
      },
    },
  ];
}
