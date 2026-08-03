import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeApi } from '#/api/hrm/employee';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { DictTag } from '#/components/dict-tag';

/** 详情页头部字段 */
export function useHeaderSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'parentDeptName',
      label: '上级部门',
    },
    {
      field: 'leaderUserName',
      label: '部门负责人',
    },
    {
      field: 'activeCount',
      label: '在职员工',
    },
    {
      field: 'fullTimeCount',
      label: '全职员工',
    },
    {
      field: 'nonFullTimeCount',
      label: '非全职人数',
    },
  ];
}

/** 详细资料字段 */
export function useInfoSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'name',
      label: '部门名称',
    },
    {
      field: 'parentDeptName',
      label: '上级部门',
    },
    {
      field: 'leaderUserName',
      label: '部门负责人',
    },
    {
      field: 'sort',
      label: '显示排序',
    },
    {
      field: 'phone',
      label: '联系电话',
    },
    {
      field: 'email',
      label: '邮箱',
    },
    {
      field: 'status',
      label: '状态',
      render: (val) =>
        h(DictTag, { type: DICT_TYPE.COMMON_STATUS, value: val }),
    },
    {
      field: 'createTime',
      label: '创建时间',
      render: (val) => (val ? (formatDateTime(val) as string) : '-'),
    },
  ];
}

/** 员工列表搜索表单 */
export function useEmployeeGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'search',
      label: '员工搜索',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入员工姓名、工号或手机号',
      },
    },
  ];
}

/** 员工列表列 */
export function useEmployeeGridColumns(): VxeTableGridOptions<HrmEmployeeApi.Employee>['columns'] {
  return [
    {
      field: 'name',
      title: '员工姓名',
      minWidth: 120,
      align: 'center',
      slots: { default: 'name' },
    },
    {
      field: 'jobNumber',
      title: '工号',
      minWidth: 120,
      align: 'center',
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'deptName',
      title: '部门',
      minWidth: 140,
      align: 'center',
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'postName',
      title: '岗位',
      minWidth: 140,
      align: 'center',
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'type',
      title: '聘用形式',
      width: 110,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_EMPLOYEE_TYPE },
      },
    },
    {
      field: 'entryTime',
      title: '入职时间',
      width: 180,
      align: 'center',
      formatter: 'formatDateTime',
    },
  ];
}
