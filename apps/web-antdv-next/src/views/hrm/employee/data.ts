import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { markRaw } from 'vue';

import { z } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';
import { handleTree } from '@vben/utils';

import dayjs from 'dayjs';

import { getInsuranceSchemeSimpleList } from '#/api/hrm/insurance/scheme';
import { getRecruitChannelSimpleList } from '#/api/hrm/recruit/channel';
import { getSimpleDeptList } from '#/api/system/dept';
import { AreaCascader } from '#/components/area';
import { getRangePickerDefaultProps } from '#/utils';
import {
  HRM_EMPLOYEE_CREATE_ENTRY_STATUSES,
  HRM_EMPLOYEE_NO_PROBATION_MONTHS,
  HRM_EMPLOYEE_NON_FORMAL_STATUSES,
  HrmEmployeeChangeReason,
  HrmEmployeeChangeReasonOptions,
  HrmEmployeeChangeType,
  HrmEmployeeContractStatusOptions,
  HrmEmployeeContractTermOptions,
  HrmEmployeeContractType,
  HrmEmployeeContractTypeOptions,
  HrmEmployeeEntryStatus,
  HrmEmployeeIdType,
  HrmEmployeeIdTypeOptions,
  HrmEmployeeQuitReasonOptions,
  HrmEmployeeQuitType,
  HrmEmployeeStatus,
  HrmEmployeeTeachingMethodOptions,
  HrmEmployeeType,
} from '#/views/hrm/utils/constants';

/** DatePicker valueFormat=x 的可选时间戳 */
const optionalTimestampSchema = z.union([
  z.number(),
  z.string(),
  z.null(),
  z.undefined(),
]);

/**
 * 结束时间不得早于开始时间。
 * - 合同/证书：不传 unit，做完整时间戳比较
 * - 教育/工作/培训/离职日期：传 'day'
 */
function refineNotBeforeStart(
  startValue: unknown,
  message: string,
  unit?: 'day',
) {
  return optionalTimestampSchema.refine(
    (value) => {
      if (value === null || value === undefined || value === '') return true;
      if (
        startValue === null ||
        startValue === undefined ||
        startValue === ''
      ) {
        return true;
      }
      const end = dayjs(Number(value));
      const start = dayjs(Number(startValue));
      return unit ? !end.isBefore(start, unit) : !end.isBefore(start);
    },
    { message },
  );
}

/** 必填时间戳（DatePicker valueFormat=x） */
function refineRequiredTimestamp(message: string) {
  return optionalTimestampSchema.refine(
    (value) => value !== null && value !== undefined && value !== '',
    { message },
  );
}

/** 异动原因选项（调岗/晋升/转正） */
function getNormalChangeReasonOptions() {
  return HrmEmployeeChangeReasonOptions.filter(
    (item) => item.value <= HrmEmployeeChangeReason.WORK_ARRANGEMENT,
  );
}

/** 异动原因选项（降级） */
function getDemoteChangeReasonOptions() {
  return HrmEmployeeChangeReasonOptions.filter(
    (item) => item.value >= HrmEmployeeChangeReason.VIOLATION,
  );
}

