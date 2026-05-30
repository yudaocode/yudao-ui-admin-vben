import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmWarehouseApi } from '#/api/mes/wm/warehouse';
import type { MesWmWarehouseLocationApi } from '#/api/mes/wm/warehouse/location';

import { h } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getWarehouseSimpleList } from '#/api/mes/wm/warehouse';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 关联数据 */
let warehouseList: MesWmWarehouseApi.Warehouse[] = [];
getWarehouseSimpleList().then((data) => (warehouseList = data));

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
      label: '库区编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入库区编码',
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
                      MesAutoCodeRuleCode.WM_LOCATION_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '自动生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '库区名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入库区名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'warehouseId',
      label: '所属仓库',
      component: 'ApiSelect',
      componentProps: {
        api: getWarehouseSimpleList,
        clearable: true,
        labelField: 'name',
        placeholder: '请选择仓库',
        valueField: 'id',
      },
      rules: 'required',
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
      label: '库区编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入库区编码',
      },
    },
    {
      fieldName: 'name',
      label: '库区名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入库区名称',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmWarehouseLocationApi.WarehouseLocation>['columns'] {
  return [
    {
      field: 'code',
      title: '库区编码',
      minWidth: 140,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '库区名称',
      minWidth: 160,
    },
    {
      field: 'warehouseId',
      title: '所属仓库',
      minWidth: 140,
      formatter: ({ cellValue }) =>
        warehouseList.find((w) => w.id === cellValue)?.name ?? '',
    },
    {
      field: 'area',
      title: '面积（㎡）',
      width: 110,
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
