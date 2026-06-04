import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmWarehouseAreaApi } from '#/api/mes/wm/warehouse/area';

import { h } from 'vue';

import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getWarehouseSimpleList } from '#/api/mes/wm/warehouse';
import { getWarehouseLocationSimpleList } from '#/api/mes/wm/warehouse/location';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改的表单 */
export function useFormSchema(
  formType: FormType,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'warehouseId',
      label: '所属仓库',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getWarehouseSimpleList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择仓库',
        // 仓库变更时清空所属库区
        onChange: () => formApi?.setFieldValue('locationId', undefined),
      },
    },
    {
      fieldName: 'locationId',
      label: '所属库区',
      component: 'ApiSelect',
      dependencies: {
        triggerFields: ['warehouseId'],
        componentProps: (values) => ({
          allowClear: true,
          api: () =>
            getWarehouseLocationSimpleList(values.warehouseId as number),
          // 改变 warehouseId 时强制刷新选项
          params: { warehouseId: values.warehouseId },
          disabled: !values.warehouseId,
          labelField: 'name',
          valueField: 'id',
          placeholder: '请选择库区',
        }),
      },
      rules: 'required',
    },
    {
      fieldName: 'code',
      label: '库位编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入库位编码',
      },
      rules: 'required',
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
                      MesAutoCodeRuleCode.WM_AREA_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '自动生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '库位名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入库位名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'area',
      label: '面积（㎡）',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        precision: 2,
        placeholder: '请输入面积',
      },
    },
    {
      fieldName: 'maxLoad',
      label: '最大载重',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        precision: 2,
        placeholder: '请输入最大载重',
      },
    },
    {
      fieldName: 'positionX',
      label: '位置 X',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入位置 X',
      },
    },
    {
      fieldName: 'positionY',
      label: '位置 Y',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入位置 Y',
      },
    },
    {
      fieldName: 'positionZ',
      label: '位置 Z',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入位置 Z',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'frozen',
      label: '是否冻结',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'allowItemMixing',
      label: '允许物料混放',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      rules: z.boolean().default(true),
    },
    {
      fieldName: 'allowBatchMixing',
      label: '允许批次混放',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      rules: z.boolean().default(true),
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
      label: '库位编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入库位编码',
      },
    },
    {
      fieldName: 'name',
      label: '库位名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入库位名称',
      },
    },
    {
      fieldName: 'positionX',
      label: '位置 X',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入位置 X',
      },
    },
    {
      fieldName: 'positionY',
      label: '位置 Y',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入位置 Y',
      },
    },
    {
      fieldName: 'positionZ',
      label: '位置 Z',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入位置 Z',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmWarehouseAreaApi.WarehouseArea>['columns'] {
  return [
    {
      field: 'code',
      title: '库位编码',
      minWidth: 140,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '库位名称',
      minWidth: 160,
    },
    {
      field: 'area',
      title: '面积（㎡）',
      width: 100,
    },
    {
      field: 'maxLoad',
      title: '最大载重',
      width: 100,
    },
    {
      field: 'positionX',
      title: '位置 X',
      width: 80,
    },
    {
      field: 'positionY',
      title: '位置 Y',
      width: 80,
    },
    {
      field: 'positionZ',
      title: '位置 Z',
      width: 80,
    },
    {
      field: 'status',
      title: '状态',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
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
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
