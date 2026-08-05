import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmRecruitCandidateApi } from '#/api/hrm/recruit/candidate';

import { markRaw } from 'vue';

import { z } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRecruitChannelSimpleList } from '#/api/hrm/recruit/channel';
import { getRecruitEliminateReasonList } from '#/api/hrm/recruit/config';
import { getRecruitPostSimpleList } from '#/api/hrm/recruit/post';
import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';
import EmployeeSelect from '#/views/hrm/employee/components/employee-select.vue';
import {
  HrmEmployeeEntryStatus,
  HrmRecruitCandidateStatus,
  HrmRecruitInterviewResult,
  HrmRecruitInterviewType,
} from '#/views/hrm/utils/constants';

/** 新增/修改候选人表单 */
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
      label: '候选人姓名',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入候选人姓名',
        maxlength: 255,
        allowClear: true,
      },
    },
    {
      fieldName: 'mobile',
      label: '手机号码',
      component: 'Input',
      rules: z
        .string()
        .min(1, { message: '手机号码不能为空' })
        .regex(/^(\+?0?\d{2,4}-?)?\d{6,11}$/, {
          message: '请输入正确的手机号码',
        }),
      componentProps: {
        placeholder: '请输入手机号码',
        maxlength: 18,
        allowClear: true,
      },
    },
    {
      fieldName: 'sex',
      label: '性别',
      component: 'RadioGroup',
      rules: z.number().default(1),
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number').filter(
          (item) => item.value !== 0,
        ),
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      fieldName: 'age',
      label: '年龄',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入年龄',
        min: 0,
        max: 99,
        class: 'w-full',
      },
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
      componentProps: {
        placeholder: '请输入邮箱',
        maxlength: 255,
        allowClear: true,
      },
    },
    {
      fieldName: 'postId',
      label: '应聘职位',
      component: 'ApiSelect',
      rules: 'required',
      componentProps: {
        api: getRecruitPostSimpleList,
        labelField: 'postName',
        valueField: 'id',
        placeholder: '请选择应聘职位',
        allowClear: false,
        showSearch: true,
      },
    },
    {
      fieldName: 'workTime',
      label: '工作年限',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入工作年限',
        min: 0,
        max: 60,
        class: 'w-full',
      },
    },
    {
      fieldName: 'education',
      label: '学历',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.HRM_RECRUIT_CANDIDATE_EDUCATION,
          'number',
        ),
        placeholder: '请选择学历',
        allowClear: true,
      },
    },
    {
      fieldName: 'graduateSchool',
      label: '毕业院校',
      component: 'Input',
      componentProps: {
        placeholder: '请输入毕业院校',
        maxlength: 255,
        allowClear: true,
      },
    },
    {
      fieldName: 'latestWorkPlace',
      label: '最近工作单位',
      component: 'Input',
      componentProps: {
        placeholder: '请输入最近工作单位',
        maxlength: 255,
        allowClear: true,
      },
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
      fieldName: 'resumeUrls',
      label: '简历附件',
      component: 'FileUpload',
      formItemClass: 'col-span-2',
      componentProps: {
        maxNumber: 5,
        maxSize: 20,
        accept: ['doc', 'docx', 'pdf'],
        directory: 'hrm/recruit/candidate/resume',
        helpText: '支持 doc/docx/pdf，最多 5 个，单个不超过 20MB',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
        maxlength: 255,
        showCount: true,
      },
    },
  ];
}

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'search',
      label: '候选人',
      component: 'Input',
      componentProps: {
        placeholder: '请输入姓名、手机号或邮箱',
        allowClear: true,
      },
    },
    {
      fieldName: 'postId',
      label: '应聘职位',
      component: 'ApiSelect',
      componentProps: {
        api: getRecruitPostSimpleList,
        labelField: 'postName',
        valueField: 'id',
        placeholder: '请选择应聘职位',
        allowClear: true,
        showSearch: true,
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
      fieldName: 'minAge',
      label: '最小年龄',
      component: 'InputNumber',
      componentProps: {
        placeholder: '最小年龄',
        min: 0,
        max: 99,
        class: 'w-full',
      },
    },
    {
      fieldName: 'maxAge',
      label: '最大年龄',
      component: 'InputNumber',
      componentProps: {
        placeholder: '最大年龄',
        min: 0,
        max: 99,
        class: 'w-full',
      },
    },
    {
      fieldName: 'minWorkTime',
      label: '最小工作年限',
      component: 'InputNumber',
      componentProps: {
        placeholder: '最小年限',
        min: 0,
        class: 'w-full',
      },
    },
    {
      fieldName: 'maxWorkTime',
      label: '最大工作年限',
      component: 'InputNumber',
      componentProps: {
        placeholder: '最大年限',
        min: 0,
        class: 'w-full',
      },
    },
    {
      fieldName: 'education',
      label: '学历',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.HRM_RECRUIT_CANDIDATE_EDUCATION,
          'number',
        ),
        placeholder: '请选择学历',
        allowClear: true,
      },
    },
    {
      fieldName: 'graduateSchool',
      label: '毕业院校',
      component: 'Input',
      componentProps: {
        placeholder: '请输入毕业院校',
        allowClear: true,
      },
    },
    {
      fieldName: 'latestWorkPlace',
      label: '最近单位',
      component: 'Input',
      componentProps: {
        placeholder: '请输入最近工作单位',
        allowClear: true,
      },
    },
    {
      fieldName: 'interviewEmployeeId',
      label: '面试官',
      component: markRaw(EmployeeSelect),
      componentProps: {
        placeholder: '请选择面试官',
        entryStatus: HrmEmployeeEntryStatus.ACTIVE,
        allowClear: true,
      },
    },
    {
      fieldName: 'interviewTime',
      label: '面试时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        showTime: true,
      },
    },
    {
      fieldName: 'creator',
      label: '创建人',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        labelField: 'nickname',
        valueField: 'id',
        placeholder: '请选择创建人',
        allowClear: true,
        showSearch: true,
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        showTime: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<HrmRecruitCandidateApi.RecruitCandidate>['columns'] {
  return [
    { type: 'checkbox' as const, width: 50, fixed: 'left' },
    {
      field: 'name',
      title: '姓名',
      minWidth: 110,
      fixed: 'left',
      slots: { default: 'name' },
    },
    { field: 'postName', title: '应聘职位', minWidth: 160 },
    { field: 'deptName', title: '用人部门', minWidth: 130 },
    {
      field: 'status',
      title: '候选人状态',
      width: 190,
      slots: { default: 'status' },
    },
    { field: 'mobile', title: '手机号码', width: 130 },
    {
      field: 'sex',
      title: '性别',
      width: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_USER_SEX },
      },
    },
    { field: 'age', title: '年龄', width: 80 },
    { field: 'email', title: '邮箱', minWidth: 180 },
    { field: 'ownerEmployeeName', title: '招聘负责人', minWidth: 130 },
    {
      field: 'workTime',
      title: '工作年限',
      width: 100,
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === null ? '-' : `${cellValue} 年`,
    },
    {
      field: 'education',
      title: '学历',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_RECRUIT_CANDIDATE_EDUCATION },
      },
    },
    { field: 'graduateSchool', title: '毕业院校', minWidth: 140 },
    { field: 'latestWorkPlace', title: '最近工作单位', minWidth: 150 },
    { field: 'channelName', title: '招聘渠道', minWidth: 120 },
    {
      field: 'interviewTime',
      title: '面试时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    { field: 'stageNumber', title: '面试轮次', width: 100 },
    { field: 'interviewEmployeeName', title: '主面试官', minWidth: 120 },
    {
      field: 'interviewType',
      title: '面试方式',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_RECRUIT_INTERVIEW_TYPE },
      },
    },
    {
      field: 'otherInterviewEmployeeNames',
      title: '其他面试官',
      minWidth: 150,
      formatter: ({ cellValue }) =>
        Array.isArray(cellValue) && cellValue.length > 0
          ? cellValue.join('、')
          : '-',
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 面试安排表单 */
export function useInterviewFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'candidateCount',
      label: '候选人数',
      component: 'Input',
      dependencies: {
        triggerFields: ['formType'],
        show: (values) => values.formType === 'batch',
      },
      componentProps: { disabled: true },
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
      fieldName: 'type',
      label: '面试方式',
      component: 'Select',
      rules: 'required',
      defaultValue: HrmRecruitInterviewType.VIDEO,
      componentProps: {
        options: getDictOptions(DICT_TYPE.HRM_RECRUIT_INTERVIEW_TYPE, 'number'),
        placeholder: '请选择面试方式',
        allowClear: true,
      },
    },
    {
      fieldName: 'interviewTime',
      label: '面试时间',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        placeholder: '请选择面试时间',
        class: 'w-full',
      },
    },
    {
      fieldName: 'interviewEmployeeId',
      label: '主面试官',
      component: markRaw(EmployeeSelect),
      rules: 'required',
      componentProps: {
        placeholder: '请选择主面试官',
        entryStatus: HrmEmployeeEntryStatus.ACTIVE,
        allowClear: true,
      },
    },
    {
      fieldName: 'otherInterviewEmployeeIds',
      label: '其他面试官',
      component: markRaw(EmployeeSelect),
      componentProps: {
        placeholder: '请选择其他面试官',
        entryStatus: HrmEmployeeEntryStatus.ACTIVE,
        multiple: true,
        allowClear: true,
      },
    },
    {
      fieldName: 'address',
      label: '面试地址',
      component: 'Input',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入面试地址',
        maxlength: 255,
        allowClear: true,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
        maxlength: 255,
        showCount: true,
      },
    },
  ];
}

