import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmRecruitPostApi } from '#/api/hrm/recruit/post';
import type { DescriptionItemSchema } from '#/components/description';

import { h, markRaw } from 'vue';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate, handleTree } from '@vben/utils';

import { getRecruitPostTypeList } from '#/api/hrm/recruit/post/type';
import { getSimpleDeptList } from '#/api/system/dept';
import { AreaCascader } from '#/components/area';
import { DictTag } from '#/components/dict-tag';
import EmployeeSelect from '#/views/hrm/employee/components/employee-select.vue';
import {
  AGE_UNLIMITED_VALUE,
  HrmEmployeeEntryStatus,
  HrmRecruitEmergencyLevel,
  HrmRecruitJobNature,
  HrmRecruitPostEducation,
  HrmRecruitPostStatus,
  HrmRecruitSalaryUnit,
  HrmRecruitWorkTime,
  SALARY_NEGOTIABLE_UNIT_VALUE,
  SALARY_NEGOTIABLE_VALUE,
} from '#/views/hrm/utils/constants';
import {
  formatRecruitPostAge,
  formatRecruitPostProgress,
  formatRecruitPostSalary,
  formatRecruitPostSchedule,
} from '#/views/hrm/utils/format';

import AgeRangeField from './modules/age-range-field.vue';
import SalaryRangeField from './modules/salary-range-field.vue';

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'postName',
      label: '职位名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入职位名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'jobNature',
      label: '工作性质',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.HRM_RECRUIT_JOB_NATURE, 'number'),
        placeholder: '请选择工作性质',
        allowClear: true,
      },
    },
    {
      fieldName: 'areaId',
      label: '工作城市',
      component: markRaw(AreaCascader),
      componentProps: {
        placeholder: '请选择工作城市',
        allowClear: true,
        showSearch: true,
      },
    },
    {
      fieldName: 'deptId',
      label: '用人部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择用人部门',
        allowClear: true,
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'ownerEmployeeId',
      label: '招聘负责人',
      component: markRaw(EmployeeSelect),
      componentProps: {
        placeholder: '请选择招聘负责人',
        entryStatus: HrmEmployeeEntryStatus.ACTIVE,
        allowClear: true,
      },
    },
  ];
}

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<HrmRecruitPostApi.RecruitPost>['columns'] {
  return [
    {
      field: 'postName',
      title: '职位名称',
      minWidth: 180,
      fixed: 'left',
      slots: { default: 'postName' },
    },
    { field: 'deptName', title: '用人部门', minWidth: 120 },
    {
      field: 'jobNature',
      title: '工作性质',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_RECRUIT_JOB_NATURE },
      },
    },
    {
      field: 'areaName',
      title: '工作城市',
      minWidth: 160,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    { field: 'recruitNum', title: '招聘人数', width: 100 },
    {
      field: 'hasEntryNum',
      title: '已入职人数',
      width: 110,
      formatter: ({ cellValue }) => cellValue ?? 0,
    },
    {
      field: 'recruitSchedule',
      title: '招聘进度',
      width: 100,
      formatter: ({ row }) => formatRecruitPostSchedule(row),
    },
    {
      field: 'workTime',
      title: '工作经验',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_RECRUIT_WORK_TIME },
      },
    },
    {
      field: 'educationRequire',
      title: '学历要求',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_RECRUIT_POST_EDUCATION },
      },
    },
    {
      field: 'minSalary',
      title: '薪资范围',
      minWidth: 160,
      formatter: ({ row }) => formatRecruitPostSalary(row),
    },
    {
      field: 'minAge',
      title: '年龄要求',
      width: 110,
      formatter: ({ row }) => formatRecruitPostAge(row),
    },
    {
      field: 'emergencyLevel',
      title: '紧急程度',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_RECRUIT_EMERGENCY_LEVEL },
      },
    },
    {
      field: 'latestEntryTime',
      title: '最迟到岗时间',
      width: 120,
      formatter: ({ cellValue }) =>
        cellValue ? (formatDate(cellValue) as string) : '-',
    },
    { field: 'ownerEmployeeName', title: '招聘负责人', minWidth: 120 },
    { field: 'postTypeName', title: '职位类型', minWidth: 120 },
    {
      field: 'interviewEmployeeNames',
      title: '面试官',
      minWidth: 160,
      formatter: ({ cellValue }) =>
        Array.isArray(cellValue) && cellValue.length > 0
          ? cellValue.join('、')
          : '-',
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_RECRUIT_POST_STATUS },
      },
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 新增/修改表单 */
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
      fieldName: 'postName',
      label: '职位名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入职位名称',
        maxlength: 255,
        allowClear: true,
      },
    },
    {
      fieldName: 'deptId',
      label: '用人部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择用人部门',
        allowClear: true,
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'jobNature',
      label: '工作性质',
      component: 'Select',
      rules: 'required',
      defaultValue: HrmRecruitJobNature.FULL_TIME,
      componentProps: {
        options: getDictOptions(DICT_TYPE.HRM_RECRUIT_JOB_NATURE, 'number'),
        placeholder: '请选择工作性质',
        allowClear: true,
      },
    },
    {
      fieldName: 'areaId',
      label: '工作城市',
      component: markRaw(AreaCascader),
      componentProps: {
        placeholder: '请选择工作城市',
        allowClear: true,
        showSearch: true,
      },
    },
    {
      fieldName: 'recruitNum',
      label: '招聘人数',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入招聘人数',
        min: 0,
        class: 'w-full',
      },
    },
    {
      fieldName: 'reason',
      label: '招聘原因',
      component: 'Input',
      componentProps: {
        placeholder: '请输入招聘原因',
        maxlength: 255,
        allowClear: true,
      },
    },
    {
      fieldName: 'workTime',
      label: '工作经验',
      component: 'Select',
      defaultValue: HrmRecruitWorkTime.UNLIMITED,
      componentProps: {
        options: getDictOptions(DICT_TYPE.HRM_RECRUIT_WORK_TIME, 'number'),
        placeholder: '请选择工作经验',
        allowClear: true,
      },
    },
    {
      fieldName: 'educationRequire',
      label: '学历要求',
      component: 'Select',
      defaultValue: HrmRecruitPostEducation.UNLIMITED,
      componentProps: {
        options: getDictOptions(DICT_TYPE.HRM_RECRUIT_POST_EDUCATION, 'number'),
        placeholder: '请选择学历要求',
        allowClear: true,
      },
    },
    // 薪资范围：视觉上合并为一项；关联字段隐藏但保留 fieldName，供提交映射使用
    {
      fieldName: 'minSalary',
      label: '薪资范围',
      component: markRaw(SalaryRangeField),
      formItemClass: 'items-start',
      description: '最低薪资不能大于最高薪资；勾选“面议”后无需填写范围。',
      componentProps: (values, formApi) => ({
        values,
        formApi,
      }),
    },
    {
      fieldName: 'maxSalary',
      component: 'InputNumber',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'salaryUnit',
      component: 'Select',
      defaultValue: HrmRecruitSalaryUnit.MONTH,
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'salaryNegotiable',
      component: 'Checkbox',
      defaultValue: false,
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'latestEntryTime',
      label: '最迟到岗时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        valueFormat: 'x',
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择时间',
        class: 'w-full',
        allowClear: true,
      },
    },
    // 年龄要求：视觉上合并为一项；关联字段隐藏但保留 fieldName
    {
      fieldName: 'minAge',
      label: '年龄要求',
      component: markRaw(AgeRangeField),
      formItemClass: 'items-start',
      description: '最小年龄不能大于最大年龄；勾选“不限”后无需填写范围。',
      componentProps: (values, formApi) => ({
        values,
        formApi,
      }),
    },
    {
      fieldName: 'maxAge',
      component: 'InputNumber',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'ageUnlimited',
      component: 'Checkbox',
      defaultValue: false,
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'emergencyLevel',
      label: '紧急程度',
      component: 'RadioGroup',
      defaultValue: HrmRecruitEmergencyLevel.URGENT,
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.HRM_RECRUIT_EMERGENCY_LEVEL,
          'number',
        ),
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      fieldName: 'ownerEmployeeId',
      label: '招聘负责人',
      component: markRaw(EmployeeSelect),
      componentProps: {
        placeholder: '请选择招聘负责人',
        entryStatus: HrmEmployeeEntryStatus.ACTIVE,
        allowClear: true,
      },
    },
    {
      fieldName: 'postTypeId',
      label: '职位类型',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () =>
          handleTree(
            await getRecruitPostTypeList({ status: CommonStatusEnum.ENABLE }),
          ),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择职位类型',
        allowClear: true,
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'interviewEmployeeIds',
      label: '面试官',
      component: markRaw(EmployeeSelect),
      defaultValue: [],
      componentProps: {
        placeholder: '请选择面试官',
        entryStatus: HrmEmployeeEntryStatus.ACTIVE,
        multiple: true,
        allowClear: true,
      },
    },
    {
      fieldName: 'description',
      label: '职位描述',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入职位描述',
        maxlength: 4000,
        rows: 4,
        showCount: true,
        allowClear: true,
      },
    },
  ];
}

