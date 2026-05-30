import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';

import { markRaw } from 'vue';

import { useAccess } from '@vben/access';
import { DICT_TYPE } from '@vben/constants';

import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdVendorSelect } from '#/views/mes/md/vendor/components';

import {
  WmWarehouseAreaSelect,
  WmWarehouseLocationSelect,
  WmWarehouseSelect,
} from '../warehouse/components';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'itemId',
      label: '物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择物料',
      },
    },
    {
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入批次号',
      },
    },
    {
      fieldName: 'warehouseId',
      label: '仓库',
      component: markRaw(WmWarehouseSelect),
      componentProps: {
        placeholder: '请选择仓库',
      },
    },
    {
      fieldName: 'locationId',
      label: '库区',
      component: markRaw(WmWarehouseLocationSelect),
      dependencies: {
        triggerFields: ['warehouseId'],
        componentProps: (values) => ({
          warehouseId: values.warehouseId,
          placeholder: '请选择库区',
        }),
        // 仓库切换时清空库区，避免旧库区条件残留
        trigger: (values, formApi) => {
          if (values.locationId !== undefined) {
            void formApi.setFieldValue('locationId', undefined);
          }
        },
      },
    },
    {
      fieldName: 'frozen',
      label: '是否冻结',
      component: 'Select',
      componentProps: {
        allowClear: true,
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
export function useGridColumns(
  onFrozenChange: (
    newFrozen: boolean,
    row: MesWmMaterialStockApi.MaterialStock,
  ) => Promise<boolean | undefined>,
): VxeTableGridOptions<MesWmMaterialStockApi.MaterialStock>['columns'] {
  const { hasAccessByCodes } = useAccess();
  return [
    {
      field: 'itemCode',
      title: '产品物料编码',
      minWidth: 120,
    },
    {
      field: 'itemName',
      title: '产品物料名称',
      minWidth: 140,
    },
    {
      field: 'specification',
      title: '规格型号',
      minWidth: 120,
    },
    {
      field: 'quantity',
      title: '在库数量',
      width: 100,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 80,
    },
    {
      field: 'batchCode',
      title: '批次号',
      minWidth: 140,
      slots: { default: 'batchCode' },
    },
    {
      field: 'warehouseName',
      title: '仓库',
      minWidth: 100,
    },
    {
      field: 'locationName',
      title: '库区',
      minWidth: 100,
    },
    {
      field: 'areaName',
      title: '库位',
      minWidth: 100,
      slots: { default: 'areaName' },
    },
    {
      field: 'receiptTime',
      title: '入库日期',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'frozen',
      title: '冻结',
      width: 90,
      cellRender: {
        name: 'CellSwitch',
        attrs: { beforeChange: onFrozenChange },
        props: {
          checkedValue: true,
          // 冻结开关受更新权限控制，无权限时禁用，保持与源项目 v-hasPermi 一致
          disabled: !hasAccessByCodes(['mes:wm-material-stock:update']),
          unCheckedValue: false,
        },
      },
    },
  ];
}

/** 选择弹窗的搜索表单 */
export function useSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'itemId',
      label: '物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择物料',
      },
    },
    {
      fieldName: 'vendorId',
      label: '供应商',
      component: markRaw(MdVendorSelect),
      componentProps: {
        placeholder: '请选择供应商',
      },
    },
    {
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入批次号',
      },
    },
    {
      fieldName: 'warehouseId',
      label: '仓库',
      component: markRaw(WmWarehouseSelect),
      componentProps: {
        placeholder: '请选择仓库',
      },
    },
    {
      fieldName: 'locationId',
      label: '库区',
      component: markRaw(WmWarehouseLocationSelect),
      dependencies: {
        triggerFields: ['warehouseId'],
        componentProps: (values) => ({
          warehouseId: values.warehouseId,
          placeholder: '请选择库区',
        }),
        // 仓库切换时清空库区
        trigger: (values, formApi) => {
          if (values.locationId !== undefined) {
            void formApi.setFieldValue('locationId', undefined);
          }
        },
      },
    },
    {
      fieldName: 'areaId',
      label: '库位',
      component: markRaw(WmWarehouseAreaSelect),
      dependencies: {
        triggerFields: ['warehouseId', 'locationId'],
        componentProps: (values) => ({
          locationId: values.locationId,
          placeholder: '请选择库位',
        }),
        // 仓库或库区切换时清空库位
        trigger: (values, formApi) => {
          if (values.areaId !== undefined) {
            void formApi.setFieldValue('areaId', undefined);
          }
        },
      },
    },
  ];
}

/** 选择弹窗的字段 */
export function useSelectGridColumns(
  multiple = false,
): VxeTableGridOptions<MesWmMaterialStockApi.MaterialStock>['columns'] {
  return [
    {
      type: multiple ? 'checkbox' : 'radio',
      width: 50,
    },
    {
      field: 'itemCode',
      title: '产品物料编码',
      minWidth: 120,
    },
    {
      field: 'itemName',
      title: '产品物料名称',
      minWidth: 140,
    },
    {
      field: 'specification',
      title: '规格型号',
      minWidth: 120,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 80,
    },
    {
      field: 'batchCode',
      title: '入库批次号',
      minWidth: 120,
    },
    {
      field: 'warehouseName',
      title: '仓库',
      minWidth: 100,
    },
    {
      field: 'locationName',
      title: '库区',
      minWidth: 100,
    },
    {
      field: 'areaName',
      title: '库位',
      minWidth: 100,
    },
    {
      field: 'quantity',
      title: '在库数量',
      width: 100,
    },
    {
      field: 'receiptTime',
      title: '入库日期',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'frozen',
      title: '冻结',
      width: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
  ];
}
