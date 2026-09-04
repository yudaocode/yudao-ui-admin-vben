import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { HrmEmployeeIdTypeOptions } from '#/views/hrm/utils/constants';

/** 员工可编辑档案表单 */
export function useEmployeeFormSchema(
  editableFields: Set<string>,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '姓名',
      component: 'Input',
      rules: 'required',
      componentProps: { maxlength: 255, placeholder: '请输入姓名' },
    },
    {
      fieldName: 'mobile',
      label: '手机号',
      component: 'Input',
      rules: z
        .string()
        .regex(/^1[3-9]\d{9}$/, '请输入正确的手机号码')
        .optional()
        .or(z.literal('')),
      componentProps: { maxlength: 11, placeholder: '请输入手机号' },
    },
    {
      fieldName: 'email',
      label: '邮箱',
      component: 'Input',
      rules: z
        .string()
        .email('请输入正确的邮箱地址')
        .optional()
        .or(z.literal('')),
      componentProps: { maxlength: 255, placeholder: '请输入邮箱' },
    },
    {
      fieldName: 'country',
      label: '国家或地区',
      component: 'Input',
      componentProps: { maxlength: 64, placeholder: '请输入国家或地区' },
    },
    {
      fieldName: 'nation',
      label: '民族',
      component: 'Input',
      componentProps: { maxlength: 64, placeholder: '请输入民族' },
    },
    {
      fieldName: 'idType',
      label: '证件类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [...HrmEmployeeIdTypeOptions],
        placeholder: '请选择证件类型',
      },
    },
    {
      fieldName: 'idNumber',
      label: '证件号码',
      component: 'Input',
      componentProps: { maxlength: 255, placeholder: '请输入证件号码' },
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
      fieldName: 'nativePlace',
      label: '籍贯',
      component: 'Input',
      componentProps: { maxlength: 128, placeholder: '请输入籍贯' },
    },
    {
      fieldName: 'birthday',
      label: '出生时间',
      component: 'DatePicker',
      componentProps: {
        class: 'w-full',
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择出生时间',
        showTime: true,
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'highestEducation',
      label: '最高学历',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.HRM_EMPLOYEE_EDUCATION, 'number'),
        placeholder: '请选择最高学历',
      },
    },
    {
      fieldName: 'address',
      label: '户籍地址',
      component: 'Input',
      formItemClass: 'col-span-2',
      componentProps: { maxlength: 255, placeholder: '请输入户籍地址' },
    },
  ].filter((field) => editableFields.has(field.fieldName));
}

/** 教育经历列表 */
export function useEducationGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'education',
      title: '学历',
      width: 110,
      slots: { default: 'education' },
    },
    { field: 'graduateSchool', minWidth: 180, title: '毕业院校' },
    { field: 'major', minWidth: 150, title: '专业' },
    {
      field: 'admissionTime',
      title: '入学日期',
      width: 120,
      slots: { default: 'admissionTime' },
    },
    {
      field: 'graduationTime',
      title: '毕业日期',
      width: 120,
      slots: { default: 'graduationTime' },
    },
  ];
}

/** 工作经历列表 */
export function useWorkGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'workUnit', minWidth: 180, title: '工作单位' },
    { field: 'postName', minWidth: 150, title: '职务' },
    {
      field: 'startTime',
      title: '开始日期',
      width: 120,
      slots: { default: 'startTime' },
    },
    {
      field: 'endTime',
      title: '结束日期',
      width: 120,
      slots: { default: 'endTime' },
    },
    { field: 'reason', minWidth: 200, title: '离职原因' },
  ];
}

/** 证书列表 */
export function useCertificateGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'name', minWidth: 180, title: '证书名称' },
    { field: 'level', title: '级别', width: 110 },
    { field: 'no', minWidth: 160, title: '证书编号' },
    { field: 'issuingAuthority', minWidth: 180, title: '发证机构' },
    {
      field: 'issuingTime',
      title: '发证日期',
      width: 120,
      slots: { default: 'issuingTime' },
    },
  ];
}

/** 培训经历列表 */
export function useTrainingGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'course', minWidth: 180, title: '培训课程' },
    { field: 'organizationName', minWidth: 180, title: '培训机构' },
    {
      field: 'trainingTime',
      minWidth: 230,
      title: '培训时间',
      slots: { default: 'trainingTime' },
    },
    { field: 'result', title: '培训成绩', width: 110 },
    { field: 'certificateName', minWidth: 180, title: '培训证书' },
  ];
}

/** 联系人列表 */
export function useContactGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'name', title: '联系人', width: 120 },
    { field: 'relation', title: '关系', width: 100 },
    { field: 'phone', title: '联系电话', width: 140 },
    { field: 'workUnit', minWidth: 180, title: '工作单位' },
    { field: 'address', minWidth: 220, title: '联系地址' },
  ];
}
