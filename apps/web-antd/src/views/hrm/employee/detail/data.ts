import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeCertificateApi } from '#/api/hrm/employee/certificate';
import type { HrmEmployeeContactApi } from '#/api/hrm/employee/contact';
import type { HrmEmployeeEducationExperienceApi } from '#/api/hrm/employee/education-experience';
import type { HrmEmployeeTrainingExperienceApi } from '#/api/hrm/employee/training-experience';
import type { HrmEmployeeWorkExperienceApi } from '#/api/hrm/employee/work-experience';

import {
  formatHrmDateTime,
  formatHrmEmployeeChangeType,
  formatHrmEmployeeContractStatus,
  formatHrmEmployeeContractType,
  formatHrmEmployeeTeachingMethod,
  formatHrmMoney,
  formatHrmYearMonth,
} from '#/views/hrm/utils/format';

function actionColumn(): NonNullable<VxeTableGridOptions['columns']>[number] {
  return {
    title: '操作',
    width: 140,
    align: 'center',
    fixed: 'right',
    slots: { default: 'actions' },
  };
}

/** 联系人列表字段 */
export function useContactGridColumns(): VxeTableGridOptions<HrmEmployeeContactApi.EmployeeContact>['columns'] {
  return [
    { field: 'name', title: '联系人', minWidth: 130 },
    { field: 'relation', title: '关系', width: 100 },
    { field: 'phone', title: '电话', width: 140 },
    { field: 'workUnit', title: '工作单位', minWidth: 180 },
    { field: 'postName', title: '职务', minWidth: 120 },
    { field: 'address', title: '地址', minWidth: 200, showOverflow: true },
    actionColumn(),
  ];
}

/** 证书列表字段 */
export function useCertificateGridColumns(): VxeTableGridOptions<HrmEmployeeCertificateApi.EmployeeCertificate>['columns'] {
  const dateColumn = (field: string, title: string) => ({
    field,
    title,
    width: 130,
    formatter: ({ cellValue }: { cellValue: unknown }) =>
      formatHrmDateTime(cellValue as Date | number | string | undefined),
  });
  return [
    { field: 'name', title: '证书名称', minWidth: 160 },
    { field: 'level', title: '证书级别', width: 120 },
    { field: 'no', title: '证书编号', minWidth: 150 },
    dateColumn('startTime', '有效开始日期'),
    dateColumn('endTime', '有效结束日期'),
    { field: 'issuingAuthority', title: '发证机构', minWidth: 160 },
    dateColumn('issuingTime', '发证日期'),
    { field: 'remark', title: '备注', minWidth: 180, showOverflow: true },
    actionColumn(),
  ];
}

/** 教育经历列表字段 */
export function useEducationGridColumns(): VxeTableGridOptions<HrmEmployeeEducationExperienceApi.EmployeeEducationExperience>['columns'] {
  return [
    {
      field: 'education',
      title: '学历',
      width: 100,
      slots: { default: 'education' },
    },
    { field: 'graduateSchool', title: '毕业院校', minWidth: 180 },
    { field: 'major', title: '专业', minWidth: 140 },
    {
      field: 'admissionTime',
      title: '入学日期',
      width: 130,
      formatter: ({ cellValue }) =>
        formatHrmDateTime(cellValue as Date | number | string | undefined),
    },
    {
      field: 'graduationTime',
      title: '毕业日期',
      width: 130,
      formatter: ({ cellValue }) =>
        formatHrmDateTime(cellValue as Date | number | string | undefined),
    },
    {
      field: 'teachingMethods',
      title: '教学方式',
      width: 130,
      formatter: ({ cellValue }) =>
        formatHrmEmployeeTeachingMethod(cellValue as number | undefined),
    },
    {
      field: 'firstDegree',
      title: '第一学历',
      width: 100,
      slots: { default: 'firstDegree' },
    },
    actionColumn(),
  ];
}

/** 培训经历列表字段 */
export function useTrainingGridColumns(): VxeTableGridOptions<HrmEmployeeTrainingExperienceApi.EmployeeTrainingExperience>['columns'] {
  return [
    { field: 'course', title: '培训课程', minWidth: 160 },
    { field: 'organizationName', title: '培训机构', minWidth: 160 },
    {
      field: 'startTime',
      title: '开始日期',
      width: 130,
      formatter: ({ cellValue }) =>
        formatHrmDateTime(cellValue as Date | number | string | undefined),
    },
    {
      field: 'endTime',
      title: '结束日期',
      width: 130,
      formatter: ({ cellValue }) =>
        formatHrmDateTime(cellValue as Date | number | string | undefined),
    },
    { field: 'duration', title: '培训时长', width: 120 },
    { field: 'result', title: '培训成绩', width: 120 },
    { field: 'certificateName', title: '证书名称', minWidth: 150 },
    { field: 'remark', title: '备注', minWidth: 180, showOverflow: true },
    actionColumn(),
  ];
}