/** 停止招聘表单 */
export function useStopFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'stopReason',
      label: '停止原因',
      component: 'Textarea',
      rules: 'required',
      componentProps: {
        placeholder: '例如：岗位暂停',
        maxlength: 255,
        rows: 3,
        showCount: true,
        allowClear: true,
      },
    },
  ];
}

/** 详情页头部字段 */
export function useHeaderSchema(): DescriptionItemSchema[] {
  return [
    { field: 'deptName', label: '用人部门' },
    {
      field: 'jobNature',
      label: '工作性质',
      render: (val) =>
        val === undefined || val === null
          ? '-'
          : h(DictTag, { type: DICT_TYPE.HRM_RECRUIT_JOB_NATURE, value: val }),
    },
    { field: 'areaName', label: '工作城市' },
    { field: 'ownerEmployeeName', label: '招聘负责人' },
    {
      field: 'recruitSchedule',
      label: '招聘进度',
      render: (_val, data) =>
        formatRecruitPostProgress(data as HrmRecruitPostApi.RecruitPost),
    },
  ];
}

/** 详情基本信息 */
export function useBasicInfoSchema(): DescriptionItemSchema[] {
  return [
    { field: 'postName', label: '职位名称' },
    { field: 'deptName', label: '用人部门' },
    {
      field: 'jobNature',
      label: '工作性质',
      render: (val) =>
        val === undefined || val === null
          ? '-'
          : h(DictTag, { type: DICT_TYPE.HRM_RECRUIT_JOB_NATURE, value: val }),
    },
    { field: 'areaName', label: '工作城市' },
    {
      field: 'recruitNum',
      label: '招聘人数',
      render: (val) => (val === undefined || val === null ? '-' : String(val)),
    },
    {
      field: 'hasEntryNum',
      label: '已入职人数',
      render: (val) => String(val ?? 0),
    },
    { field: 'reason', label: '招聘原因', span: 2 },
    {
      field: 'workTime',
      label: '工作经验',
      render: (val) =>
        val === undefined || val === null
          ? '-'
          : h(DictTag, { type: DICT_TYPE.HRM_RECRUIT_WORK_TIME, value: val }),
    },
    {
      field: 'educationRequire',
      label: '学历要求',
      render: (val) =>
        val === undefined || val === null
          ? '-'
          : h(DictTag, {
              type: DICT_TYPE.HRM_RECRUIT_POST_EDUCATION,
              value: val,
            }),
    },
    {
      field: 'minSalary',
      label: '薪资范围',
      render: (_val, data) =>
        formatRecruitPostSalary(data as HrmRecruitPostApi.RecruitPost),
    },
    {
      field: 'minAge',
      label: '年龄要求',
      render: (_val, data) =>
        formatRecruitPostAge(data as HrmRecruitPostApi.RecruitPost),
    },
    {
      field: 'latestEntryTime',
      label: '最迟到岗时间',
      render: (val) => (val ? (formatDate(val) as string) : '-'),
    },
    {
      field: 'emergencyLevel',
      label: '紧急程度',
      render: (val) =>
        val === undefined || val === null
          ? '-'
          : h(DictTag, {
              type: DICT_TYPE.HRM_RECRUIT_EMERGENCY_LEVEL,
              value: val,
            }),
    },
    { field: 'ownerEmployeeName', label: '招聘负责人' },
    { field: 'postTypeName', label: '职位类型' },
    {
      field: 'interviewEmployeeNames',
      label: '面试官',
      span: 2,
      render: (val) =>
        Array.isArray(val) && val.length > 0 ? val.join('、') : '-',
    },
    {
      field: 'status',
      label: '状态',
      render: (val) =>
        val === undefined || val === null
          ? '-'
          : h(DictTag, { type: DICT_TYPE.HRM_RECRUIT_POST_STATUS, value: val }),
    },
    {
      field: 'stopReason',
      label: '停止原因',
      span: 2,
      show: (values) => values.status === HrmRecruitPostStatus.STOPPED,
    },
    {
      field: 'createTime',
      label: '创建时间',
      render: (val) => (val ? (formatDate(val) as string) : '-'),
    },
  ];
}

export {
  AGE_UNLIMITED_VALUE,
  HrmRecruitPostStatus,
  HrmRecruitSalaryUnit,
  SALARY_NEGOTIABLE_UNIT_VALUE,
  SALARY_NEGOTIABLE_VALUE,
};
