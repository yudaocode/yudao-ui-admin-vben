import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsDigestApi } from '#/api/fms/config/digest';

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<FmsDigestApi.Digest>['columns'] {
  return [
    { field: 'content', title: '摘要内容', minWidth: 480 },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      align: 'center',
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

/** 新增/修改表单 */
export function useFormSchema(): VbenFormSchema[] {
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
      fieldName: 'accountSetId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'content',
      label: '摘要内容',
      component: 'Textarea',
      rules: 'required',
      componentProps: {
        placeholder: '请输入摘要内容',
        maxlength: 500,
        rows: 4,
        showWordLimit: true,
      },
    },
  ];
}

/** 摘要库表单 */
export function useDigestLibraryFormSchema(): VbenFormSchema[] {
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
      fieldName: 'content',
      label: '摘要内容',
      component: 'Textarea',
      rules: 'required',
      componentProps: {
        placeholder: '请输入摘要内容',
        maxlength: 500,
        rows: 3,
        showWordLimit: true,
      },
    },
  ];
}

/** 摘要库列表字段 */
export function useDigestLibraryGridColumns(): VxeTableGridOptions<FmsDigestApi.Digest>['columns'] {
  return [
    { field: 'content', title: '摘要内容', minWidth: 360 },
    {
      title: '操作',
      width: 160,
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}
