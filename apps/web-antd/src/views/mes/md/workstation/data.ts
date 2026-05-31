import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdWorkstationApi } from '#/api/mes/md/workstation';

import { h, markRaw } from 'vue';

import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getWarehouseSimpleList } from '#/api/mes/wm/warehouse';
import { getWarehouseAreaSimpleList } from '#/api/mes/wm/warehouse/area';
import { getWarehouseLocationSimpleList } from '#/api/mes/wm/warehouse/location';
import { ProProcessSelect } from '#/views/mes/pro/process/components';

import { MdWorkshopSelect } from './components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改工作站的表单 */
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
      label: '工作站编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入工作站编码',
      },
      rules: 'required',
      suffix:
        formType === 'detail'
          ? undefined
          : () =>
              h(
                Button,
                {
                  type: 'default',
                  onClick: async () => {
                    const code = await generateAutoCode(
                      MesAutoCodeRuleCode.MD_WORKSTATION_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '工作站名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入工作站名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'workshopId',
      label: '所在车间',
      component: markRaw(MdWorkshopSelect),
      componentProps: {
        placeholder: '请选择车间',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'address',
      label: '工作站地点',
      component: 'Input',
      componentProps: {
        placeholder: '请输入工作站地点',
      },
    },
    {
      fieldName: 'processId',
      label: '所属工序',
      component: markRaw(ProProcessSelect),
      componentProps: {
        placeholder: '请选择所属工序',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'warehouseId',
      label: '仓库',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getWarehouseSimpleList,
        labelField: 'name',
        onChange: async () => {
          await formApi?.setFieldValue('locationId', undefined);
          await formApi?.setFieldValue('areaId', undefined);
        },
        placeholder: '请选择仓库',
        valueField: 'id',
      },
    },
    {
      fieldName: 'locationId',
      label: '库区',
      component: 'Select',
      dependencies: {
        triggerFields: ['warehouseId'],
        disabled: (values) => !values.warehouseId,
        async componentProps(values) {
          const list = values.warehouseId
            ? await getWarehouseLocationSimpleList(values.warehouseId)
            : [];
          return {
            allowClear: true,
            onChange: async () => {
              await formApi?.setFieldValue('areaId', undefined);
            },
            fieldNames: { label: 'name', value: 'id' },
            options: list,
            placeholder: '请选择库区',
          };
        },
      },
    },
    {
      fieldName: 'areaId',
      label: '库位',
      component: 'Select',
      dependencies: {
        triggerFields: ['locationId'],
        disabled: (values) => !values.locationId,
        async componentProps(values) {
          const list = values.locationId
            ? await getWarehouseAreaSimpleList(values.locationId)
            : [];
          return {
            allowClear: true,
            fieldNames: { label: 'name', value: 'id' },
            options: list,
            placeholder: '请选择库位',
          };
        },
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '工作站编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入工作站编码',
      },
    },
    {
      fieldName: 'name',
      label: '工作站名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入工作站名称',
      },
    },
    {
      fieldName: 'workshopId',
      label: '所在车间',
      component: markRaw(MdWorkshopSelect),
      componentProps: {
        allowClear: true,
        placeholder: '请选择车间',
      },
    },
    {
      fieldName: 'processId',
      label: '所属工序',
      component: markRaw(ProProcessSelect),
      componentProps: {
        allowClear: true,
        placeholder: '请选择工序',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesMdWorkstationApi.Workstation>['columns'] {
  return [
    {
      field: 'code',
      title: '工作站编码',
      minWidth: 150,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '工作站名称',
      minWidth: 150,
    },
    {
      field: 'address',
      title: '工作站地点',
      minWidth: 150,
    },
    {
      field: 'workshopName',
      title: '所在车间',
      width: 140,
    },
    {
      field: 'processName',
      title: '所属工序',
      width: 140,
    },
    {
      field: 'status',
      title: '状态',
      width: 120,
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
      width: 210,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 工作站选择弹窗的搜索表单 */
export function useWorkstationSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '工作站编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入工作站编码',
      },
    },
    {
      fieldName: 'processId',
      label: '所属工序',
      component: markRaw(ProProcessSelect),
      componentProps: {
        placeholder: '请选择工序',
      },
    },
    {
      fieldName: 'workshopId',
      label: '所在车间',
      component: markRaw(MdWorkshopSelect),
      componentProps: {
        placeholder: '请选择车间',
      },
    },
  ];
}

/** 工作站选择弹窗的字段 */
export function useWorkstationSelectGridColumns(): VxeTableGridOptions<MesMdWorkstationApi.Workstation>['columns'] {
  return [
    { type: 'checkbox', width: 50 },
    {
      field: 'code',
      title: '工作站编码',
      width: 150,
    },
    {
      field: 'name',
      title: '工作站名称',
      minWidth: 160,
    },
    {
      field: 'address',
      title: '工作站地点',
      minWidth: 140,
    },
    {
      field: 'workshopName',
      title: '所在车间',
      width: 130,
    },
    {
      field: 'processName',
      title: '所属工序',
      width: 130,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 140,
    },
  ];
}
