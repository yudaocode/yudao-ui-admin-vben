import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { getSimpleProductCategoryList } from '#/api/iot/product/category';
import {
  deleteProduct,
  exportProduct,
  getProductPage,
} from '#/api/iot/product/product';

/** 新增/修改产品的表单 */
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
      label: '产品名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入产品名称',
      },
      rules: z
        .string()
        .min(1, '产品名称不能为空')
        .max(64, '产品名称长度不能超过 64 个字符'),
    },
    {
      fieldName: 'categoryId',
      label: '产品分类',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleProductCategoryList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择产品分类',
      },
      rules: 'required',
    },
    {
      fieldName: 'deviceType',
      label: '设备类型',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: 'required',
    },
    {
      fieldName: 'netType',
      label: '联网方式',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_NET_TYPE, 'number'),
        placeholder: '请选择联网方式',
      },
      rules: 'required',
    },
    {
      fieldName: 'protocolType',
      label: '接入协议',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_PROTOCOL_TYPE, 'number'),
        placeholder: '请选择接入协议',
      },
      rules: 'required',
    },
    {
      fieldName: 'dataFormat',
      label: '数据格式',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_DATA_FORMAT, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: 'required',
    },
    {
      fieldName: 'description',
      label: '产品描述',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入产品描述',
        rows: 3,
      },
    },
    {
      fieldName: 'validateType',
      label: '认证方式',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_VALIDATE_TYPE, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '产品状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: 'required',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '产品名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入产品名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'productKey',
      label: 'ProductKey',
      component: 'Input',
      componentProps: {
        placeholder: '请输入产品标识',
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: 'ID',
      width: 80,
    },
    {
      field: 'productKey',
      title: 'ProductKey',
      minWidth: 150,
    },
    {
      field: 'categoryId',
      title: '品类',
      minWidth: 120,
      slots: { default: 'category' },
    },
    {
      field: 'deviceType',
      title: '设备类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE },
      },
    },
    {
      field: 'icon',
      title: '产品图标',
      width: 100,
      slots: { default: 'icon' },
    },
    {
      field: 'picUrl',
      title: '产品图片',
      width: 100,
      slots: { default: 'picUrl' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 加载产品分类列表 */
export async function loadCategoryList() {
  return await getSimpleProductCategoryList();
}

/** 获取分类名称 */
export function getCategoryName(categoryList: any[], categoryId: number) {
  const category = categoryList.find((c: any) => c.id === categoryId);
  return category?.name || '未分类';
}

/** 删除产品 */
export async function handleDeleteProduct(row: any, onSuccess?: () => void) {
  const hideLoading = message.loading({
    content: `正在删除 ${row.name}...`,
    duration: 0,
  });
  try {
    await deleteProduct(row.id);
    message.success(`删除 ${row.name} 成功`);
    onSuccess?.();
  } finally {
    hideLoading();
  }
}

/** 导出产品 */
export async function handleExportProduct(searchParams: any) {
  const data = await exportProduct(searchParams);
  downloadFileFromBlobPart({ fileName: '产品列表.xls', source: data });
}

/** 查询产品列表 */
export async function queryProductList({ page }: any, searchParams: any) {
  return await getProductPage({
    pageNo: page.currentPage,
    pageSize: page.pageSize,
    ...searchParams,
  });
}

/** 创建图片预览状态 */
export function useImagePreview() {
  const previewVisible = ref(false);
  const previewImage = ref('');

  function handlePreviewImage(url: string) {
    previewImage.value = url;
    previewVisible.value = true;
  }

  return {
    previewVisible,
    previewImage,
    handlePreviewImage,
  };
}