/** 面试结果表单 */
export function useInterviewResultFormSchema(
  cancelMode: boolean,
): VbenFormSchema[] {
  const resultOptions = getDictOptions(
    DICT_TYPE.HRM_RECRUIT_INTERVIEW_RESULT,
    'number',
  ).filter(
    (item) =>
      item.value === HrmRecruitInterviewResult.PASS ||
      item.value === HrmRecruitInterviewResult.NOT_PASS,
  );
  return [
    {
      fieldName: 'result',
      label: '面试结果',
      component: 'Select',
      rules: 'required',
      dependencies: {
        triggerFields: [''],
        show: () => !cancelMode,
      },
      componentProps: {
        options: resultOptions,
        placeholder: '请选择面试结果',
        allowClear: true,
      },
    },
    {
      fieldName: 'cancelReason',
      label: '取消原因',
      component: 'Textarea',
      rules: 'required',
      dependencies: {
        triggerFields: ['result'],
        show: (values) =>
          cancelMode || values.result === HrmRecruitInterviewResult.CANCELED,
      },
      componentProps: {
        placeholder: '请输入取消原因',
        rows: 3,
        maxlength: 255,
        showCount: true,
      },
    },
    {
      fieldName: 'evaluate',
      label: '面试评价',
      component: 'Textarea',
      dependencies: {
        triggerFields: ['result'],
        show: (values) =>
          !cancelMode && values.result !== HrmRecruitInterviewResult.CANCELED,
      },
      componentProps: {
        placeholder: '请输入面试评价',
        rows: 4,
        maxlength: 255,
        showCount: true,
      },
    },
  ];
}

