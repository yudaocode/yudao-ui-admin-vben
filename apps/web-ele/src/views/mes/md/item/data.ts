import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdItemApi } from '#/api/mes/md/item';
import type { MesMdProductBomApi } from '#/api/mes/md/item/productBom';

import { h, markRaw } from 'vue';

import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { MdItemTypeSelect } from '#/views/mes/md/item/type/components';
import { MdUnitMeasureSelect } from '#/views/mes/md/unitmeasure/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改物料产品的表单 */
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
      label: '物料编码',
      component: 'Input',
      componentProps: {
        maxLength: 64,
        placeholder: '请输入物料编码',
      },
      rules: z.string().min(1, '物料编码不能为空').max(64),
      suffix:
        formType === 'detail'
          ? undefined
          : () =>
              h(
                ElButton,
                {
                  onClick: async () => {
                    const code = await generateAutoCode(
                      MesAutoCodeRuleCode.MD_ITEM_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '物料名称',
      component: 'Input',
      componentProps: {
        maxLength: 255,
        placeholder: '请输入物料名称',
      },
      rules: z.string().min(1, '物料名称不能为空').max(255),
    },
    {
      fieldName: 'specification',
      label: '规格型号',
      component: 'Input',
      componentProps: {
        maxLength: 255,
        placeholder: '请输入规格型号',
      },
    },
    {
      fieldName: 'unitMeasureId',
      label: '单位',
      component: markRaw(MdUnitMeasureSelect),
      componentProps: {
        placeholder: '请选择计量单位',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'itemTypeId',
      label: '物料分类',
      component: markRaw(MdItemTypeSelect),
      componentProps: {
        onChange: async (itemType: any) => {
          await formApi?.setFieldValue(
            'itemOrProduct',
            itemType?.itemOrProduct,
          );
        },
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        disabled: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      rules: z.number().default(CommonStatusEnum.DISABLE),
    },
    {
      fieldName: 'highValue',
      label: '高值物料',
      component: 'Switch',
      componentProps: {
        activeText: '是',
        inactiveText: '否',
        inlinePrompt: true,
      },
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'batchFlag',
      label: '批次管理',
      component: 'Switch',
      componentProps: {
        activeText: '是',
        inactiveText: '否',
        inlinePrompt: true,
      },
      rules: z.boolean().default(true),
    },
    {
      fieldName: 'safeStockFlag',
      label: '安全库存',
      component: 'Switch',
      componentProps: {
        activeText: '是',
        inactiveText: '否',
        inlinePrompt: true,
      },
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'minStock',
      label: '最低库存量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 0,
        precision: 2,
      },
      dependencies: {
        triggerFields: ['safeStockFlag'],
        show: (values) => Boolean(values.safeStockFlag),
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'maxStock',
      label: '最高库存量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 0,
        precision: 2,
      },
      dependencies: {
        triggerFields: ['safeStockFlag'],
        show: (values) => Boolean(values.safeStockFlag),
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
      formItemClass: 'col-span-3',
    },
    {
      fieldName: 'itemOrProduct',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '物料编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入物料编码',
      },
    },
    {
      fieldName: 'name',
      label: '物料名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入物料名称',
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

/** 物料导入表单 */
export function useImportFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'file',
      label: '物料数据',
      component: 'Upload',
      rules: 'required',
      help: '仅允许导入 xls、xlsx 格式文件',
    },
    {
      fieldName: 'updateSupport',
      label: '是否覆盖',
      component: 'Switch',
      componentProps: {
        activeText: '是',
        inactiveText: '否',
        inlinePrompt: true,
      },
      rules: z.boolean().default(false),
      help: '是否更新已经存在的物料数据',
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(
  onStatusChange?: (
    newStatus: number,
    row: MesMdItemApi.Item,
  ) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions<MesMdItemApi.Item>['columns'] {
  return [
    {
      field: 'code',
      title: '物料编码',
      minWidth: 160,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '物料名称',
      minWidth: 160,
    },
    {
      field: 'specification',
      title: '规格型号',
      minWidth: 160,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 100,
      align: 'center',
    },
    {
      field: 'itemTypeName',
      title: '物料分类',
      minWidth: 140,
      align: 'center',
    },
    {
      field: 'itemOrProduct',
      title: '物料/产品',
      width: 120,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_MD_ITEM_OR_PRODUCT },
      },
    },
    {
      field: 'safeStockFlag',
      title: '安全库存',
      width: 120,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 120,
      align: 'center',
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: 'CellSwitch',
        props: {
          inactiveValue: CommonStatusEnum.DISABLE,
          activeValue: CommonStatusEnum.ENABLE,
        },
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
      width: 220,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 物料选择弹窗搜索表单 */
export function useItemSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '物料编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入物料编码',
      },
    },
    {
      fieldName: 'name',
      label: '物料名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入物料名称',
      },
    },
  ];
}

/** 物料选择弹窗列表字段 */
export function useItemSelectGridColumns(
  multiple = true,
): VxeTableGridOptions<MesMdItemApi.Item>['columns'] {
  return [
    { type: multiple ? 'checkbox' : 'radio', width: 50 },
    {
      field: 'code',
      title: '物料编码',
      width: 180,
    },
    {
      field: 'name',
      title: '物料名称',
      minWidth: 160,
      align: 'left',
    },
    {
      field: 'specification',
      title: '规格型号',
      minWidth: 140,
      align: 'left',
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 90,
      align: 'center',
    },
    {
      field: 'itemOrProduct',
      title: '物料/产品',
      width: 110,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_MD_ITEM_OR_PRODUCT },
      },
    },
    {
      field: 'itemTypeName',
      title: '所属分类',
      width: 140,
      align: 'center',
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
  ];
}

/** 产品 BOM 子表字段 */
export function useProductBomGridColumns(
  isReadOnly = false,
): VxeTableGridOptions<MesMdProductBomApi.ProductBom>['columns'] {
  const columns: VxeTableGridOptions<MesMdProductBomApi.ProductBom>['columns'] =
    [
      {
        field: 'bomItemCode',
        title: '物料编码',
        minWidth: 160,
        align: 'center',
      },
      {
        field: 'bomItemName',
        title: '物料名称',
        minWidth: 160,
        align: 'center',
      },
      {
        field: 'bomItemSpecification',
        title: '规格型号',
        minWidth: 140,
        align: 'center',
      },
      {
        field: 'unitMeasureName',
        title: '单位',
        width: 80,
        align: 'center',
      },
      {
        field: 'itemOrProduct',
        title: '物料/产品',
        width: 110,
        align: 'center',
        cellRender: {
          name: 'CellDict',
          props: { type: DICT_TYPE.MES_MD_ITEM_OR_PRODUCT },
        },
      },
      {
        field: 'quantity',
        title: '用量比例',
        width: 100,
        align: 'center',
      },
      {
        field: 'remark',
        title: '备注',
        minWidth: 140,
        align: 'center',
      },
    ];

  if (!isReadOnly) {
    columns.push({
      field: 'actions',
      title: '操作',
      width: 120,
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
    });
  }

  return columns;
}
