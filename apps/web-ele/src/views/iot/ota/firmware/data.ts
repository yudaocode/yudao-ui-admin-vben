import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IotProductApi } from '#/api/iot/product/product';
import type { DescriptionItemSchema } from '#/components/description';

import { formatDateTime } from '@vben/utils';

import { getSimpleProductList } from '#/api/iot/product/product';
import { getRangePickerDefaultProps } from '#/utils';

/** 关联数据 */
let productList: IotProductApi.Product[] = [];
getSimpleProductList().then((data) => (productList = data));

/** 根据产品 ID 取产品名称 */
export function getProductName(productId?: number): string {
  if (!productId) {
    return '-';
  }
  return productList.find((product) => product.id === productId)?.name || '-';
}

/** 固件详情的描述字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    { field: 'name', label: '固件名称' },
    {
      field: 'productName',
      label: '所属产品',
      render: (val) => val || '-',
    },
    { field: 'version', label: '固件版本' },
    {
      field: 'createTime',
      label: '创建时间',
      render: (val) => (val ? (formatDateTime(val) as string) : '-'),
    },
    { field: 'description', label: '固件描述', span: 2 },
  ];
}

/** 新增/修改固件的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '固件名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入固件名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'productId',
      label: '所属产品',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleProductList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择产品',
      },
      dependencies: {
        triggerFields: ['id'],
        componentProps: (values) => ({
          disabled: !!values.id,
        }),
        rules: (values) => (values.id ? null : 'required'),
      },
    },
    {
      fieldName: 'version',
      label: '版本号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入版本号',
      },
      dependencies: {
        triggerFields: ['id'],
        componentProps: (values) => ({
          disabled: !!values.id,
        }),
        rules: (values) => (values.id ? null : 'required'),
      },
    },
    {
      fieldName: 'description',
      label: '固件描述',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入固件描述',
        rows: 3,
      },
    },
    {
      fieldName: 'fileUrl',
      label: '固件文件',
      component: 'FileUpload',
      componentProps: {
        maxNumber: 1,
        accept: ['bin', 'zip', 'pdf'],
        maxSize: 50,
        helpText: '支持上传 .bin、.zip、.pdf 格式的固件文件，最大 50MB',
      },
      dependencies: {
        triggerFields: ['id'],
        componentProps: (values) => ({
          disabled: !!values.id,
        }),
        rules: (values) => (values.id ? null : 'required'),
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '固件名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入固件名称',
        clearable: true,
      },
    },
    {
      fieldName: 'productId',
      label: '产品',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleProductList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择产品',
        clearable: true,
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '固件编号',
      minWidth: 80,
    },
    {
      field: 'name',
      title: '固件名称',
      minWidth: 150,
    },
    {
      field: 'version',
      title: '版本号',
      minWidth: 120,
    },
    {
      field: 'description',
      title: '固件描述',
      minWidth: 200,
    },
    {
      field: 'productId',
      title: '所属产品',
      minWidth: 150,
      slots: { default: 'productName' },
    },
    {
      field: 'fileUrl',
      title: '固件文件',
      minWidth: 120,
      slots: { default: 'fileUrl' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
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
