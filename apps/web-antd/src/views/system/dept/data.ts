import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';

import { $t } from '#/locales';
import { z } from '#/adapter/form';
import { getDeptList } from '#/api/system/dept';
import { getSimpleUserList } from '#/api/system/user';
import { DICT_TYPE, getDictOptions } from '#/utils/dict';
import { CommonStatusEnum } from '#/utils/constants';
import { handleTree } from '#/utils/tree';

/** 获取编辑表单的字段配置 */
export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: async () => {
          const data = await getDeptList();
          data.unshift({
            id: 0,
            name: '顶级部门',
          });
          return handleTree(data);
        },
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择上级部门',
        treeDefaultExpandAll: true,
      },
      fieldName: 'parentId',
      label: '上级部门',
      // TODO @芋艿：number 的必填，写起来有点麻烦，后续得研究下；
      rules: z
        .number()
        .nullable()
        .refine((val) => val != null && val >= 0, '上级部门不能为空')
        .default(null),
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入部门名称',
      },
      fieldName: 'name',
      label: '部门名称',
      rules: z
        .string()
        .min(2, $t('ui.formRules.minLength', ['部门名称', 2]))
        .max(20, $t('ui.formRules.maxLength', ['部门名称', 20])),
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        class: 'w-full',
        controlsPosition: 'right',
        placeholder: '请输入显示排序',
      },
      fieldName: 'sort',
      label: '显示排序',
      rules: z
        .number()
        .nullable()
        .refine((val) => val != null && val >= 0, '显示排序不能为空')
        .default(null),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        class: 'w-full',
        labelField: 'nickname',
        valueField: 'id',
        placeholder: '请选择负责人',
        allowClear: true,
      },
      fieldName: 'leaderUserId',
      label: '负责人',
      rules: z.number().optional(),
    },
    {
      component: 'Input',
      componentProps: {
        maxLength: 11,
        placeholder: '请输入联系电话',
      },
      fieldName: 'phone',
      label: '联系电话',
      rules: z
        .string()
        // TODO @芋艿：未来怎么拓展一个手机的
        .regex(/^1[3|4|5|6|7|8|9][0-9]\d{8}$/, '请输入正确的手机号码')
        .optional(),
    },
    {
      component: 'Input',
      componentProps: {
        maxLength: 50,
        placeholder: '请输入邮箱',
      },
      fieldName: 'email',
      label: '邮箱',
      rules: z
        .string()
        .email('请输入正确的邮箱地址')
        .max(50, $t('ui.formRules.maxLength', ['邮箱', 50]))
        .optional(),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      fieldName: 'status',
      label: '状态',
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
  ];
}

/** 获取表格列配置 */
const userList = await getSimpleUserList();
export function useColumns(
  onActionClick?: OnActionClickFn<SystemDeptApi.SystemDept>,
): VxeTableGridOptions<SystemDeptApi.SystemDept>['columns'] {
  return [
    {
      align: 'left',
      field: 'name',
      fixed: 'left',
      title: '部门名称',
      treeNode: true,
      minWidth: 150,
    },
    {
      field: 'leaderUserId',
      title: '负责人',
      minWidth: 150,
      formatter: (row) => {
        return (
          userList.find((user) => user.id === row.cellValue)?.nickname || '-'
        );
      },
    },
    {
      field: 'sort',
      title: '排序',
      minWidth: 100,
    },
    {
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
      field: 'status',
      title: '状态',
      minWidth: 100,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '部门',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'append',
            text: '新增下级',
          },
          'edit', // 默认的编辑按钮
          {
            code: 'delete', // 默认的删除按钮
            disabled: (row: SystemDeptApi.SystemDept) => {
              return !!(row.children && row.children.length > 0);
            },
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: '操作',
      minWidth: 200,
    },
  ];
}
