import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeLibraryApi } from '#/api/pms/kb/library';
import type { PmsKnowledgeGroupApi } from '#/api/pms/kb/library/group';
import type { PmsKnowledgeLibraryMemberApi } from '#/api/pms/kb/library/member';

import { markRaw } from 'vue';

import { z } from '#/adapter/form';
import { ImageUpload } from '#/components/upload';
import { PmsKnowledgeLibraryMemberLevel } from '#/views/pms/kb/utils/constants';
import { UserSelect } from '#/views/system/user/components';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '知识库名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入知识库名称',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsKnowledgeLibraryApi.KnowledgeLibrary>['columns'] {
  return [
    {
      field: 'name',
      title: '知识库',
      minWidth: 260,
      slots: { default: 'name' },
    },
    {
      field: 'openStatus',
      title: '可见范围',
      width: 100,
      align: 'center',
      slots: { default: 'openStatus' },
    },
    {
      field: 'memberCount',
      title: '成员',
      width: 90,
      align: 'center',
    },
    {
      field: 'documentCount',
      title: '文档数',
      width: 90,
      align: 'center',
    },
    {
      field: 'fileCount',
      title: '文件数',
      width: 90,
      align: 'center',
    },
    {
      field: 'creatorUserName',
      title: '创建人',
      width: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      // TODO @AI：对齐 system user，用 formatter: 'formatDateTime'，不要 slots；index.vue 里对应 slot 删掉。
      slots: { default: 'createTime' },
    },
    {
      field: 'favoriteStatus',
      title: '是否关注',
      width: 100,
      align: 'center',
      fixed: 'right',
      slots: { default: 'favoriteStatus' },
    },
    {
      title: '操作',
      width: 280,
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 成员列表的字段 */
export function useMemberGridColumns(): VxeTableGridOptions<PmsKnowledgeLibraryMemberApi.KnowledgeLibraryMember>['columns'] {
  return [
    {
      field: 'identityType',
      title: '类型',
      width: 100,
      slots: { default: 'identityType' },
    },
    {
      title: '成员',
      minWidth: 260,
      slots: { default: 'member' },
    },
    {
      field: 'level',
      title: '角色',
      width: 160,
      slots: { default: 'level' },
    },
    {
      title: '操作',
      width: 80,
      align: 'center',
      slots: { default: 'action' },
    },
  ];
}

/** 成员表单的可编辑成员 */
export interface EditableMember
  extends PmsKnowledgeLibraryMemberApi.KnowledgeLibraryMember {
  identityType: 'dept' | 'user';
}

/** 成员表单的成员类型选项 */
export function useMemberIdentityTypeOptions() {
  return [
    { label: '成员', value: 'user' },
    { label: '部门', value: 'dept' },
  ];
}

/** 成员表单的成员角色选项 */
export function useMemberLevelOptions() {
  return [
    { label: '管理员', value: PmsKnowledgeLibraryMemberLevel.ADMIN },
    { label: '普通成员', value: PmsKnowledgeLibraryMemberLevel.MEMBER },
  ];
}

/** 成员表单的新增成员默认值 */
export function createEditableMember(): EditableMember {
  return {
    id: 0,
    identityType: 'user',
    level: PmsKnowledgeLibraryMemberLevel.MEMBER,
  };
}

/** 分组管理列表的字段 */
export function useKnowledgeGroupGridColumns(): VxeTableGridOptions<PmsKnowledgeGroupApi.KnowledgeGroup>['columns'] {
  return [
    {
      dragSort: true,
      title: '',
      width: 60,
    },
    {
      field: 'name',
      title: '分组名称',
      minWidth: 220,
    },
    {
      title: '操作',
      width: 140,
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}

/** 新增/修改的表单 */
export function useLibraryFormSchema(currentUserId?: number): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'id',
    },
    {
      component: 'Input',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'templateId',
    },
    {
      component: 'InputNumber',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'creatorUserId',
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 50,
        placeholder: '请输入知识库名称',
        showWordLimit: true,
      },
      defaultValue: '',
      fieldName: 'name',
      label: '知识库名称',
      rules: z
        .string({ message: '请输入知识库名称' })
        .min(1, '请输入知识库名称'),
    },
    {
      component: markRaw(ImageUpload),
      componentProps: {
        limit: 1,
      },
      fieldName: 'coverUrl',
      label: '知识库封面',
    },
    {
      component: 'Textarea',
      componentProps: {
        type: 'textarea',
        maxlength: 300,
        placeholder: '请输入知识库简介',
        rows: 4,
        showWordLimit: true,
      },
      defaultValue: '',
      fieldName: 'description',
      label: '知识库简介',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '私有：只有知识库成员可以查看', value: false },
          { label: '公开：所有人可以查看，成员可以协作', value: true },
        ],
      },
      defaultValue: false,
      dependencies: {
        // 修改时只有创建人可以调整可见范围
        componentProps: (values) => ({
          disabled: !!values.id && values.creatorUserId !== currentUserId,
        }),
        triggerFields: ['id', 'creatorUserId'],
      },
      fieldName: 'openStatus',
      label: '可见范围',
      rules: z.boolean({ message: '请选择可见范围' }),
    },
    {
      component: markRaw(UserSelect),
      componentProps: {
        disabledIds: currentUserId === undefined ? [] : [currentUserId],
        multiple: true,
        placeholder: '请选择初始管理员',
      },
      defaultValue: [],
      dependencies: {
        show: (values) => !values.id,
        triggerFields: ['id'],
      },
      description: '可管理知识库信息和成员；创建人由系统自动加入',
      fieldName: 'adminUserIds',
      label: '初始管理员',
    },
    {
      component: markRaw(UserSelect),
      componentProps: {
        disabledIds: currentUserId === undefined ? [] : [currentUserId],
        multiple: true,
        placeholder: '请选择普通成员',
      },
      defaultValue: [],
      dependencies: {
        show: (values) => !values.id,
        triggerFields: ['id'],
      },
      description: '可参与内容协作，具体能力受文档权限控制',
      fieldName: 'memberUserIds',
      label: '普通成员',
    },
  ];
}
