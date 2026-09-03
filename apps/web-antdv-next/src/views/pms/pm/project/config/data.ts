import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectAnnouncementApi } from '#/api/pms/pm/project/announcement';
import type { PmsProjectMemberApi } from '#/api/pms/pm/project/member';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { PmsProjectMemberLevel } from '#/views/pms/pm/utils/constants';
import { UserSelect } from '#/views/system/user/components';

/** 列表的字段 */
export function useAnnouncementColumns(
  editable: boolean,
): VxeTableGridOptions<PmsProjectAnnouncementApi.ProjectAnnouncement>['columns'] {
  return [
    {
      align: 'left',
      field: 'content',
      title: '公告内容',
      width: 360,
      slots: { default: 'content' },
    },
    {
      field: 'fileUrls',
      title: '附件',
      width: 110,
      slots: { default: 'fileUrls' },
    },
    {
      align: 'left',
      field: 'creatorUserName',
      title: '发布人',
      width: 140,
    },
    {
      align: 'left',
      field: 'createTime',
      title: '发布时间',
      width: 180,
      // TODO @AI：对齐 system user，用 formatter: 'formatDateTime'，不要 slots。
      formatter: 'formatDateTime',
    },
    ...(editable
      ? [
          {
            field: 'action',
            fixed: 'right' as const,
            title: '操作',
            width: 120,
            slots: { default: 'action' },
          },
        ]
      : []),
  ];
}

/** 新增/修改公告的表单 */
export function useAnnouncementFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'projectId',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'content',
      label: '公告内容',
      component: 'TextArea',
      componentProps: {
        maxlength: 5000,
        placeholder: '请输入公告内容',
        rows: 6,
        showCount: true,
      },
      rules: z.string().min(1, '公告内容不能为空'),
    },
    {
      fieldName: 'fileUrls',
      label: '附件',
      component: 'FileUpload',
      componentProps: {
        accept: ['doc', 'xls', 'ppt', 'txt', 'pdf'],
        maxNumber: 5,
        maxSize: 5,
      },
      rules: z.array(z.string()).default([]),
    },
  ];
}

/** 工作项协作配置项 */
export interface PmsWorkItemConfiguration {
  type: number;
  name: string;
  projectTypeName: string;
  description: string;
}

/** 列表的字段 */
export function useCollaborationConfigColumns(): VxeTableGridOptions<PmsWorkItemConfiguration>['columns'] {
  return [
    {
      field: 'name',
      title: '事项类型',
      width: 180,
    },
    {
      field: 'projectTypeName',
      title: '适用项目',
      width: 220,
    },
    {
      field: 'description',
      title: '说明',
      minWidth: 240,
    },
    {
      align: 'center',
      field: 'action',
      fixed: 'right',
      title: '操作',
      width: 120,
      slots: { default: 'action' },
    },
  ];
}

/** 新增/修改成员的表单 */
export function useProjectMemberFormSchema(
  getDisabledUserIds: () => number[],
): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'memberId',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'userIds',
      label: '项目成员',
      component: markRaw(UserSelect),
      componentProps: () => ({
        disabledIds: getDisabledUserIds(),
        multiple: true,
        placeholder: '请选择需要加入项目的用户',
      }),
      dependencies: {
        triggerFields: ['memberId'],
        show: (values) => !values.memberId,
      },
      rules: z.array(z.number()).min(1, '请选择项目成员'),
    },
    {
      fieldName: 'member',
      label: '项目成员',
      component: 'Input',
      dependencies: {
        triggerFields: ['memberId'],
        show: (values) => !!values.memberId,
      },
    },
    {
      fieldName: 'level',
      label: '权限级别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.PMS_PROJECT_MEMBER_LEVEL,
          'number',
        ).filter((option) => option.value !== PmsProjectMemberLevel.OWNER),
        placeholder: '请选择权限级别',
      },
      defaultValue: PmsProjectMemberLevel.WRITE,
      rules: 'selectRequired',
    },
  ];
}

/** 成员列表的字段 */
export function useProjectMemberGridColumns(
  showAction: boolean,
): VxeTableGridOptions<PmsProjectMemberApi.ProjectMember>['columns'] {
  return [
    {
      field: 'nickname',
      title: '成员',
      width: 200,
      slots: { default: 'nickname' },
    },
    {
      field: 'level',
      title: '项目级别',
      width: 160,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PMS_PROJECT_MEMBER_LEVEL },
      },
    },
    ...(showAction
      ? [
          {
            align: 'center' as const,
            field: 'action',
            fixed: 'right' as const,
            title: '操作',
            width: 140,
            slots: { default: 'action' },
          },
        ]
      : []),
  ];
}
