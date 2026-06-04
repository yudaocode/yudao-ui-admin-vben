import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProRouteApi } from '#/api/mes/pro/route';
import type { MesProRouteProcessApi } from '#/api/mes/pro/route/process';
import type { MesProRouteProductApi } from '#/api/mes/pro/route/product';
import type { MesProRouteProductBomApi } from '#/api/mes/pro/route/productbom';

import { h, markRaw } from 'vue';

import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import {
  MdItemSelect,
  MdProductBomSelect,
} from '#/views/mes/md/item/components';

import { RouteColorPicker } from './components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 工艺路线表单 */
export function useFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'code',
      label: '路线编码',
      component: 'Input',
      componentProps: {
        maxLength: 64,
        placeholder: '请输入工艺路线编码',
      },
      rules: z.string().min(1, '路线编码不能为空').max(64),
      suffix: () =>
        h(
          Button,
          {
            type: 'default',
            onClick: async () => {
              const code = await generateAutoCode(
                MesAutoCodeRuleCode.PRO_ROUTE_CODE,
              );
              await formApi?.setFieldValue('code', code);
            },
          },
          { default: () => '生成' },
        ),
    },
    {
      fieldName: 'name',
      label: '路线名称',
      component: 'Input',
      componentProps: {
        maxLength: 100,
        placeholder: '请输入工艺路线名称',
      },
      rules: z.string().min(1, '路线名称不能为空').max(100),
    },
    {
      fieldName: 'description',
      label: '路线说明',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        maxLength: 500,
        placeholder: '请输入工艺路线说明',
        rows: 3,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        maxLength: 250,
        placeholder: '请输入备注',
        rows: 2,
      },
    },
  ];
}

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '路线编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入路线编码',
      },
    },
    {
      fieldName: 'name',
      label: '路线名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入路线名称',
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

/** 列表字段 */
export function useGridColumns(
  onStatusChange?: (
    newStatus: number,
    row: MesProRouteApi.Route,
  ) => PromiseLike<boolean | undefined>,
  statusEditable = true,
): VxeTableGridOptions<MesProRouteApi.Route>['columns'] {
  return [
    {
      field: 'code',
      title: '路线编码',
      minWidth: 160,
      slots: { default: 'code' },
    },
    { field: 'name', title: '路线名称', minWidth: 180 },
    { field: 'description', title: '路线说明', minWidth: 200 },
    {
      field: 'status',
      title: '状态',
      width: 110,
      align: 'center',
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: 'CellSwitch',
        props: {
          checkedValue: CommonStatusEnum.ENABLE,
          disabled: !statusEditable,
          unCheckedValue: CommonStatusEnum.DISABLE,
        },
      },
    },
    { field: 'remark', title: '备注', minWidth: 160 },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 工艺路线工序明细表单 */
export function useRouteProcessFormSchema(
  processOptions: Array<{ label: string; value: number }>,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'routeId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'sort',
      label: '序号',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 1,
        precision: 0,
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'processId',
      label: '工序',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: processOptions,
        placeholder: '请选择工序',
        showSearch: true,
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'linkType',
      label: '与下道工序关系',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_PRO_LINK_TYPE, 'number'),
        placeholder: '请选择',
      },
      rules: z.number().default(3),
    },
    {
      fieldName: 'colorCode',
      label: '甘特图颜色',
      component: RouteColorPicker,
    },
    {
      fieldName: 'keyFlag',
      label: '是否关键工序',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'checkFlag',
      label: '是否质检确认',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'prepareTime',
      label: '准备时间(分)',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        precision: 0,
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'waitTime',
      label: '等待时间(分)',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        precision: 0,
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        maxLength: 250,
        placeholder: '请输入备注',
        rows: 2,
      },
    },
  ];
}

