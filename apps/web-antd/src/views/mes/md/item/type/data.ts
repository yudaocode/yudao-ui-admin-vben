import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdItemTypeApi } from '#/api/mes/md/item/type';

import { h } from 'vue';

import {
  CommonStatusEnum,
  DICT_TYPE,
  MesAutoCodeRuleCode,
  MesItemOrProductEnum,
} from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { handleTree } from '@vben/utils';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getItemTypeList } from '#/api/mes/md/item/type';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改物料分类的表单 */
export function useFormSchema(
  formType: FormType,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
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
      fieldName: 'parentId',
      label: '上级分类',
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: async () => {
          const data = await getItemTypeList();
          return [
            {
              id: 0,
              name: '顶级分类',
              children: handleTree(data),
            },
          ];
        },
        childrenField: 'children',
        labelField: 'name',
        placeholder: '请选择上级分类',
        treeDefaultExpandAll: true,
        treeNodeFilterProp: 'name',
        valueField: 'id',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'code',
      label: '分类编码',
      component: 'Input',
      componentProps: {
        maxLength: 64,
        placeholder: '请输入分类编码',
      },
      rules: z.string().min(1, '分类编码不能为空').max(64),
      suffix:
        formType === 'detail'
          ? undefined
          : () =>
              h(
                Button,
                {
                  type: 'default',
                  onClick: async () => {
                    const code = await generateAutoCode(
                      MesAutoCodeRuleCode.MD_ITEM_TYPE_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '自动生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '分类名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入分类名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'itemOrProduct',
      label: '物料/产品标识',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.MES_MD_ITEM_OR_PRODUCT),
      },
      rules: z.string().default(MesItemOrProductEnum.ITEM.value),
    },
    {
      fieldName: 'sort',
      label: '显示排序',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        precision: 0,
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '分类名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入分类名称',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesMdItemTypeApi.ItemType>['columns'] {
  return [
    {
      field: 'name',
      title: '分类名称',
      minWidth: 200,
      align: 'left',
      treeNode: true,
    },
    {
      field: 'code',
      title: '分类编码',
      width: 160,
      align: 'center',
    },
    {
      field: 'itemOrProduct',
      title: '物料/产品',
      width: 130,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_MD_ITEM_OR_PRODUCT },
      },
    },
    {
      field: 'sort',
      title: '排序',
      width: 100,
      align: 'center',
    },
    {
      field: 'status',
      title: '状态',
      width: 120,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 260,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