/** 批量流转表单 */
export function useStatusBatchFormSchema(
  sourceStatus?: number,
): VbenFormSchema[] {
  const statusTransitionMap: Partial<Record<number, number[]>> = {
    [HrmRecruitCandidateStatus.NEW]: [
      HrmRecruitCandidateStatus.PRIMARY_PASS,
      HrmRecruitCandidateStatus.INTERVIEW_PASS,
    ],
    [HrmRecruitCandidateStatus.PRIMARY_PASS]: [
      HrmRecruitCandidateStatus.NEW,
      HrmRecruitCandidateStatus.INTERVIEW_PASS,
    ],
    [HrmRecruitCandidateStatus.INTERVIEW_PASS]: [
      HrmRecruitCandidateStatus.OFFER_SENT,
      HrmRecruitCandidateStatus.NEW,
      HrmRecruitCandidateStatus.PRIMARY_PASS,
    ],
    [HrmRecruitCandidateStatus.ELIMINATED]: [HrmRecruitCandidateStatus.NEW],
  };
  const statusValues = sourceStatus
    ? statusTransitionMap[sourceStatus] || []
    : [];
  const statusOptions = getDictOptions(
    DICT_TYPE.HRM_RECRUIT_CANDIDATE_STATUS,
    'number',
  ).filter((item) => statusValues.includes(Number(item.value)));
  return [
    {
      fieldName: 'candidateCount',
      label: '候选人数',
      component: 'Input',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'status',
      label: '目标状态',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: statusOptions,
        placeholder: '请选择目标状态',
        allowClear: true,
      },
    },
  ];
}

