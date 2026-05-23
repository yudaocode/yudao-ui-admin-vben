import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { getWarehouseSimpleList } from '#/api/wms/md/warehouse';

export const INVENTORY_DIMENSION = {
  ITEM: 'item',
  WAREHOUSE: 'warehouse',
} as const;

export type InventoryDimension =
  (typeof INVENTORY_DIMENSION)[keyof typeof INVENTORY_DIMENSION];

const dimensionOptions = [
  { label: '仓库', value: INVENTORY_DIMENSION.WAREHOUSE },
  { label: '商品', value: INVENTORY_DIMENSION.ITEM },
];

interface DimensionChangeEvent {
  target?: {
    value?: InventoryDimension;
  };
}

type DimensionChangeHandler = (
  dimension: InventoryDimension,
) => Promise<void> | void;

/** 统一解析 antd 事件对象和原始维度值 */
function getDimensionChangeValue(
  value?: DimensionChangeEvent | InventoryDimension,
): InventoryDimension {
  if (
    value === INVENTORY_DIMENSION.ITEM ||
    value === INVENTORY_DIMENSION.WAREHOUSE
  ) {
    return value;
  }
  return value?.target?.value ?? INVENTORY_DIMENSION.WAREHOUSE;
}

/** 搜索表单 */
export function useGridFormSchema(
  onDimensionChange: DimensionChangeHandler,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'type',
      label: '统计维度',
      component: 'RadioGroup',
      defaultValue: INVENTORY_DIMENSION.WAREHOUSE,
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: dimensionOptions,
        onChange: (value: DimensionChangeEvent | InventoryDimension) => {
          void onDimensionChange(getDimensionChangeValue(value));
        },
      },
    },
    {
      fieldName: 'warehouseId',
      label: '仓库',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getWarehouseSimpleList,
        labelField: 'name',
        placeholder: '请选择仓库',
        showSearch: true,
        valueField: 'id',
      },
    },
    {
      fieldName: 'itemName',
      label: '商品名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入商品名称',
      },
    },
    {
      fieldName: 'itemCode',
      label: '商品编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入商品编号',
      },
    },
    {
      fieldName: 'skuName',
      label: '规格名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入规格名称',
      },
    },
    {
      fieldName: 'skuCode',
      label: '规格编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入规格编号',
      },
    },
  ];
}

const warehouseDimensionColumns: VxeTableGridOptions['columns'] = [
  {
    field: 'warehouseId',
    title: '仓库',
    minWidth: 160,
    slots: { default: 'warehouseName' },
  },
  {
    field: 'warehouseItemId',
    title: '商品信息',
    minWidth: 240,
    slots: { default: 'itemInfo' },
  },
  {
    field: 'skuId',
    title: '规格信息',
    minWidth: 220,
    slots: { default: 'skuInfo' },
  },
  {
    field: 'quantity',
    title: '库存',
    align: 'right',
    minWidth: 130,
    slots: { default: 'quantity' },
  },
];

const itemDimensionColumns: VxeTableGridOptions['columns'] = [
  {
    field: 'itemId',
    title: '商品信息',
    minWidth: 240,
    slots: { default: 'itemInfo' },
  },
  {
    field: 'skuId',
    title: '规格信息',
    minWidth: 220,
    slots: { default: 'skuInfo' },
  },
  {
    field: 'skuWarehouseId',
    title: '仓库',
    minWidth: 160,
    slots: { default: 'warehouseName' },
  },
  {
    field: 'quantity',
    title: '库存',
    align: 'right',
    minWidth: 130,
    slots: { default: 'quantity' },
  },
];

/** 库存统计列表字段 */
export function useGridColumns(
  dimension: InventoryDimension = INVENTORY_DIMENSION.WAREHOUSE,
): VxeTableGridOptions['columns'] {
  return dimension === INVENTORY_DIMENSION.ITEM
    ? itemDimensionColumns
    : warehouseDimensionColumns;
}

/** 库存选择弹窗搜索表单 */
export function useInventorySelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'itemName',
      label: '商品名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入商品名称',
      },
    },
    {
      fieldName: 'itemCode',
      label: '商品编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入商品编号',
      },
    },
    {
      fieldName: 'skuName',
      label: '规格名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入规格名称',
      },
    },
    {
      fieldName: 'skuCode',
      label: '规格编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入规格编号',
      },
    },
  ];
}

/** 库存选择弹窗列表字段 */
export function useInventorySelectGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 50 },
    {
      field: 'itemInfo',
      title: '商品信息',
      minWidth: 220,
      slots: { default: 'itemInfo' },
    },
    {
      field: 'skuInfo',
      title: '规格信息',
      minWidth: 220,
      slots: { default: 'skuInfo' },
    },
    {
      field: 'warehouseName',
      title: '仓库',
      minWidth: 180,
    },
    {
      field: 'availableQuantity',
      title: '可用库存',
      align: 'right',
      width: 130,
      slots: { default: 'availableQuantity' },
    },
  ];
}
