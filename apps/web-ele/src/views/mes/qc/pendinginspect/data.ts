import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcPendingInspectApi } from '#/api/mes/qc/pendinginspect';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { MdItemSelect } from '#/views/mes/md/item/components';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'sourceDocCode',
      label: '来源单据编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入来源单据编号',
      },
    },
    {
      fieldName: 'itemId',
      label: '产品物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择产品物料',
      },
    },
    {
      fieldName: 'qcType',
      label: '检验类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_QC_TYPE, 'number'),
        placeholder: '请选择检验类型',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesQcPendingInspectApi.PendingInspect>['columns'] {
  return [
    {
      field: 'sourceDocType',
      title: '来源单据类型',
      width: 130,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_QC_SOURCE_DOC_TYPE },
      },
    },
    {
      field: 'sourceDocCode',
      title: '来源单据编号',
      width: 160,
    },
    {
      field: 'qcType',
      title: '检验类型',
      minWidth: 150,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_QC_TYPE },
      },
    },
    {
      field: 'itemCode',
      title: '物料编码',
      minWidth: 130,
    },
    {
      field: 'itemName',
      title: '物料名称',
      minWidth: 150,
    },
    {
      field: 'specification',
      title: '规格型号',
      width: 130,
    },
    {
      field: 'quantity',
      title: '待检数量',
      width: 100,
    },
    {
      field: 'unitName',
      title: '单位',
      width: 80,
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