/** 批量修改职位表单 */
export function usePostBatchFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'candidateCount',
      label: '候选人数',
      component: 'Input',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'postId',
      label: '应聘职位',
      component: 'ApiSelect',
      rules: 'required',
      componentProps: {
        api: getRecruitPostSimpleList,
        labelField: 'postName',
        valueField: 'id',
        placeholder: '请选择应聘职位',
        allowClear: false,
        showSearch: true,
      },
    },
  ];
}

/** 批量修改渠道表单 */
export function useChannelBatchFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'candidateCount',
      label: '候选人数',
      component: 'Input',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'channelId',
      label: '招聘渠道',
      component: 'ApiSelect',
      rules: 'required',
      componentProps: {
        api: getRecruitChannelSimpleList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择招聘渠道',
        allowClear: false,
        showSearch: true,
      },
    },
  ];
}

/** 淘汰表单 */
export function useEliminateFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'candidateLabel',
      label: '候选人',
      component: 'Input',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'eliminate',
      label: '淘汰原因',
      component: 'ApiSelect',
      rules: 'required',
      componentProps: {
        api: getRecruitEliminateReasonList,
        afterFetch: (list: string[]) => {
          const options: { label: string; value: string }[] = [];
          for (const reason of list || []) {
            options.push({ label: reason, value: reason });
          }
          return options;
        },
        labelField: 'label',
        valueField: 'value',
        mode: 'tags',
        placeholder: '请选择或输入淘汰原因',
        allowClear: true,
        showSearch: true,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
        maxlength: 255,
        showCount: true,
      },
    },
  ];
}

/** 一键清理表单 */
export function useCleanFormSchema(): VbenFormSchema[] {
  const cleanStatuses: number[] = [
    HrmRecruitCandidateStatus.NEW,
    HrmRecruitCandidateStatus.PRIMARY_PASS,
    HrmRecruitCandidateStatus.INTERVIEW,
    HrmRecruitCandidateStatus.INTERVIEW_PASS,
  ];
  const cleanStatusOptions = getDictOptions(
    DICT_TYPE.HRM_RECRUIT_CANDIDATE_STATUS,
    'number',
  ).filter((item) => cleanStatuses.includes(Number(item.value)));
  return [
    {
      fieldName: 'statuses',
      label: '候选人状态',
      component: 'Select',
      rules: 'required',
      defaultValue: [...cleanStatuses],
      componentProps: {
        options: cleanStatusOptions,
        mode: 'multiple',
        placeholder: '请选择候选人状态',
        allowClear: true,
      },
    },
    {
      fieldName: 'days',
      label: '状态持续天数',
      component: 'Select',
      rules: 'required',
      defaultValue: 30,
      componentProps: {
        options: [3, 5, 7, 15, 30, 45].map((days) => ({
          label: `${days} 天`,
          value: days,
        })),
        placeholder: '请选择持续天数',
        allowClear: true,
      },
    },
  ];
}