/** 岗位异动表单岗位文案前缀 */
function getPositionChangePostLabel(
  changeType: 'demotion' | 'promotion' | 'regular' | 'transfer',
): string {
  switch (changeType) {
    case 'demotion': {
      return '降级后';
    }
    case 'promotion': {
      return '晋升后';
    }
    case 'regular': {
      return '转正后';
    }
    default: {
      return '新';
    }
  }
}

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '员工姓名',
      component: 'Input',
      componentProps: { placeholder: '请输入员工姓名', allowClear: true },
    },
    {
      fieldName: 'mobile',
      label: '手机号',
      component: 'Input',
      componentProps: { placeholder: '请输入手机号', allowClear: true },
    },
    {
      fieldName: 'sex',
      label: '性别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number'),
        placeholder: '请选择性别',
        allowClear: true,
      },
    },
    {
      fieldName: 'entryTime',
      label: '入职时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        showTime: true,
      },
    },
    {
      fieldName: 'jobNumber',
      label: '工号',
      component: 'Input',
      componentProps: { placeholder: '请输入工号', allowClear: true },
    },
    {
      fieldName: 'deptId',
      label: '部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择部门',
        allowClear: true,
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'postName',
      label: '岗位',
      component: 'Input',
      componentProps: { placeholder: '请输入岗位', allowClear: true },
    },
    {
      fieldName: 'regularTime',
      label: '转正时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        showTime: true,
      },
    },
    {
      fieldName: 'workAddress',
      label: '工作地点',
      component: 'Input',
      componentProps: { placeholder: '请输入工作地点', allowClear: true },
    },
    {
      fieldName: 'channelId',
      label: '招聘渠道',
      component: 'ApiSelect',
      componentProps: {
        api: getRecruitChannelSimpleList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择招聘渠道',
        allowClear: true,
        showSearch: true,
      },
    },
    {
      fieldName: 'type',
      label: '聘用形式',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.HRM_EMPLOYEE_TYPE, 'number'),
        placeholder: '请选择聘用形式',
        allowClear: true,
      },
    },
  ];
}

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<HrmEmployeeApi.Employee>['columns'] {
  return [
    { type: 'checkbox', width: 50, fixed: 'left' },
    {
      field: 'name',
      title: '员工姓名',
      minWidth: 120,
      fixed: 'left',
      slots: { default: 'name' },
    },
    { field: 'mobile', title: '手机号', minWidth: 130 },
    {
      field: 'channelName',
      title: '招聘渠道',
      minWidth: 120,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'sex',
      title: '性别',
      width: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_USER_SEX },
      },
    },
    {
      field: 'entryTime',
      title: '入职时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    { field: 'deptName', title: '部门', minWidth: 120 },
    { field: 'jobNumber', title: '工号', minWidth: 120 },
    { field: 'postName', title: '岗位', minWidth: 130 },
    { field: 'leaderEmployeeName', title: '直属上级', minWidth: 120 },
    {
      field: 'type',
      title: '聘用形式',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_EMPLOYEE_TYPE },
      },
    },
    {
      field: 'status',
      title: '员工状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_EMPLOYEE_STATUS },
      },
    },
    {
      field: 'entryStatus',
      title: '入职状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS },
      },
    },
    {
      field: 'regularTime',
      title: '转正时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    { field: 'workAddress', title: '工作地点', minWidth: 140 },
    { field: 'salaryCardNumber', title: '银行卡号', minWidth: 170 },
    { field: 'salaryCardAreaName', title: '开户地区', minWidth: 180 },
    { field: 'salaryCardBankName', title: '银行名称', minWidth: 140 },
    { field: 'salaryCardBankBranchName', title: '开户支行', minWidth: 160 },
    { field: 'socialSecurityNumber', title: '个人社保账号', minWidth: 150 },
    {
      field: 'accumulationFundNumber',
      title: '个人公积金账号',
      minWidth: 160,
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 导入表单 */
export function useImportFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'duplicateStrategy',
      label: '重复员工',
      component: 'RadioGroup',
      defaultValue: 3,
      componentProps: {
        options: [
          { label: '跳过', value: 1 },
          { label: '覆盖', value: 2 },
          { label: '判失败', value: 3 },
        ],
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      fieldName: 'file',
      label: 'Excel 文件',
      component: 'Input',
      rules: 'required',
    },
  ];
}

/** 默认员工表单数据 */
export function createDefaultEmployeeFormData(): HrmEmployeeApi.Employee {
  return {
    name: '',
    jobNumber: '',
    mobile: '',
    country: '中国',
    idType: HrmEmployeeIdType.ID_CARD,
    entryStatus: HrmEmployeeEntryStatus.ACTIVE,
    type: HrmEmployeeType.FORMAL,
    probation: HRM_EMPLOYEE_NO_PROBATION_MONTHS,
  };
}

