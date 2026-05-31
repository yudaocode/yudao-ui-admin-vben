import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmBarcodeApi } from '#/api/mes/wm/barcode';
import type { MesWmBarcodeConfigApi } from '#/api/mes/wm/barcode/config';
import type { DescriptionItemSchema } from '#/components/description';

import { h, markRaw } from 'vue';

import {
  BarcodeBizTypeEnum,
  CommonStatusEnum,
  DICT_TYPE,
  MesProWorkOrderStatusEnum,
} from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { z } from '#/adapter/form';
import { generateBarcodeContent } from '#/api/mes/wm/barcode';
import { DictTag } from '#/components/dict-tag';
import { DvMachinerySelect } from '#/views/mes/dv/machinery/components';
import { MdClientSelect } from '#/views/mes/md/client/components';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdVendorSelect } from '#/views/mes/md/vendor/components';
import {
  MdWorkshopSelect,
  MdWorkstationSelect,
} from '#/views/mes/md/workstation/components';
import { ProCardSelect } from '#/views/mes/pro/card/components';
import { ProWorkOrderSelect } from '#/views/mes/pro/workorder/components';
import { TmToolSelect } from '#/views/mes/tm/tool/components';
import { WmBatchSelect } from '#/views/mes/wm/batch/components';
import { UserSelect } from '#/views/system/user/components';

import { WmMaterialStockSelect } from '../materialstock/components';
import { WmPackageSelect } from '../packages/components';
import {
  WmWarehouseAreaSelect,
  WmWarehouseLocationSelect,
  WmWarehouseSelect,
} from '../warehouse/components';

/** 业务对象选中后回填业务编码、业务名称、条码内容 */
async function syncBizDetail(
  formApi: undefined | VbenFormApi,
  item: any,
) {
  if (!formApi) {
    return;
  }
  const values = await formApi.getValues();
  const bizType = values.bizType as number | undefined;
  if (!item) {
    await formApi.setValues({
      bizCode: undefined,
      bizName: undefined,
      content: undefined,
    });
    return;
  }
  let bizCode: string | undefined;
  let bizName: string | undefined;
  switch (bizType) {
    case BarcodeBizTypeEnum.BATCH: {
      bizCode = item.code;
      bizName = item.itemName || item.code;
      break;
    }
    case BarcodeBizTypeEnum.PACKAGE: {
      bizCode = item.code;
      bizName = item.clientName || item.code;
      break;
    }
    case BarcodeBizTypeEnum.PROCARD: {
      bizCode = item.code;
      bizName = item.workOrderName || item.code;
      break;
    }
    case BarcodeBizTypeEnum.STOCK: {
      bizCode = item.itemCode;
      bizName = item.itemName;
      break;
    }
    default: {
      bizCode = item.code || item.username;
      bizName = item.name || item.nickname;
    }
  }
  // 先回填业务编码、名称并清空旧条码内容
  await formApi.setValues({ bizCode, bizName, content: undefined });
  // 再根据业务类型 + 业务编码生成条码内容
  if (bizType && bizCode) {
    const content = await generateBarcodeContent(bizType, bizCode);
    await formApi.setFieldValue('content', content);
  }
}

