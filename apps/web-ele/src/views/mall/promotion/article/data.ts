import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { z } from '#/adapter/form';
import { getSimpleArticleCategoryList } from '#/api/mall/promotion/articleCategory';
import {
  CommonStatusEnum,
  DICT_TYPE,
  getDictOptions,
  getRangePickerDefaultProps,
} from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
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
      fieldName: 'title',
      label: '文章标题',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'categoryId',
      label: '文章分类',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleArticleCategoryList,
        labelField: 'name',
        valueField: 'id',
      },
      rules: 'required',
    },
    {
      fieldName: 'author',
      label: '文章作者',
      component: 'Input',
    },
    {
      fieldName: 'introduction',
      label: '文章简介',
      component: 'Input',
    },
    {
      fieldName: 'picUrl',
      label: '文章封面',
      component: 'ImageUpload',
      rules: 'required',
    },
    {
      fieldName: 'recommendHot',
      label: '是否热门',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      fieldName: 'recommendBanner',
      label: '是否轮播图',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      // TODO: 商品关联
      fieldName: 'spuId',
      label: '商品关联',
      component: 'Input',
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        controlsPosition: 'right',
        placeholder: '请输入品牌排序',
      },
      rules: z.number().min(0).default(1),
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'description',
      label: '文章内容',
      component: 'RichTextarea',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '文章分类',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleArticleCategoryList,
        labelField: 'name',
        valueField: 'id',
      },
    },
    {
      fieldName: 'title',
      label: '文章标题',
      component: 'Input',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
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

/** 表格列配置 */
export function useGridColumns(): VxeGridPropTypes.Columns {
  return [
    {
      field: 'id',
      title: '编号',
      fixed: 'left',
    },
    {
      field: 'title',
      title: '标题',
    },
    {
      field: 'picUrl',
      title: '封面',
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'categoryId',
      title: '分类',
    },
    {
      field: 'browseCount',
      title: '浏览量',
    },
    {
      field: 'author',
      title: '作者',
    },
    {
      field: 'introduction',
      title: '文章简介',
    },
    {
      field: 'sort',
      title: '排序',
    },
    {
      field: 'status',
      title: '状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