/** 状态页签配置 */
export function getEmployeeStatusTabItems() {
  return [
    { status: 11, label: '在职' },
    { status: 12, label: '全职' },
    {
      status: HrmEmployeeStatus.INTERN,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.INTERN,
      ),
    },
    {
      status: HrmEmployeeStatus.LABOR,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.LABOR,
      ),
    },
    {
      status: HrmEmployeeStatus.CONSULTANT,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.CONSULTANT,
      ),
    },
    {
      status: HrmEmployeeStatus.REHIRE,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.REHIRE,
      ),
    },
    {
      status: HrmEmployeeStatus.OUTSOURCE,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.OUTSOURCE,
      ),
    },
    {
      status: HrmEmployeeStatus.PART_TIME,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.PART_TIME,
      ),
    },
    {
      status: HrmEmployeeStatus.PROBATION,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.PROBATION,
      ),
    },
    {
      status: HrmEmployeeStatus.REGULAR,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.REGULAR,
      ),
    },
    { status: 13, label: '待入职' },
    { status: 14, label: '待离职' },
    { status: 15, label: '已离职' },
  ];
}

/** 异动类型映射 */
export const EMPLOYEE_CHANGE_TYPE_MAP = {
  regular: HrmEmployeeChangeType.REGULAR,
  transfer: HrmEmployeeChangeType.TRANSFER,
  promotion: HrmEmployeeChangeType.PROMOTION,
  demotion: HrmEmployeeChangeType.DEMOTION,
  'full-time': HrmEmployeeChangeType.FULL_TIME,
} as const;

/** 设置参保方案表单 */
export function useInsuranceSchemeFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'employeeCount',
      label: '员工数量',
      component: 'Input',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'schemeId',
      label: '社保方案',
      component: 'ApiSelect',
      rules: 'required',
      componentProps: {
        api: getInsuranceSchemeSimpleList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择社保方案',
        allowClear: false,
        showSearch: true,
      },
    },
  ];
}

/** 员工转正表单 */
export function useRegularFormSchema(): VbenFormSchema[] {
  return usePositionChangeFormSchema('regular');
}

/** 岗位异动共享表单 */
export function usePositionChangeFormSchema(
  changeType: 'demotion' | 'promotion' | 'regular' | 'transfer' = 'transfer',
): VbenFormSchema[] {
  const reasonOptions =
    changeType === 'demotion'
      ? getDemoteChangeReasonOptions()
      : getNormalChangeReasonOptions();
  const postLabel = getPositionChangePostLabel(changeType);
  return [
    {
      fieldName: 'employeeId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'employeeName',
      label: '员工姓名',
      component: 'Input',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'currentPostName',
      label: '当前岗位',
      component: 'Input',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'reason',
      label: '异动原因',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: reasonOptions,
        placeholder: '请选择异动原因',
        allowClear: true,
      },
    },
    {
      fieldName: 'effectTime',
      label: '生效日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'newDeptId',
      label: `${postLabel}部门`,
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择部门',
        allowClear: true,
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'newPostName',
      label: `${postLabel}岗位`,
      component: 'Input',
      componentProps: {
        placeholder: '未调整则保持当前岗位',
        allowClear: true,
      },
    },
    {
      fieldName: 'newPostLevel',
      label: `${postLabel}职级`,
      component: 'Input',
      componentProps: {
        placeholder: '未调整则保持当前职级',
        allowClear: true,
      },
    },
    {
      fieldName: 'newLeaderEmployeeId',
      label: `${postLabel}直属上级`,
      component: 'Input',
    },
    {
      fieldName: 'newWorkAddress',
      label: `${postLabel}工作地点`,
      component: 'Input',
      componentProps: {
        placeholder: '未调整则保持当前工作地点',
        allowClear: true,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        rows: 3,
        maxlength: 500,
        showCount: true,
      },
    },
  ];
}

/** 转为全职表单 */
export function useFullTimeFormSchema(): VbenFormSchema[] {
  return [
    ...usePositionChangeFormSchema('transfer').filter(
      (item) =>
        ![
          'newDeptId',
          'newLeaderEmployeeId',
          'newPostLevel',
          'newPostName',
          'newWorkAddress',
        ].includes(item.fieldName),
    ),
    {
      fieldName: 'probation',
      label: '试用期(月)',
      component: 'InputNumber',
      rules: 'required',
      componentProps: { min: 0, max: 6, class: 'w-full' },
    },
    {
      fieldName: 'newDeptId',
      label: '转全职后部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择部门',
        allowClear: true,
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'newPostName',
      label: '转全职后岗位',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'newPostLevel',
      label: '转全职后职级',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'newLeaderEmployeeId',
      label: '转全职后上级',
      component: 'Input',
    },
    {
      fieldName: 'newWorkAddress',
      label: '转全职后工作地点',
      component: 'Input',
      componentProps: { allowClear: true },
    },
  ];
}

