import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { Demo02CategoryApi } from '#/api/infra/demo/demo02';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import { getDemo02CategoryList } from '#/api/infra/demo/demo02';
import { getRangePickerDefaultProps } from '#/utils/date';
import { handleTree } from '#/utils/tree';

import { useAccess } from '@vben/access';

const { hasAccessByCodes } = useAccess();

/** 新增/修改的表单 */
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
      fieldName: 'parentId',
      label: '上级示例分类',
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: async () => {
          const data = await getDemo02CategoryList({});
          data.unshift({
            id: 0,
            name: '顶级示例分类',
          });
          return handleTree(data);
        },
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择上级示例分类',
        treeDefaultExpandAll: true,
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'name',
      label: '名字',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入名字',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '名字',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入名字',
      },
    },
    {
      fieldName: 'parentId',
      label: '父级编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入父级编号',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(
  onActionClick?: OnActionClickFn<Demo02CategoryApi.Demo02Category>,
): VxeTableGridOptions<Demo02CategoryApi.Demo02Category>['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      minWidth: 120,
    },
    {
      field: 'name',
      title: '名字',
      minWidth: 120,
      treeNode: true,
    },
    {
      field: 'parentId',
      title: '父级编号',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 200,
      align: 'center',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      cellRender: {
        attrs: {
          nameField: 'id',
          nameTitle: '示例分类',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'append',
            text: '新增下级',
            show: hasAccessByCodes(['infra:demo02-category:create']),
          },
          {
            code: 'edit',
            show: hasAccessByCodes(['infra:demo02-category:update']),
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['infra:demo02-category:delete']),
            disabled: (row: Demo02CategoryApi.Demo02Category) => {
              return !!(row.children && row.children.length > 0);
            },
          },
        ],
      },
    },
  ];
}
