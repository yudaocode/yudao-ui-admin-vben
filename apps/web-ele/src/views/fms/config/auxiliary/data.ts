import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsAuxiliaryItemApi } from '#/api/fms/config/auxiliary/item';

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'search',
      label: '关键词',
      component: 'Input',
      componentProps: {
        placeholder: '请输入编码或名称',
        clearable: true,
      },
    },
  ];
}

/** 列表字段 */
export function useGridColumns(options: {
  isInventory: boolean;
  showActions: boolean;
  showCheckbox: boolean;
}): VxeTableGridOptions<FmsAuxiliaryItemApi.AuxiliaryItem>['columns'] {
  const columns: VxeTableGridOptions<FmsAuxiliaryItemApi.AuxiliaryItem>['columns'] =
    [
      { field: 'code', title: '编码', minWidth: 130 },
      { field: 'name', title: '名称', minWidth: 180 },
      { field: 'remark', title: '备注', minWidth: 180 },
    ];
  // 存货类别展示规格、单位
  if (options.isInventory) {
    columns.push(
      { field: 'specification', title: '规格', minWidth: 130 },
      { field: 'unit', title: '单位', minWidth: 100 },
    );
  }
  columns.push({
    field: 'status',
    title: '状态',
    width: 90,
    align: 'center',
    slots: { default: 'status' },
  });
  // 只读账套或无写权限时，隐藏操作列
  if (options.showActions) {
    columns.push({
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' },
    });
  }
  // 只读账套或无删除权限时，隐藏多选列
  if (options.showCheckbox) {
    columns.unshift({ type: 'checkbox', width: 55 });
  }
  return columns;
}

/** 类别新增/修改表单 */
export function useTypeFormSchema(): VbenFormSchema[] {
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
      fieldName: 'name',
      label: '名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入分类名称',
        maxlength: 255,
        clearable: true,
      },
    },
  ];
}

/** 项目新增/修改表单 */
export function useItemFormSchema(isInventory: boolean): VbenFormSchema[] {
  const schema: VbenFormSchema[] = [
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
      label: '编码',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入编码',
        maxlength: 64,
        clearable: true,
      },
    },
    {
      fieldName: 'name',
      label: '名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入名称',
        maxlength: 255,
        clearable: true,
      },
    },
  ];
  // 存货类别需要录入规格、单位
  if (isInventory) {
    schema.push(
      {
        fieldName: 'specification',
        label: '规格',
        component: 'Input',
        componentProps: {
          placeholder: '请输入规格',
          maxlength: 255,
          clearable: true,
        },
      },
      {
        fieldName: 'unit',
        label: '单位',
        component: 'Input',
        componentProps: {
          placeholder: '请输入单位',
          maxlength: 255,
          clearable: true,
        },
      },
    );
  }
  schema.push({
    fieldName: 'remark',
    label: '备注',
    component: 'Textarea',
    componentProps: {
      placeholder: '请输入备注',
      maxlength: 500,
      showWordLimit: true,
      rows: 3,
    },
  });
  return schema;
}