/** 离职表单 */
export function useQuitFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'employeeId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'employeeName',
      label: '员工姓名',
      component: 'Input',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'currentPostName',
      label: '当前岗位',
      component: 'Input',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'planQuitTime',
      label: '计划离职时间',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        class: 'w-full',
      },
      dependencies: {
        triggerFields: ['applyQuitTime', 'planQuitTime'],
        rules(values) {
          return refineRequiredTimestamp('请选择计划离职时间').pipe(
            refineNotBeforeStart(
              values.applyQuitTime,
              '计划离职日期不能早于申请离职日期',
              'day',
            ),
          );
        },
      },
    },
    {
      fieldName: 'applyQuitTime',
      label: '申请离职日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'type',
      label: '离职类型',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: [
          { label: '主动离职', value: HrmEmployeeQuitType.VOLUNTARY },
          { label: '被动离职', value: HrmEmployeeQuitType.INVOLUNTARY },
          { label: '退休', value: HrmEmployeeQuitType.RETIREMENT },
        ],
        placeholder: '请选择离职类型',
        allowClear: true,
      },
    },
    {
      fieldName: 'reason',
      label: '离职原因',
      component: 'Select',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type !== HrmEmployeeQuitType.RETIREMENT,
        rules: (values) =>
          values.type === HrmEmployeeQuitType.RETIREMENT ? null : 'required',
        componentProps: (values) => ({
          options: HrmEmployeeQuitReasonOptions.filter(
            (item) => item.quitType === values.type,
          ),
          placeholder: '请选择离职原因',
          allowClear: true,
        }),
      },
    },
    {
      fieldName: 'salarySettlementTime',
      label: '薪资结算日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'x',
        class: 'w-full',
      },
      dependencies: {
        triggerFields: ['planQuitTime', 'salarySettlementTime'],
        rules(values) {
          return refineRequiredTimestamp('请选择薪资结算日期').pipe(
            refineNotBeforeStart(
              values.planQuitTime,
              '薪资结算日期不能早于计划离职日期',
              'day',
            ),
          );
        },
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: { rows: 3, maxlength: 500, showCount: true },
    },
  ];
}

/** 员工表单 - 个人信息字段 */
export function useEmployeePersonalFormSchema(
  isFieldVisible: (name: string) => boolean,
): VbenFormSchema[] {
  const allFields: VbenFormSchema[] = [
    {
      fieldName: 'name',
      label: '员工姓名',
      component: 'Input',
      rules: 'required',
      componentProps: { maxlength: 255, allowClear: true },
    },
    {
      fieldName: 'userId',
      label: '绑定用户',
      component: 'Input',
    },
    {
      fieldName: 'mobile',
      label: '手机号',
      component: 'Input',
      rules: z
        .string()
        .min(1, { message: '手机号不能为空' })
        .regex(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号码' }),
      componentProps: { maxlength: 11, allowClear: true },
    },
    {
      fieldName: 'email',
      label: '邮箱',
      component: 'Input',
      rules: z
        .string()
        .email('请输入正确的邮箱地址')
        .or(z.literal(''))
        .optional(),
      componentProps: { maxlength: 255, allowClear: true },
    },
    {
      fieldName: 'country',
      label: '国家或地区',
      component: 'Input',
      componentProps: { maxlength: 64, allowClear: true },
    },
    {
      fieldName: 'nation',
      label: '民族',
      component: 'Input',
      componentProps: { maxlength: 64, allowClear: true },
    },
    {
      fieldName: 'idType',
      label: '证件类型',
      component: 'Select',
      componentProps: {
        options: HrmEmployeeIdTypeOptions,
        placeholder: '请选择证件类型',
        allowClear: true,
      },
    },
    {
      fieldName: 'idNumber',
      label: '证件号码',
      component: 'Input',
      componentProps: { maxlength: 255, allowClear: true },
    },
    {
      fieldName: 'sex',
      label: '性别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number'),
        placeholder: '请选择性别',
        allowClear: true,
      },
    },
    {
      fieldName: 'nativePlace',
      label: '籍贯',
      component: 'Input',
      componentProps: { maxlength: 128, allowClear: true },
    },
    {
      fieldName: 'birthday',
      label: '出生时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'age',
      label: '年龄',
      component: 'InputNumber',
      componentProps: { min: 0, max: 200, disabled: true, class: 'w-full' },
    },
    {
      fieldName: 'highestEducation',
      label: '最高学历',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.HRM_EMPLOYEE_EDUCATION, 'number'),
        placeholder: '请选择最高学历',
        allowClear: true,
      },
    },
    {
      fieldName: 'address',
      label: '户籍地址',
      component: 'Input',
      componentProps: { maxlength: 255, allowClear: true },
    },
  ];
  return allFields.filter((item) => isFieldVisible(String(item.fieldName)));
}

