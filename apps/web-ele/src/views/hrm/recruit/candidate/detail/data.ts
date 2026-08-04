import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmRecruitInterviewApi } from '#/api/hrm/recruit/interview';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { DictTag } from '#/components/dict-tag';

/** 详情页头部字段 */
export function useHeaderSchema(): DescriptionItemSchema[] {
  return [
    { field: 'postName', label: '应聘职位' },
    { field: 'deptName', label: '用人部门' },
    { field: 'ownerEmployeeName', label: '招聘负责人' },
    { field: 'channelName', label: '招聘渠道' },
    {
      field: 'interviewTime',
      label: '当前面试',
      render: (val) => (val ? (formatDateTime(val) as string) : '-'),
    },
  ];
}

/** 详细资料 - 候选人信息 */
export function useCandidateInfoSchema(): DescriptionItemSchema[] {
  return [
    { field: 'name', label: '候选人姓名' },
    { field: 'mobile', label: '手机号码' },
    {
      field: 'sex',
      label: '性别',
      render: (val) =>
        val === undefined || val === null
          ? '-'
          : h(DictTag, { type: DICT_TYPE.SYSTEM_USER_SEX, value: val }),
    },
    {
      field: 'age',
      label: '年龄',
      render: (val) => (val === undefined || val === null ? '-' : String(val)),
    },
    { field: 'email', label: '邮箱' },
    {
      field: 'workTime',
      label: '工作年限',
      render: (val) => (val === undefined || val === null ? '-' : `${val} 年`),
    },
    {
      field: 'education',
      label: '学历',
      render: (val) =>
        val === undefined || val === null
          ? '-'
          : h(DictTag, {
              type: DICT_TYPE.HRM_RECRUIT_CANDIDATE_EDUCATION,
              value: val,
            }),
    },
    { field: 'graduateSchool', label: '毕业院校' },
    { field: 'latestWorkPlace', label: '最近工作单位' },
    { field: 'remark', label: '备注', span: 4 },
  ];
}

/** 详细资料 - 招聘信息 */
export function useRecruitInfoSchema(): DescriptionItemSchema[] {
  return [
    { field: 'postName', label: '应聘职位' },
    { field: 'deptName', label: '用人部门' },
    { field: 'ownerEmployeeName', label: '招聘负责人' },
    { field: 'channelName', label: '招聘渠道' },
    {
      field: 'status',
      label: '候选人状态',
      render: (val) =>
        val === undefined || val === null
          ? '-'
          : h(DictTag, {
              type: DICT_TYPE.HRM_RECRUIT_CANDIDATE_STATUS,
              value: val,
            }),
    },
    {
      field: 'stageNumber',
      label: '面试轮次',
      render: (val) => (val === undefined || val === null ? '0' : String(val)),
    },
    {
      field: 'statusUpdateTime',
      label: '状态更新时间',
      render: (val) => (val ? (formatDateTime(val) as string) : '-'),
    },
    {
      field: 'entryTime',
      label: '入职时间',
      render: (val) => (val ? (formatDateTime(val) as string) : '-'),
    },
    { field: 'eliminate', label: '淘汰原因', span: 2 },
    { field: 'creatorName', label: '创建人' },
    {
      field: 'createTime',
      label: '创建时间',
      render: (val) => (val ? (formatDateTime(val) as string) : '-'),
    },
  ];
}

/** 面试记录表格列 */
export function useInterviewColumns(): VxeTableGridOptions<HrmRecruitInterviewApi.RecruitInterview>['columns'] {
  return [
    { field: 'stageNumber', title: '面试轮次', width: 100 },
    {
      field: 'type',
      title: '面试方式',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_RECRUIT_INTERVIEW_TYPE },
      },
    },
    { field: 'interviewEmployeeName', title: '主面试官', minWidth: 120 },
    {
      field: 'otherInterviewEmployeeNames',
      title: '其他面试官',
      minWidth: 160,
      formatter: ({ cellValue }) =>
        Array.isArray(cellValue) && cellValue.length > 0
          ? cellValue.join('、')
          : '-',
    },
    {
      field: 'interviewTime',
      title: '面试时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    { field: 'address', title: '面试地址', minWidth: 160 },
    {
      field: 'result',
      title: '面试结果',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_RECRUIT_INTERVIEW_RESULT },
      },
    },
    { field: 'evaluate', title: '面试评价', minWidth: 180 },
    { field: 'cancelReason', title: '取消原因', minWidth: 160 },
    { field: 'remark', title: '备注', minWidth: 160 },
  ];
}