/** 工作经历列表字段 */
export function useWorkGridColumns(): VxeTableGridOptions<HrmEmployeeWorkExperienceApi.EmployeeWorkExperience>['columns'] {
  return [
    { field: 'workUnit', title: '工作单位', minWidth: 180 },
    { field: 'postName', title: '职务', minWidth: 130 },
    {
      field: 'startTime',
      title: '开始日期',
      width: 130,
      formatter: ({ cellValue }) =>
        formatHrmDateTime(cellValue as Date | number | string | undefined),
    },
    {
      field: 'endTime',
      title: '结束日期',
      width: 130,
      formatter: ({ cellValue }) =>
        formatHrmDateTime(cellValue as Date | number | string | undefined),
    },
    { field: 'reason', title: '离职原因', minWidth: 160 },
    { field: 'witnessName', title: '证明人', width: 120 },
    { field: 'witnessPhone', title: '证明人电话', width: 140 },
    { field: 'remark', title: '工作备注', minWidth: 180, showOverflow: true },
    actionColumn(),
  ];
}
/** 合同列表字段 */
export function useContractGridColumns(): VxeTableGridOptions['columns'] {
  const dateColumn = (field: string, title: string) => ({
    field,
    title,
    width: 130,
    formatter: ({ cellValue }: { cellValue: unknown }) =>
      formatHrmDateTime(cellValue as Date | number | string | undefined),
  });
  return [
    { field: 'no', title: '合同编号', minWidth: 160 },
    {
      field: 'type',
      title: '合同类型',
      width: 120,
      formatter: ({ cellValue }) =>
        formatHrmEmployeeContractType(cellValue as number),
    },
    dateColumn('startTime', '开始日期'),
    dateColumn('endTime', '结束日期'),
    {
      field: 'term',
      title: '期限',
      width: 90,
      formatter: ({ cellValue }) =>
        cellValue === null || cellValue === undefined ? '-' : `${cellValue} 年`,
    },
    {
      field: 'status',
      title: '合同状态',
      width: 110,
      formatter: ({ cellValue }) =>
        formatHrmEmployeeContractStatus(cellValue as number),
    },
    { field: 'signCompany', title: '签约公司', minWidth: 160 },
    dateColumn('signTime', '签订日期'),
    {
      field: 'expireRemind',
      title: '到期提醒',
      width: 100,
      slots: { default: 'expireRemind' },
    },
    { field: 'remark', title: '备注', minWidth: 160, showOverflow: true },
    { title: '附件', minWidth: 180, slots: { default: 'files' } },
    actionColumn(),
  ];
}
/** 员工异动记录字段 */
export function useEmployeeChangeRecordGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'type',
      title: '异动类型',
      width: 120,
      formatter: ({ cellValue }) =>
        formatHrmEmployeeChangeType(cellValue as number),
    },
    { field: 'oldDeptName', title: '原部门', width: 120 },
    { field: 'newDeptName', title: '新部门', width: 120 },
    { field: 'oldPostName', title: '原岗位', width: 120 },
    { field: 'newPostName', title: '新岗位', width: 120 },
    { field: 'oldPostLevel', title: '原职级', width: 100 },
    { field: 'newPostLevel', title: '新职级', width: 100 },
    { field: 'oldWorkAddress', title: '原工作地点', width: 140 },
    { field: 'newWorkAddress', title: '新工作地点', width: 140 },
    { field: 'oldLeaderEmployeeName', title: '原直属上级', width: 120 },
    { field: 'newLeaderEmployeeName', title: '新直属上级', width: 120 },
    {
      field: 'effectTime',
      title: '生效日期',
      width: 130,
      formatter: ({ cellValue }) =>
        formatHrmDateTime(cellValue as Date | number | string | undefined),
    },
    { field: 'remark', title: '备注', minWidth: 180, showOverflow: true },
  ];
}

/** 历史月度工资字段 */
export function useSalaryHistoryGridColumns(): VxeTableGridOptions['columns'] {
  const moneyColumn = (field: string, title: string) => ({
    field,
    title,
    width: 130,
    align: 'right' as const,
    formatter: ({ cellValue }: { cellValue: unknown }) =>
      formatHrmMoney(Number(cellValue || 0)),
  });
  return [
    {
      field: 'year',
      title: '计薪月份',
      width: 110,
      formatter: ({ row }) => formatHrmYearMonth(row.year, row.month),
    },
    {
      field: 'actualWorkDay',
      title: '计薪周期',
      minWidth: 160,
      formatter: ({ row }) =>
        `${row.actualWorkDay ?? '-'} / ${row.needWorkDay ?? '-'} 天`,
    },
    moneyColumn('expectedPaySalary', '应发工资'),
    moneyColumn('personalTax', '个人所得税'),
    moneyColumn('realPaySalary', '实发工资'),
    {
      title: '操作',
      width: 80,
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 工资明细项目字段 */
export function useSalaryOptionValueGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'name', title: '工资项', minWidth: 220 },
    {
      field: 'value',
      title: '金额',
      width: 140,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(Number(cellValue || 0)),
    },
  ];
}

/** 定薪/调薪记录字段 */
export function useSalaryChangeRecordGridColumns(): VxeTableGridOptions['columns'] {
  const moneyColumn = (field: string, title: string) => ({
    field,
    title,
    width: 120,
    align: 'right' as const,
    formatter: ({ cellValue }: { cellValue: unknown }) =>
      formatHrmMoney(Number(cellValue || 0)),
  });
  return [
    {
      field: 'effectTime',
      title: '生效日期',
      width: 130,
      formatter: ({ cellValue }) =>
        formatHrmDateTime(cellValue as Date | number | string | undefined),
    },
    {
      field: 'recordType',
      title: '类型',
      width: 90,
      slots: { default: 'recordType' },
    },
    {
      field: 'changeReason',
      title: '原因',
      width: 100,
      slots: { default: 'changeReason' },
    },
    moneyColumn('beforeTotal', '调整前'),
    moneyColumn('afterTotal', '调整后'),
    moneyColumn('probationBeforeTotal', '试用调整前'),
    moneyColumn('probationAfterTotal', '试用调整后'),
    {
      field: 'status',
      title: '状态',
      width: 110,
      slots: { default: 'status' },
    },
    { field: 'remark', title: '备注', minWidth: 180, showOverflow: true },
  ];
}
