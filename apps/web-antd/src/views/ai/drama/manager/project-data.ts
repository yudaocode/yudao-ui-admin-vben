import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { useAccess } from '@vben/access';
import { AiDramaStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';
import { DRAMA_ASPECT_RATIOS } from '#/views/ai/utils/drama';

/** 项目列表的搜索表单 */
export function useProjectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        labelField: 'nickname',
        valueField: 'id',
        placeholder: '请选择用户',
        allowClear: true,
        showSearch: true,
        optionFilterProp: 'label',
      },
    },
    {
      fieldName: 'name',
      label: '项目名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入项目名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '项目状态',
      component: 'Select',
      componentProps: {
        placeholder: '请选择项目状态',
        allowClear: true,
        options: getDictOptions(DICT_TYPE.AI_DRAMA_PROJECT_STATUS, 'number'),
      },
    },
    {
      fieldName: 'composeStatus',
      label: '成片状态',
      component: 'Select',
      componentProps: {
        placeholder: '请选择成片状态',
        allowClear: true,
        options: getDictOptions(DICT_TYPE.AI_DRAMA_STATUS, 'number'),
      },
    },
    {
      fieldName: 'publicStatus',
      label: '是否公开',
      component: 'Select',
      componentProps: {
        placeholder: '请选择是否公开',
        allowClear: true,
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
      },
    },
    {
      fieldName: 'aspectRatio',
      label: '画幅',
      component: 'Select',
      componentProps: {
        placeholder: '请选择画幅',
        allowClear: true,
        options: DRAMA_ASPECT_RATIOS.map((item) => ({
          label: item,
          value: item,
        })),
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 项目列表的字段 */
export function useProjectGridColumns(
  onPublicStatusChange?: (
    newStatus: boolean,
    row: AiDramaProjectApi.Project,
  ) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions<AiDramaProjectApi.Project>['columns'] {
  const { hasAccessByCodes } = useAccess();
  return [
    {
      field: 'id',
      title: '编号',
      width: 90,
      fixed: 'left',
    },
    {
      field: 'name',
      title: '项目名称',
      minWidth: 160,
    },
    {
      field: 'userNickname',
      title: '用户',
      minWidth: 120,
    },
    {
      field: 'style',
      title: '画风',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.AI_DRAMA_STYLE },
      },
    },
    {
      field: 'composeAspectRatio',
      title: '画幅',
      width: 80,
    },
    {
      field: 'status',
      title: '项目状态',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.AI_DRAMA_PROJECT_STATUS },
      },
    },
    {
      field: 'storyboardCount',
      title: '镜头',
      width: 90,
      formatter: ({ row }) =>
        `${row.storyboardSuccessCount || 0} / ${row.storyboardCount || 0}`,
    },
    {
      field: 'composeStatus',
      title: '成片',
      width: 140,
      slots: { default: 'compose' },
    },
    {
      field: 'publicStatus',
      title: '是否公开',
      width: 100,
      align: 'center',
      cellRender: {
        attrs: { beforeChange: onPublicStatusChange },
        name: 'CellSwitch',
        props: {
          // 只有成片已完成的项目可以公开，取消公开不限制
          disabled: (row: AiDramaProjectApi.Project) =>
            (!row.publicStatus &&
              row.composeStatus !== AiDramaStatusEnum.SUCCESS) ||
            !hasAccessByCodes(['ai:drama:update']),
          checkedValue: true,
          unCheckedValue: false,
          checkedChildren: '是',
          unCheckedChildren: '否',
        },
      },
    },
    {
      field: 'updateTime',
      title: '更新时间',
      width: 180,
      formatter: 'formatDateTime',
    },
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
