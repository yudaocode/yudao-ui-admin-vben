import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvMachineryTypeApi } from '#/api/mes/dv/machinery/type';

import { h } from 'vue';

import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { handleTree } from '@vben/utils';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { getMachineryTypeList } from '#/api/mes/dv/machinery/type';
import { generateAutoCode } from '#/api/mes/md/autocode/record';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改设备类型的表单 */
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
      label: '上级类型',
      component: 'ApiTreeSelect',
      componentProps: {
        clearable: true,
        api: async () => [
          { id: 0, name: '顶级类型', children: handleTree(await getMachineryTypeList()) },
        ],
        childrenField: 'children',
        labelField: 'name',
        placeholder: '请选择上级类型',
        defaultExpandAll: true,
        valueField: 'id',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'code',
      label: '类型编码',
      component: 'Input',
      componentProps: {
        maxLength: 64,
        placeholder: '请输入类型编码',
      },
      rules: z.string().min(1, '类型编码不能为空').max(64),
      suffix:
        formType === 'detail'
          ? undefined
          : () =>
              h(
                ElButton,
                {
                  onClick: async () => {
                    const code = await generateAutoCode(
                      MesAutoCodeRuleCode.DV_MACHINERY_TYPE_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '类型名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入类型名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'sort',
      label: '显示排序',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
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
      label: '类型名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入类型名称',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesDvMachineryTypeApi.MachineryType>['columns'] {
  return [
    { field: 'name', title: '类型名称', minWidth: 200, align: 'left', treeNode: true },
    { field: 'code', title: '类型编码', width: 160, align: 'center' },
    { field: 'sort', title: '排序', width: 100, align: 'center' },
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
      slots: {
        default: 'actions',
      },
    },
  ];
}