/** 新增/修改条码的表单 */
export function useFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
  return [
    {
      fieldName: 'bizType',
      label: '业务类型',
      component: 'Select',
      componentProps: {
        // 业务类型变更时清空业务字段
        onChange: () =>
          formApi?.setValues({
            bizId: undefined,
            bizCode: undefined,
            bizName: undefined,
            content: undefined,
            locationWarehouseId: undefined,
            areaWarehouseId: undefined,
            areaLocationId: undefined,
          }),
        options: getDictOptions(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE, 'number'),
        placeholder: '请选择业务类型',
      },
      rules: 'required',
    },
    // ==================== 业务对象选择器（按 bizType 切换） ====================
    {
      fieldName: 'bizId',
      label: '仓库',
      component: markRaw(WmWarehouseSelect),
      componentProps: {
        onChange: (item: any) => syncBizDetail(formApi, item),
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.WAREHOUSE,
      },
      rules: 'required',
    },
    {
      fieldName: 'locationWarehouseId',
      label: '库区·仓库',
      component: markRaw(WmWarehouseSelect),
      componentProps: {
        onChange: () =>
          formApi?.setValues({
            bizId: undefined,
            bizCode: undefined,
            bizName: undefined,
            content: undefined,
          }),
        placeholder: '请选择仓库',
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.LOCATION,
      },
    },
    {
      fieldName: 'bizId',
      label: '库区',
      component: markRaw(WmWarehouseLocationSelect),
      dependencies: {
        triggerFields: ['bizType', 'locationWarehouseId'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.LOCATION,
        componentProps: (values) => ({
          onChange: (item: any) => syncBizDetail(formApi, item),
          placeholder: '请选择库区',
          warehouseId: values.locationWarehouseId,
        }),
      },
      rules: 'required',
    },
    {
      fieldName: 'areaWarehouseId',
      label: '库位·仓库',
      component: markRaw(WmWarehouseSelect),
      componentProps: {
        onChange: () =>
          formApi?.setValues({
            areaLocationId: undefined,
            bizId: undefined,
            bizCode: undefined,
            bizName: undefined,
            content: undefined,
          }),
        placeholder: '请选择仓库',
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.AREA,
      },
    },
    {
      fieldName: 'areaLocationId',
      label: '库位·库区',
      component: markRaw(WmWarehouseLocationSelect),
      dependencies: {
        triggerFields: ['bizType', 'areaWarehouseId'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.AREA,
        componentProps: (values) => ({
          onChange: () =>
            formApi?.setValues({
              bizId: undefined,
              bizCode: undefined,
              bizName: undefined,
              content: undefined,
            }),
          placeholder: '请选择库区',
          warehouseId: values.areaWarehouseId,
        }),
      },
    },
    {
      fieldName: 'bizId',
      label: '库位',
      component: markRaw(WmWarehouseAreaSelect),
      dependencies: {
        triggerFields: ['bizType', 'areaLocationId'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.AREA,
        componentProps: (values) => ({
          locationId: values.areaLocationId,
          onChange: (item: any) => syncBizDetail(formApi, item),
          placeholder: '请选择库位',
        }),
      },
      rules: 'required',
    },
    {
      fieldName: 'bizId',
      label: '工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        status: MesProWorkOrderStatusEnum.CONFIRMED,
        onChange: (item: any) => syncBizDetail(formApi, item),
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.WORKORDER,
      },
      rules: 'required',
    },
    {
      fieldName: 'bizId',
      label: '设备',
      component: markRaw(DvMachinerySelect),
      componentProps: {
        onChange: (item: any) => syncBizDetail(formApi, item),
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.MACHINERY,
      },
      rules: 'required',
    },
    {
      fieldName: 'bizId',
      label: '产品物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        onChange: (item: any) => syncBizDetail(formApi, item),
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.ITEM,
      },
      rules: 'required',
    },
    {
      fieldName: 'bizId',
      label: '供应商',
      component: markRaw(MdVendorSelect),
      componentProps: {
        onChange: (item: any) => syncBizDetail(formApi, item),
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.VENDOR,
      },
      rules: 'required',
    },
    {
      fieldName: 'bizId',
      label: '工作站',
      component: markRaw(MdWorkstationSelect),
      componentProps: {
        onChange: (item: any) => syncBizDetail(formApi, item),
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.WORKSTATION,
      },
      rules: 'required',
    },
    {
      fieldName: 'bizId',
      label: '车间',
      component: markRaw(MdWorkshopSelect),
      componentProps: {
        onChange: (item: any) => syncBizDetail(formApi, item),
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.WORKSHOP,
      },
      rules: 'required',
    },
    {
      fieldName: 'bizId',
      label: '客户',
      component: markRaw(MdClientSelect),
      componentProps: {
        onChange: (item: any) => syncBizDetail(formApi, item),
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.CLIENT,
      },
      rules: 'required',
    },
    {
      fieldName: 'bizId',
      label: '工具',
      component: markRaw(TmToolSelect),
      componentProps: {
        onChange: (item: any) => syncBizDetail(formApi, item),
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.TOOL,
      },
      rules: 'required',
    },
    {
      fieldName: 'bizId',
      label: '库存',
      component: markRaw(WmMaterialStockSelect),
      componentProps: {
        onChange: (item: any) => syncBizDetail(formApi, item),
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.STOCK,
      },
      rules: 'required',
    },
    {
      fieldName: 'bizId',
      label: '装箱单',
      component: markRaw(WmPackageSelect),
      componentProps: {
        childableOnly: true,
        onChange: (item: any) => syncBizDetail(formApi, item),
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.PACKAGE,
      },
      rules: 'required',
    },
    {
      fieldName: 'bizId',
      label: '批次',
      component: markRaw(WmBatchSelect),
      componentProps: {
        onChange: (item: any) => syncBizDetail(formApi, item),
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.BATCH,
      },
      rules: 'required',
    },
    {
      fieldName: 'bizId',
      label: '流转卡',
      component: markRaw(ProCardSelect),
      componentProps: {
        onChange: (item: any) => syncBizDetail(formApi, item),
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.PROCARD,
      },
      rules: 'required',
    },
    {
      fieldName: 'bizId',
      label: '人员',
      component: markRaw(UserSelect),
      componentProps: {
        onChange: (item: any) => syncBizDetail(formApi, item),
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) => values.bizType === BarcodeBizTypeEnum.USER,
      },
      rules: 'required',
    },
    {
      fieldName: 'bizId',
      label: '业务编号',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 1,
        placeholder: '请输入业务编号',
      },
      dependencies: {
        triggerFields: ['bizType'],
        show: (values) =>
          values.bizType !== undefined &&
          ![
            BarcodeBizTypeEnum.AREA,
            BarcodeBizTypeEnum.BATCH,
            BarcodeBizTypeEnum.CLIENT,
            BarcodeBizTypeEnum.ITEM,
            BarcodeBizTypeEnum.LOCATION,
            BarcodeBizTypeEnum.MACHINERY,
            BarcodeBizTypeEnum.PACKAGE,
            BarcodeBizTypeEnum.PROCARD,
            BarcodeBizTypeEnum.STOCK,
            BarcodeBizTypeEnum.TOOL,
            BarcodeBizTypeEnum.USER,
            BarcodeBizTypeEnum.VENDOR,
            BarcodeBizTypeEnum.WAREHOUSE,
            BarcodeBizTypeEnum.WORKORDER,
            BarcodeBizTypeEnum.WORKSHOP,
            BarcodeBizTypeEnum.WORKSTATION,
          ].includes(values.bizType),
      },
    },
    {
      fieldName: 'bizCode',
      label: '业务编码',
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: '自动填充',
      },
      rules: 'required',
    },
    {
      fieldName: 'bizName',
      label: '业务名称',
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: '自动填充',
      },
      rules: 'required',
    },
    {
      fieldName: 'content',
      label: '条码内容',
      component: 'Input',
      componentProps: {
        placeholder: '请输入条码内容或自动生成',
      },
      rules: 'required',
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
        rows: 2,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'bizType',
      label: '业务类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE, 'number'),
        placeholder: '请选择业务类型',
      },
    },
    {
      fieldName: 'bizCode',
      label: '业务编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入业务编码',
      },
    },
    {
      fieldName: 'bizName',
      label: '业务名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入业务名称',
      },
    },
    {
      fieldName: 'content',
      label: '条码内容',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入条码内容',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmBarcodeApi.Barcode>['columns'] {
  return [
    {
      type: 'checkbox',
      width: 50,
    },
    {
      field: 'content',
      title: '条码',
      width: 180,
      slots: { default: 'barcode' },
    },
    {
      field: 'format',
      title: '条码格式',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_BARCODE_FORMAT },
      },
    },
    {
      field: 'bizType',
      title: '业务类型',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE },
      },
    },
    {
      field: 'content',
      title: '条码内容',
      minWidth: 160,
    },
    {
      field: 'bizCode',
      title: '业务编码',
      width: 130,
    },
    {
      field: 'bizName',
      title: '业务名称',
      minWidth: 140,
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
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 配置列表的搜索表单 */
export function useConfigGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'format',
      label: '条码格式',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_WM_BARCODE_FORMAT, 'number'),
        placeholder: '请选择条码格式',
      },
    },
    {
      fieldName: 'bizType',
      label: '业务类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE, 'number'),
        placeholder: '请选择业务类型',
      },
    },
  ];
}

