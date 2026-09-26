import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { Tinymce as RichTextarea } from '#/components/tinymce';
import IterationSelect from '#/views/pms/pm/iteration/components/iteration-select.vue';
import ProjectMemberSelect from '#/views/pms/pm/project/components/project-member-select.vue';
import {
  PmsProjectType,
  PmsWorkItemLifecycleStatus,
  PmsWorkItemPriority,
  PmsWorkItemType,
} from '#/views/pms/pm/utils/constants';

import WorkItemSelect from '../components/work-item-select.vue';
import WorkItemLabelSelect from '../label/work-item-label-select.vue';

/** 工作项列表和看板共用的筛选表单 */
export function useWorkItemSearchFormSchema(options: any): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '标题',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: options.namePlaceholder || '请输入工作项标题',
      },
    },
    ...(options.showTypes
      ? [
          {
            fieldName: 'types',
            label: '事项类型',
            component: 'Select',
            componentProps: {
              allowClear: true,
              maxTagCount: 'responsive',
              mode: 'multiple',
              options: [
                ...(options.projectType === PmsProjectType.AGILE
                  ? [
                      {
                        label: '需求',
                        value: PmsWorkItemType.REQUIREMENT,
                      },
                    ]
                  : []),
                { label: '任务', value: PmsWorkItemType.TASK },
                ...(options.projectType === PmsProjectType.AGILE
                  ? [{ label: '缺陷', value: PmsWorkItemType.DEFECT }]
                  : []),
              ],
              placeholder: '全部类型',
            },
          },
        ]
      : []),
    ...(options.showLifecycle
      ? [
          {
            fieldName: 'lifecycleStatus',
            label: '数据范围',
            component: 'RadioGroup',
            componentProps: {
              optionType: 'button',
              options: [
                {
                  label: '当前',
                  value: PmsWorkItemLifecycleStatus.ACTIVE,
                },
                {
                  label: '已归档',
                  value: PmsWorkItemLifecycleStatus.ARCHIVED,
                },
                {
                  label: '回收站',
                  value: PmsWorkItemLifecycleStatus.RECYCLED,
                },
              ],
            },
            defaultValue: PmsWorkItemLifecycleStatus.ACTIVE,
          },
        ]
      : []),
    {
      fieldName: 'statuses',
      label: '语义状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        maxTagCount: 'responsive',
        mode: 'multiple',
        options: getDictOptions(
          DICT_TYPE.PMS_WORK_ITEM_STATUS_TYPE,
          'number',
        ).map((item) => ({
          label: item.label,
          value: item.value,
        })),
        placeholder: '全部状态',
      },
    },
    {
      fieldName: 'priorities',
      label: '优先级',
      component: 'Select',
      componentProps: {
        allowClear: true,
        maxTagCount: 'responsive',
        mode: 'multiple',
        options: getDictOptions(DICT_TYPE.PMS_WORK_ITEM_PRIORITY, 'number').map(
          (item) => ({
            label: item.label,
            value: item.value,
          }),
        ),
        placeholder: '全部优先级',
      },
    },
    ...(options.projectType === PmsProjectType.AGILE && !options.iterationId
      ? [
          {
            fieldName: 'iterationIds',
            label: '所属迭代',
            component: markRaw(IterationSelect),
            componentProps: {
              multiple: true,
              projectId: options.projectId,
              placeholder: '全部迭代',
            },
          },
          {
            fieldName: 'excludedIterationIds',
            label: '排除迭代',
            component: markRaw(IterationSelect),
            componentProps: {
              multiple: true,
              projectId: options.projectId,
              placeholder: '不显示所选迭代',
            },
          },
        ]
      : []),
    {
      fieldName: 'assigneeUserIds',
      label: '负责人',
      component: markRaw(ProjectMemberSelect),
      componentProps: {
        multiple: true,
        projectId: options.projectId,
        placeholder: '全部负责人',
      },
      defaultValue: options.assigneeUserIds,
    },
    {
      fieldName: 'labelIds',
      label: '标签',
      component: markRaw(WorkItemLabelSelect),
      componentProps: {
        multiple: true,
        placeholder: '全部标签',
      },
    },
    ...(options.showUnplanned && !options.iterationId
      ? [
          {
            fieldName: 'unplannedOnly',
            label: '只看未规划',
            component: 'Switch',
            defaultValue: false,
          },
        ]
      : []),
  ];
}

/** 工作项导入的表单 */
export function useWorkItemImportFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'file',
      label: '工作项数据',
      component: 'Upload',
      rules: 'required',
      help: '仅允许导入 xls、xlsx 格式文件',
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsWorkItemApi.WorkItem>['columns'] {
  return [
    {
      field: 'serialNumber',
      title: '编号',
      width: 90,
      slots: { default: 'serialNumber' },
    },
    {
      field: 'type',
      title: '类型',
      width: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PMS_WORK_ITEM_TYPE },
      },
    },
    {
      field: 'name',
      title: '标题',
      minWidth: 240,
      slots: { default: 'name' },
    },
    {
      field: 'statusName',
      title: '状态',
      width: 120,
    },
    {
      field: 'priority',
      title: '优先级',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PMS_WORK_ITEM_PRIORITY },
      },
    },
    {
      field: 'assigneeUserName',
      title: '负责人',
      width: 110,
    },
    {
      field: 'iterationName',
      title: '所属迭代',
      minWidth: 130,
    },
    {
      field: 'progress',
      title: '进度',
      width: 140,
      slots: { default: 'progress' },
    },
    {
      field: 'endTime',
      title: '截止时间',
      width: 180,
      formatter: 'formatDateTime',
    },
  ];
}

/** 工作项列表的字段 */
export function useWorkItemGridColumns(
  type: number,
  projectType: number,
): VxeTableGridOptions<PmsWorkItemApi.WorkItem>['columns'] {
  const workItemTypeName =
    getDictLabel(DICT_TYPE.PMS_WORK_ITEM_TYPE, type) || '-';
  return [
    {
      field: 'serialNumber',
      title: `${workItemTypeName}编号`,
      width: 100,
      slots: { default: 'serialNumber' },
    },
    {
      field: 'name',
      title: `${workItemTypeName}标题`,
      minWidth: 220,
      slots: { default: 'name' },
    },
    {
      field: 'priority',
      title: '优先级',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PMS_WORK_ITEM_PRIORITY },
      },
    },
    {
      field: 'statusId',
      title: '状态',
      minWidth: 140,
      slots: { default: 'status' },
    },
    {
      field: 'assigneeUserName',
      title: '负责人',
      minWidth: 110,
    },
    {
      field: 'labels',
      title: '标签',
      minWidth: 150,
      slots: { default: 'labels' },
    },
    ...(projectType === PmsProjectType.AGILE
      ? [
          {
            field: 'iterationName',
            title: '所属迭代',
            minWidth: 130,
          },
        ]
      : []),
    {
      field: 'progress',
      title: '进度',
      width: 150,
      slots: { default: 'progress' },
    },
    {
      field: 'endTime',
      title: '截止时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right' as const,
      slots: { default: 'actions' },
    },
  ];
}

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
        allowClear: true,
        placeholder: '请选择开始时间',
        showTime: true,
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
        allowClear: true,
        placeholder: '请选择截止时间',
        showTime: true,
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
