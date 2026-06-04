import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProWorkRecordApi } from '#/api/mes/pro/workrecord';
import type { SystemUserApi } from '#/api/system/user';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';
import { MdWorkstationSelect } from '#/views/mes/md/workstation/components';

/** 关联数据 */
let userList: SystemUserApi.User[] = [];
getSimpleUserList().then((data) => (userList = data));

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择用户',
        valueField: 'id',
      },
    },
    {
      fieldName: 'workstationId',
      label: '工作站',
      component: markRaw(MdWorkstationSelect),
      componentProps: {
        placeholder: '请选择工作站',
      },
    },
    {
      fieldName: 'type',
      label: '操作类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_PRO_WORK_RECORD_TYPE, 'number'),
        placeholder: '请选择操作类型',
      },
    },
    {
      fieldName: 'createTime',
      label: '操作时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesProWorkRecordApi.WorkRecordLog>['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 80,
    },
    {
      field: 'userId',
      title: '用户',
      width: 140,
      formatter: ({ row }) =>
        row.userNickname ||
        userList.find((user) => user.id === row.userId)?.nickname ||
        '',
    },
    {
      field: 'workstationCode',
      title: '工作站编码',
      width: 140,
    },
    {
      field: 'workstationName',
      title: '工作站名称',
      minWidth: 160,
    },
    {
      field: 'type',
      title: '操作类型',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_WORK_RECORD_TYPE },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
  ];
}