/** 配置列表的字段 */
export function useConfigGridColumns(
  onAutoGenerateChange: (
    row: MesWmBarcodeConfigApi.BarcodeConfig,
  ) => Promise<boolean>,
): VxeTableGridOptions<MesWmBarcodeConfigApi.BarcodeConfig>['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 100,
    },
    {
      field: 'format',
      title: '条码格式',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_BARCODE_FORMAT },
      },
    },
    {
      field: 'bizType',
      title: '业务类型',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE },
      },
    },
    {
      field: 'contentFormat',
      title: '内容格式',
      minWidth: 160,
    },
    {
      field: 'contentExample',
      title: '内容样例',
      minWidth: 160,
    },
    {
      field: 'defaultTemplate',
      title: '默认打印模板',
      minWidth: 140,
    },
    {
      field: 'autoGenerateFlag',
      title: '自动生成',
      width: 100,
      cellRender: {
        name: 'CellSwitch',
        attrs: { beforeChange: onAutoGenerateChange },
      },
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

/** 条码详情的描述字段 */
export function useBarcodeDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'format',
      label: '条码格式',
      render: (value) =>
        value == null
          ? '-'
          : h(DictTag, { type: DICT_TYPE.MES_WM_BARCODE_FORMAT, value }),
    },
    {
      field: 'bizType',
      label: '业务类型',
      render: (value) =>
        value == null
          ? '-'
          : h(DictTag, { type: DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE, value }),
    },
    {
      field: 'content',
      label: '条码内容',
      slot: 'content',
    },
    {
      field: 'bizCode',
      label: '业务编码',
      render: (value) => value || '-',
    },
    {
      field: 'bizName',
      label: '业务名称',
      render: (value) => value || '-',
    },
    {
      field: 'status',
      label: '状态',
      render: (value) =>
        value == null
          ? '-'
          : h(DictTag, { type: DICT_TYPE.COMMON_STATUS, value }),
    },
    {
      field: 'createTime',
      label: '创建时间',
      render: (value) => formatDateTime(value) || '-',
    },
  ];
}
