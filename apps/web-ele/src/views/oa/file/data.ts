import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaFileNodeApi } from '#/api/oa/file/node';
import type { OaFilePermissionApi } from '#/api/oa/file/permission';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';
import { formatFileSize } from '@vben/utils';

import { z } from '#/adapter/form';
import { getRangePickerDefaultProps } from '#/utils';
import {
  OA_FILE_CATEGORY,
  OA_FILE_NODE_TYPE,
  OA_FILE_PERMISSION_LEVEL,
  OA_FILE_SUBJECT_TYPE,
} from '#/views/oa/utils/constants';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入名称',
      },
    },
    {
      fieldName: 'category',
      label: '类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_FILE_CATEGORY, 'number').filter(
          (item) => item.value !== OA_FILE_CATEGORY.ALL,
        ),
        clearable: true,
        placeholder: '请选择类型',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '名称',
      minWidth: 240,
      slots: { default: 'name' },
    },
    {
      field: 'size',
      title: '大小',
      width: 110,
      formatter: ({ row }) =>
        row.type === OA_FILE_NODE_TYPE.FILE ? formatFileSize(row.size || 0) : '',
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 新建文件夹、重命名、移动、复制的表单 */
export function useNodeFormSchema(
  getDirectoryTree: () => OaFileNodeApi.FileNode[],
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
      fieldName: 'formType',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '名称',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        showWordLimit: true,
        placeholder: '请输入名称',
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['formType'],
        if: (values) =>
          values.formType === 'create' || values.formType === 'rename',
      },
    },
    {
      fieldName: 'parentId',
      label: '目标目录',
      component: 'TreeSelect',
      componentProps: () => ({
        clearable: true,
        class: '!w-full',
        data: getDirectoryTree(),
        props: {
          label: 'name',
          value: 'id',
        },
        checkStrictly: true,
        defaultExpandAll: true,
        filterable: true,
        placeholder: '请选择目标目录',
      }),
      rules: 'required',
      dependencies: {
        triggerFields: ['formType'],
        if: (values) =>
          values.formType === 'move' || values.formType === 'copy',
      },
    },
  ];
}

/** 共享权限列表的列配置 */
export function usePermissionGridColumns(
  getSubjectName: (row: OaFilePermissionApi.FilePermission) => string,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'subjectType',
      title: '类型',
      width: 80,
      formatter: ({ cellValue }) =>
        getDictLabel(DICT_TYPE.OA_FILE_SUBJECT_TYPE, cellValue),
    },
    {
      field: 'subjectId',
      title: '共享对象',
      minWidth: 140,
      formatter: ({ row }) => getSubjectName(row),
    },
    {
      field: 'level',
      title: '权限',
      width: 90,
      formatter: ({ cellValue }) =>
        getDictLabel(DICT_TYPE.OA_FILE_PERMISSION_LEVEL, cellValue),
    },
    {
      field: 'inherit',
      title: '继承',
      width: 70,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'expireTime',
      title: '到期时间',
      width: 165,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 150,
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}

/** 新增、修改共享的表单 */
export function usePermissionFormSchema(options: {
  onSubjectTypeChange: (value: number) => void;
}): VbenFormSchema[] {
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
      fieldName: 'nodeId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'subjectType',
      label: '共享类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_FILE_SUBJECT_TYPE, 'number'),
        placeholder: '请选择共享类型',
        onChange: options.onSubjectTypeChange,
      },
      rules: z.number().default(OA_FILE_SUBJECT_TYPE.USER),
      dependencies: {
        triggerFields: ['id'],
        disabled: (values) => !!values.id,
      },
    },
    {
      fieldName: 'subjectId',
      label: '共享对象',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'level',
      label: '权限',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_FILE_PERMISSION_LEVEL, 'number'),
        placeholder: '请选择权限',
      },
      rules: z.number().default(OA_FILE_PERMISSION_LEVEL.READ),
      help: '查看权限仅可查看文件信息，预览和下载需选择更高权限；管理权限可改名、编辑和管理共享，删除、移动仍由文件所有者操作。',
    },
    {
      fieldName: 'inherit',
      label: '继承权限',
      component: 'Switch',
      rules: z.boolean().default(true),
      help: '开启后对子项生效，关闭后子项需单独授权。',
    },
    {
      fieldName: 'expireTime',
      label: '到期时间',
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        class: '!w-full',
        type: 'datetime',
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '不填则长期有效',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
      formItemClass: 'col-span-2',
    },
  ];
}