/** 工艺路线工序列表字段 */
export function useRouteProcessGridColumns(): VxeTableGridOptions<MesProRouteProcessApi.RouteProcess>['columns'] {
  return [
    { field: 'sort', title: '序号', width: 70, align: 'center', fixed: 'left' },
    { field: 'processCode', title: '工序编码', width: 140, fixed: 'left' },
    { field: 'processName', title: '工序名称', width: 140, fixed: 'left' },
    { field: 'nextProcessName', title: '下一道工序', width: 140 },
    {
      field: 'linkType',
      title: '与下一道工序关系',
      width: 160,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_LINK_TYPE },
      },
    },
    {
      field: 'keyFlag',
      title: '关键工序',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'checkFlag',
      title: '质检确认',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    { field: 'prepareTime', title: '准备时间(分)', width: 110 },
    { field: 'waitTime', title: '等待时间(分)', width: 110 },
    {
      field: 'colorCode',
      title: '甘特图颜色',
      width: 130,
      slots: { default: 'colorCode' },
    },
    { field: 'remark', title: '备注', minWidth: 160 },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 工艺路线产品列表字段 */
export function useRouteProductGridColumns(): VxeTableGridOptions<MesProRouteProductApi.RouteProduct>['columns'] {
  return [
    { field: 'itemCode', title: '产品物料编码', width: 150 },
    { field: 'itemName', title: '产品物料名称', width: 150 },
    { field: 'specification', title: '规格型号', width: 150 },
    { field: 'unitName', title: '单位', width: 80 },
    { field: 'quantity', title: '生产数量', width: 100 },
    {
      field: 'productionTime',
      title: '生产用时',
      width: 130,
      slots: { default: 'productionTime' },
    },
    { field: 'remark', title: '备注', minWidth: 160 },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 工艺路线产品 BOM 列表字段 */
export function useRouteProductBomGridColumns(): VxeTableGridOptions<MesProRouteProductBomApi.RouteProductBom>['columns'] {
  return [
    { field: 'itemCode', title: 'BOM 物料编码', width: 150 },
    { field: 'itemName', title: 'BOM 物料名称', width: 150 },
    { field: 'specification', title: '规格型号', width: 150 },
    { field: 'unitName', title: '单位', width: 80 },
    { field: 'quantity', title: '用料比例', width: 100 },
    { field: 'remark', title: '备注', minWidth: 160 },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}


/** 工艺路线产品表单 */
export function useRouteProductFormSchema(
  onItemChange?: (item: any) => void,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'routeId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    // 产品物料：使用业务自定义选择器，change 回填编码/名称/规格/单位
    {
      fieldName: 'itemId',
      label: '产品',
      component: markRaw(MdItemSelect),
      componentProps: {
        onChange: onItemChange,
      },
      formItemClass: 'col-span-2',
      rules: 'selectRequired',
    },
    {
      fieldName: 'quantity',
      label: '生产数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 1,
        precision: 0,
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'productionTime',
      label: '生产用时',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        precision: 2,
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'timeUnitType',
      label: '时间单位',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_TIME_UNIT_TYPE),
        placeholder: '请选择',
      },
      rules: z.string().default('MINUTE'),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        maxLength: 250,
        placeholder: '请输入备注',
        rows: 2,
      },
    },
  ];
}

/** 工艺路线产品 BOM 表单 */
export function useRouteProductBomFormSchema(
  itemId: () => number,
  onBomChange?: (bom: any) => void,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'routeId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'processId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'productId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    // BOM 物料：依赖产品物料，使用业务自定义选择器
    {
      fieldName: 'itemId',
      label: 'BOM 物料',
      component: markRaw(MdProductBomSelect),
      componentProps: () => ({
        itemId: itemId(),
        onChange: onBomChange,
        placeholder: '请选择 BOM 物料',
      }),
      rules: 'selectRequired',
    },
    {
      fieldName: 'quantity',
      label: '用料比例',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        precision: 2,
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        maxLength: 250,
        placeholder: '请输入备注',
        rows: 2,
      },
    },
  ];
}