/** 员工表单 - 入职信息字段 */
export function useEmployeeEntryFormSchema(
  isFieldVisible: (name: string) => boolean,
  formType: string,
): VbenFormSchema[] {
  const entryStatusOptions = getDictOptions(
    DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS,
    'number',
  ).filter((item) =>
    formType === 'update'
      ? true
      : (HRM_EMPLOYEE_CREATE_ENTRY_STATUSES as readonly number[]).includes(
          Number(item.value),
        ),
  );
  const nonFormalStatusOptions = getDictOptions(
    DICT_TYPE.HRM_EMPLOYEE_STATUS,
    'number',
  ).filter((item) =>
    (HRM_EMPLOYEE_NON_FORMAL_STATUSES as readonly number[]).includes(
      Number(item.value),
    ),
  );
  const allFields: VbenFormSchema[] = [
    {
      fieldName: 'jobNumber',
      label: '工号',
      component: 'Input',
      componentProps: { maxlength: 64, allowClear: true },
    },
    {
      fieldName: 'entryStatus',
      label: '入职状态',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: entryStatusOptions,
        disabled: !['candidate', 'create'].includes(formType),
        placeholder: '请选择入职状态',
        allowClear: true,
      },
    },
    {
      fieldName: 'deptId',
      label: '部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择部门',
        allowClear: true,
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'postName',
      label: '职位名称',
      component: 'Input',
      componentProps: { maxlength: 255, allowClear: true },
    },
    {
      fieldName: 'postLevel',
      label: '岗位职级',
      component: 'Input',
      componentProps: { maxlength: 255, allowClear: true },
    },
    {
      fieldName: 'leaderEmployeeId',
      label: '直属上级',
      component: 'Input',
    },
    {
      fieldName: 'type',
      label: '聘用形式',
      component: 'Select',
      rules: 'required',
      defaultValue: HrmEmployeeType.FORMAL,
      componentProps: {
        options: getDictOptions(DICT_TYPE.HRM_EMPLOYEE_TYPE, 'number'),
        placeholder: '请选择聘用形式',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '员工状态',
      component: 'Select',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === HrmEmployeeType.INFORMAL,
        rules: (values) =>
          values.type === HrmEmployeeType.INFORMAL ? 'required' : null,
      },
      componentProps: {
        options: nonFormalStatusOptions,
        placeholder: '请选择员工状态',
        allowClear: true,
      },
    },
    {
      fieldName: 'probation',
      label: '试用期(月)',
      component: 'InputNumber',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === HrmEmployeeType.FORMAL,
        rules: (values) =>
          values.type === HrmEmployeeType.FORMAL ? 'required' : null,
      },
      componentProps: { min: 0, max: 24, class: 'w-full' },
    },
    {
      fieldName: 'entryTime',
      label: '入职时间',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'regularTime',
      label: '转正时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'leaveTime',
      label: '离职时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'workCity',
      label: '工作城市',
      component: 'Input',
      componentProps: { maxlength: 128, allowClear: true },
    },
    {
      fieldName: 'workAddress',
      label: '工作地点',
      component: 'Input',
      componentProps: { maxlength: 255, allowClear: true },
    },
    {
      fieldName: 'workDetailAddress',
      label: '工作详细地址',
      component: 'Input',
      componentProps: { maxlength: 255, allowClear: true },
    },
    {
      fieldName: 'channelId',
      label: '招聘渠道',
      component: 'ApiSelect',
      componentProps: {
        api: getRecruitChannelSimpleList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择招聘渠道',
        allowClear: true,
        showSearch: true,
      },
    },
    {
      fieldName: 'companyAgeStartTime',
      label: '司龄开始时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'candidateId',
      label: '招聘候选人',
      component: 'Input',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: { rows: 3, maxlength: 500, showCount: true },
    },
  ];
  return allFields.filter((item) => isFieldVisible(String(item.fieldName)));
}

