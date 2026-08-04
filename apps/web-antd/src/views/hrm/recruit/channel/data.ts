import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmRecruitChannelApi } from '#/api/hrm/recruit/channel';

import { markRaw } from 'vue';

import { z } from '@vben/common-ui';
import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import ChannelSelect from './components/channel-select.vue';

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '渠道名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入渠道名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
        allowClear: true,
      },
    },
  ];
}

/** 列表字段 */
export function useGridColumns(
  onStatusChange?: (
    newStatus: number,
    row: HrmRecruitChannelApi.RecruitChannel,
  ) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions<HrmRecruitChannelApi.RecruitChannel>['columns'] {
  return [
    { field: 'id', title: '渠道编号', width: 120 },
    { field: 'name', title: '渠道名称', minWidth: 160 },
    {
      field: 'systemFlag',
      title: '系统内置',
      width: 100,
      align: 'center',
      slots: { default: 'systemFlag' },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      align: 'center',
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: 'CellSwitch',
        props: {
          checkedValue: CommonStatusEnum.ENABLE,
          unCheckedValue: CommonStatusEnum.DISABLE,
        },
      },
    },
    { field: 'sort', title: '排序', width: 90 },
    { field: 'remark', title: '备注', minWidth: 180 },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 140,
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
      fieldName: 'systemFlag',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '渠道名称',
      component: 'Input',
      rules: 'required',
      dependencies: {
        triggerFields: ['systemFlag'],
        disabled: (values) => !!values.systemFlag,
      },
      componentProps: {
        placeholder: '请输入渠道名称',
        maxlength: 255,
        allowClear: true,
      },
    },
    {
      fieldName: 'sort',
      label: '显示顺序',
      component: 'InputNumber',
      rules: z.number().min(0, { message: '显示顺序不能小于 0' }).default(0),
      componentProps: {
        placeholder: '请输入显示顺序',
        min: 0,
        class: 'w-full',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        maxlength: 500,
        rows: 3,
        allowClear: true,
      },
    },
  ];
}

/** 删除表单 */
export function useDeleteFormSchema(): VbenFormSchema[] {
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
      fieldName: 'channelName',
      label: '删除渠道',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'transferChannelId',
      label: '承接渠道',
      component: markRaw(ChannelSelect),
      rules: 'required',
      dependencies: {
        triggerFields: ['id'],
        componentProps: (values) => ({
          excludeIds: values.id ? [values.id] : [],
          placeholder: '请选择承接渠道',
          allowClear: true,
          showSearch: true,
        }),
      },
    },
  ];
}
