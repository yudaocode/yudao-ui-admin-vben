import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AlertRecordApi } from '#/api/iot/alert/record';
import type { IotDeviceApi } from '#/api/iot/device/device';
import type { IotProductApi } from '#/api/iot/product/product';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getSimpleAlertConfigList } from '#/api/iot/alert/config';
import { getSimpleDeviceList } from '#/api/iot/device/device';
import { getSimpleProductList } from '#/api/iot/product/product';
import { getRangePickerDefaultProps } from '#/utils';

/** 关联数据 */
let productList: IotProductApi.Product[] = [];
let deviceList: IotDeviceApi.Device[] = [];
getSimpleProductList().then((data) => (productList = data));
getSimpleDeviceList().then((data) => (deviceList = data));

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'configId',
      label: '告警配置',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleAlertConfigList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择告警配置',
        allowClear: true,
        showSearch: true,
      },
    },
    {
      fieldName: 'configLevel',
      label: '告警级别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_ALERT_LEVEL, 'number'),
        placeholder: '请选择告警级别',
        allowClear: true,
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
        allowClear: true,
        showSearch: true,
      },
    },
    {
      fieldName: 'deviceId',
      label: '设备',
      component: 'ApiSelect',
      componentProps: {
        api: (params?: { productId?: number }) =>
          getSimpleDeviceList(undefined, params?.productId),
        labelField: 'deviceName',
        valueField: 'id',
        placeholder: '请选择设备',
        allowClear: true,
        showSearch: true,
      },
      dependencies: {
        triggerFields: ['productId'],
        componentProps: (values) => {
          return {
            params: { productId: values.productId },
          };
        },
        trigger: (values, formApi) => {
          if (values.deviceId !== undefined) {
            void formApi.setFieldValue('deviceId', undefined);
          }
        },
      },
    },
    {
      fieldName: 'processStatus',
      label: '是否处理',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
        placeholder: '请选择是否处理',
        allowClear: true,
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
export function useGridColumns(): VxeTableGridOptions<AlertRecordApi.AlertRecord>['columns'] {
  return [
    {
      field: 'id',
      title: '记录编号',
      minWidth: 80,
    },
    {
      field: 'configName',
      title: '告警名称',
      minWidth: 150,
    },
    {
      field: 'configLevel',
      title: '告警级别',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IOT_ALERT_LEVEL },
      },
    },
    {
      field: 'productId',
      title: '产品名称',
      minWidth: 120,
      formatter: ({ cellValue }) =>
        productList.find((product) => product.id === cellValue)?.name || '-',
    },
    {
      field: 'deviceId',
      title: '设备名称',
      minWidth: 120,
      formatter: ({ cellValue }) =>
        deviceList.find((device) => device.id === cellValue)?.deviceName || '-',
    },
    {
      field: 'deviceMessage',
      title: '触发的设备消息',
      minWidth: 150,
      slots: { default: 'deviceMessage' },
    },
    {
      field: 'processStatus',
      title: '是否处理',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'processRemark',
      title: '处理结果',
      minWidth: 150,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