/** 详情页头部 schema */
export function useHeaderSchema() {
  return [
    { field: 'deptName', label: '所属部门' },
    { field: 'postName', label: '职位名称' },
    { field: 'jobNumber', label: '工号' },
    { field: 'mobile', label: '手机号' },
    { field: 'leaderEmployeeName', label: '直属上级' },
  ];
}

/** 联系人表单 */
export function useContactFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '联系人',
      component: 'Input',
      rules: 'required',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'relation',
      label: '关系',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'phone',
      label: '电话',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'workUnit',
      label: '工作单位',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'postName',
      label: '职务',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'address',
      label: '地址',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: { min: 0, class: 'w-full' },
    },
  ];
}

/** 证书表单 */
export function useCertificateFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '证书名称',
      component: 'Input',
      rules: 'required',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'level',
      label: '证书级别',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'no',
      label: '证书编码',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'startTime',
      label: '有效开始日期',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'endTime',
      label: '有效结束日期',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        class: 'w-full',
      },
      dependencies: {
        triggerFields: ['startTime', 'endTime'],
        rules(values) {
          return refineNotBeforeStart(
            values.startTime,
            '有效结束日期不能早于有效开始日期',
          );
        },
      },
    },
    {
      fieldName: 'issuingAuthority',
      label: '发证机构',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'issuingTime',
      label: '发证日期',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: { rows: 3, maxlength: 255, showCount: true },
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: { min: 0, class: 'w-full' },
    },
  ];
}

/** 教育经历表单 */
export function useEducationFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'education',
      label: '学历',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: getDictOptions(DICT_TYPE.HRM_EMPLOYEE_EDUCATION, 'number'),
        allowClear: true,
      },
    },
    {
      fieldName: 'graduateSchool',
      label: '毕业院校',
      component: 'Input',
      rules: 'required',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'major',
      label: '专业',
      component: 'Input',
      rules: 'required',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'admissionTime',
      label: '入学日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'graduationTime',
      label: '毕业日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'x',
        class: 'w-full',
      },
      dependencies: {
        triggerFields: ['admissionTime', 'graduationTime'],
        rules(values) {
          return refineNotBeforeStart(
            values.admissionTime,
            '毕业日期不能早于入学日期',
            'day',
          );
        },
      },
    },
    {
      fieldName: 'teachingMethods',
      label: '教学方式',
      component: 'Select',
      componentProps: {
        options: HrmEmployeeTeachingMethodOptions,
        allowClear: true,
      },
    },
    {
      fieldName: 'firstDegree',
      label: '第一学历',
      component: 'Switch',
      componentProps: { checkedValue: true, unCheckedValue: false },
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: { min: 0, class: 'w-full' },
    },
  ];
}

/** 工作经历表单 */
export function useWorkFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'workUnit',
      label: '工作单位',
      component: 'Input',
      rules: 'required',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'postName',
      label: '职务',
      component: 'Input',
      rules: 'required',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'startTime',
      label: '开始日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'endTime',
      label: '结束日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'x',
        class: 'w-full',
      },
      dependencies: {
        triggerFields: ['startTime', 'endTime'],
        rules(values) {
          return refineNotBeforeStart(
            values.startTime,
            '结束日期不能早于开始日期',
            'day',
          );
        },
      },
    },
    {
      fieldName: 'reason',
      label: '离职原因',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'witnessName',
      label: '证明人',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'witnessPhone',
      label: '证明人电话',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'remark',
      label: '工作备注',
      component: 'Textarea',
      componentProps: { rows: 3, maxlength: 500, showCount: true },
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: { min: 0, class: 'w-full' },
    },
  ];
}

