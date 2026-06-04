import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmWarehouseApi } from '#/api/mes/wm/warehouse';
import type { SystemUserApi } from '#/api/system/user';

import { h } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getSimpleUserList } from '#/api/system/user';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 关联数据 */
let userList: SystemUserApi.User[] = [];
getSimpleUserList().then((data) => (userList = data));

/** 新增/修改的表单 */
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
      fieldName: 'code',
      label: '仓库编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入仓库编码',
      },
      rules: 'required',
      suffix:
        formType === 'detail'
          ? undefined
          : () =>
              h(
                ElButton,
                {
                  onClick: async () => {
                    const code = await generateAutoCode(
                      MesAutoCodeRuleCode.WM_WAREHOUSE_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '自动生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '仓库名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入仓库名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'chargeUserId',
      label: '负责人',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        clearable: true,
        labelField: 'nickname',
        placeholder: '请选择负责人',
        valueField: 'id',
      },
    },
    {
      fieldName: 'address',
      label: '仓库地址',
      component: 'Input',
      componentProps: {
        placeholder: '请输入仓库地址',
      },
    },
    {
      fieldName: 'area',
      label: '面积（㎡）',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 0,
        placeholder: '请输入面积',
        precision: 2,
      },
    },
    {
      fieldName: 'frozen',
      label: '是否冻结',
      component: 'Switch',
      componentProps: {
        activeText: '是',
        inactiveText: '否',
        inlinePrompt: true,
      },
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
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
      fieldName: 'code',
      label: '仓库编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入仓库编码',
      },
    },
    {
      fieldName: 'name',
      label: '仓库名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入仓库名称',
      },
    },
    {
      fieldName: 'frozen',
      label: '是否冻结',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          { label: '是', value: true },
          { label: '否', value: false },
        ],
        placeholder: '请选择',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmWarehouseApi.Warehouse>['columns'] {
  return [
    {
      field: 'code',
      title: '仓库编码',
      minWidth: 140,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '仓库名称',
      minWidth: 160,
    },
    {
      field: 'address',
      title: '仓库地址',
      minWidth: 180,
    },
    {
      field: 'area',
      title: '面积（㎡）',
      width: 110,
    },
    {
      field: 'chargeUserId',
      title: '负责人',
      width: 120,
      formatter: ({ cellValue }) =>
        userList.find((user) => user.id === cellValue)?.nickname ?? '',
    },
    {
      field: 'frozen',
      title: '冻结',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 180,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
