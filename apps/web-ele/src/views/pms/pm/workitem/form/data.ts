import type { VbenFormSchema } from '#/adapter/form';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { Tinymce as RichTextarea } from '#/components/tinymce';
import IterationSelect from '#/views/pms/pm/iteration/components/iteration-select.vue';
import ProjectMemberSelect from '#/views/pms/pm/project/components/project-member-select.vue';
import {
  PmsProjectType,
  PmsWorkItemPriority,
  PmsWorkItemType,
} from '#/views/pms/pm/utils/constants';

import WorkItemSelect from '../components/work-item-select.vue';

/** 校验工作项时间范围：开始时间必须早于截止时间 */
function validateWorkItemTimeRange(startTime: unknown, endTime: unknown) {
  return z
    .any()
    .refine(
      () => !startTime || !endTime || Number(startTime) < Number(endTime),
      '开始时间必须早于截止时间',
    )
    .optional();
}

/** 新增/修改工作项的表单 */
export function useWorkItemFormSchema(
  workItemTypeName: string,
): VbenFormSchema[] {
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
      component: 'InputNumber',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'projectId',
    },
    {
      component: 'InputNumber',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'type',
    },
    {
      component: 'InputNumber',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'projectType',
    },
    {
      component: 'Input',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'formType',
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: `请输入${workItemTypeName}标题`,
      },
      defaultValue: '',
      fieldName: 'name',
      formItemClass: 'col-span-2',
      label: `${workItemTypeName}标题`,
      rules: z
        .string({ message: `${workItemTypeName}标题不能为空` })
        .min(1, `${workItemTypeName}标题不能为空`),
    },
    {
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.PMS_WORK_ITEM_PRIORITY, 'number'),
      },
      defaultValue: PmsWorkItemPriority.MEDIUM,
      fieldName: 'priority',
      formItemClass: 'col-span-1',
      label: '优先级',
      rules: z.number({ message: '优先级不能为空' }),
    },
    {
      component: markRaw(ProjectMemberSelect),
      dependencies: {
        componentProps: (values) => ({
          projectId: values.projectId,
        }),
        triggerFields: ['projectId'],
      },
      fieldName: 'assigneeUserId',
      formItemClass: 'col-span-1',
      label: '负责人',
    },
    {
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        placeholder: '请选择开始时间',
        type: 'datetime',
        valueFormat: 'x',
      },
      dependencies: {
        rules: (values) =>
          validateWorkItemTimeRange(values.startTime, values.endTime),
        triggerFields: ['startTime', 'endTime'],
      },
      fieldName: 'startTime',
      formItemClass: 'col-span-1',
      label: '开始时间',
    },
    {
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        placeholder: '请选择截止时间',
        type: 'datetime',
        valueFormat: 'x',
      },
      dependencies: {
        rules: (values) =>
          validateWorkItemTimeRange(values.startTime, values.endTime),
        triggerFields: ['startTime', 'endTime'],
      },
      fieldName: 'endTime',
      formItemClass: 'col-span-1',
      label: '截止时间',
    },
    {
      component: markRaw(IterationSelect),
      dependencies: {
        componentProps: (values) => ({
          projectId: values.projectId,
        }),
        if: (values) => values.projectType === PmsProjectType.AGILE,
        triggerFields: ['projectId', 'projectType'],
      },
      fieldName: 'iterationId',
      formItemClass: 'col-span-1',
      label: '所属迭代',
    },
    {
      component: markRaw(WorkItemSelect),
      componentProps: {
        placeholder: '请选择父级工作项',
      },
      dependencies: {
        componentProps: (values) => ({
          excludeId: values.id,
          projectId: values.projectId,
          type: values.type,
        }),
        triggerFields: ['id', 'projectId', 'type'],
      },
      fieldName: 'parentId',
      formItemClass: 'col-span-1',
      label: '父级工作项',
    },
    {
      component: markRaw(WorkItemSelect),
      componentProps: {
        placeholder: '请选择关联需求',
        type: PmsWorkItemType.REQUIREMENT,
      },
      dependencies: {
        componentProps: (values) => ({
          projectId: values.projectId,
        }),
        if: (values) =>
          values.projectType === PmsProjectType.AGILE &&
          values.type !== PmsWorkItemType.REQUIREMENT,
        triggerFields: ['projectId', 'projectType', 'type'],
      },
      fieldName: 'relatedRequirementId',
      formItemClass: 'col-span-1',
      label: '关联需求',
    },
    {
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.PMS_WORK_ITEM_DEFECT_TYPE, 'number'),
      },
      dependencies: {
        if: (values) =>
          values.projectType === PmsProjectType.AGILE &&
          values.type === PmsWorkItemType.DEFECT,
        rules: (values) =>
          values.type === PmsWorkItemType.DEFECT
            ? z.number({ message: '缺陷类型不能为空' })
            : null,
        triggerFields: ['projectType', 'type'],
      },
      fieldName: 'defectType',
      formItemClass: 'col-span-1',
      label: '缺陷类型',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        placeholder: '请输入预估工时',
      },
      fieldName: 'estimatedHours',
      formItemClass: 'col-span-1',
      label: '预估工时',
    },
    {
      component: 'InputNumber',
      componentProps: {
        max: 100,
        min: 0,
      },
      defaultValue: 0,
      fieldName: 'progress',
      formItemClass: 'col-span-1',
      label: '完成进度',
    },
    {
      component: markRaw(ProjectMemberSelect),
      componentProps: {
        multiple: true,
      },
      defaultValue: [],
      dependencies: {
        componentProps: (values) => ({
          projectId: values.projectId,
        }),
        triggerFields: ['projectId'],
      },
      fieldName: 'memberUserIds',
      formItemClass: 'col-span-2',
      label: '参与人',
    },
    {
      component: 'Input',
      defaultValue: [],
      fieldName: 'labelIds',
      formItemClass: 'col-span-2',
      label: '标签',
    },
    {
      component: markRaw(RichTextarea),
      componentProps: {
        height: '240px',
      },
      fieldName: 'description',
      formItemClass: 'col-span-2',
      label: `${workItemTypeName}描述`,
    },
    {
      component: 'FileUpload',
      componentProps: {
        accept: ['doc', 'xls', 'ppt', 'txt', 'pdf'],
        maxNumber: 5,
        maxSize: 5,
      },
      defaultValue: [],
      fieldName: 'fileUrls',
      formItemClass: 'col-span-2',
      label: '附件',
    },
    {
      component: 'Input',
      defaultValue: [],
      dependencies: {
        if: (values) => values.formType === 'create',
        triggerFields: ['formType'],
      },
      fieldName: 'childWorkItemNames',
      formItemClass: 'col-span-2',
      label: '子工作项',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 1,
        placeholder: '请输入实际投入工时',
      },
      dependencies: {
        if: (values) => values.formType === 'create',
        triggerFields: ['formType'],
      },
      fieldName: 'actualHours',
      formItemClass: 'col-span-1',
      label: '实际投入',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        placeholder: '请输入剩余工时',
      },
      dependencies: {
        if: (values) => values.formType === 'create',
        triggerFields: ['formType'],
      },
      fieldName: 'remainingHours',
      formItemClass: 'col-span-1',
      label: '剩余工时',
    },
  ];
}