/** 培训经历表单 */
export function useTrainingFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'course',
      label: '培训课程',
      component: 'Input',
      rules: 'required',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'organizationName',
      label: '培训机构',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'startTime',
      label: '开始日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'endTime',
      label: '结束日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'x',
        class: 'w-full',
      },
      dependencies: {
        triggerFields: ['startTime', 'endTime'],
        rules(values) {
          return refineNotBeforeStart(
            values.startTime,
            '结束日期不能早于开始日期',
            'day',
          );
        },
      },
    },
    {
      fieldName: 'duration',
      label: '培训时长',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'result',
      label: '培训成绩',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'certificateName',
      label: '证书名称',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: { rows: 3, maxlength: 500, showCount: true },
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: { min: 0, class: 'w-full' },
    },
  ];
}

/** 合同表单 */
export function useContractFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '合同编码',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'type',
      label: '合同类型',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: HrmEmployeeContractTypeOptions,
        allowClear: true,
      },
    },
    {
      fieldName: 'startTime',
      label: '开始日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'endTime',
      label: '结束日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        class: 'w-full',
      },
      dependencies: {
        triggerFields: ['startTime', 'endTime'],
        rules(values) {
          return refineRequiredTimestamp('结束日期不能为空').pipe(
            refineNotBeforeStart(
              values.startTime,
              '合同结束日期不能早于开始日期',
            ),
          );
        },
      },
    },
    {
      fieldName: 'term',
      label: '合同期限',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: HrmEmployeeContractTermOptions,
        allowClear: true,
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) =>
          values.type !== HrmEmployeeContractType.NON_FIXED_TERM_LABOR_CONTRACT,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: HrmEmployeeContractStatusOptions,
        allowClear: true,
      },
    },
    {
      fieldName: 'signCompany',
      label: '签约公司',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'signTime',
      label: '签订日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'expireRemind',
      label: '到期提醒',
      component: 'Switch',
      defaultValue: false,
      componentProps: { checkedValue: true, unCheckedValue: false },
    },
    {
      fieldName: 'fileUrls',
      label: '合同附件',
      component: 'FileUpload',
      formItemClass: 'col-span-2',
      componentProps: {
        maxNumber: 5,
        maxSize: 20,
        accept: ['pdf', 'doc', 'docx'],
        directory: 'hrm/employee/contract',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: { rows: 3, maxlength: 255, showCount: true },
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: { min: 0, class: 'w-full' },
    },
  ];
}

/** 工资卡表单 */
export function useSalaryCardFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'bankCardNumber',
      label: '银行卡号',
      component: 'Input',
      rules: 'required',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'bankAreaId',
      label: '开户地区',
      component: markRaw(AreaCascader),
      componentProps: {
        placeholder: '请选择开户地区',
        allowClear: true,
        showSearch: true,
      },
    },
    {
      fieldName: 'bankName',
      label: '银行名称',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'bankBranchName',
      label: '开户支行',
      component: 'Input',
      componentProps: { allowClear: true },
    },
  ];
}

/** 社保资料表单 */
export function useInsuranceInfoFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'socialSecurityNumber',
      label: '社保编号',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'accumulationFundNumber',
      label: '公积金编号',
      component: 'Input',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'socialSecurityStartMonth',
      label: '社保起始月',
      component: 'DatePicker',
      componentProps: {
        picker: 'month',
        format: 'YYYY-MM',
        valueFormat: 'x',
        class: 'w-full',
      },
    },
    {
      fieldName: 'schemeId',
      label: '参保方案',
      component: 'ApiSelect',
      componentProps: {
        api: getInsuranceSchemeSimpleList,
        labelField: 'name',
        valueField: 'id',
        allowClear: true,
        showSearch: true,
      },
    },
    {
      fieldName: 'firstSocialSecurity',
      label: '本地首次缴纳社保',
      component: 'Switch',
      componentProps: { checkedValue: true, unCheckedValue: false },
    },
    {
      fieldName: 'firstAccumulationFund',
      label: '本地首次缴纳公积金',
      component: 'Switch',
      componentProps: { checkedValue: true, unCheckedValue: false },
    },
  ];
}
