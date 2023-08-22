import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '用户',
    dataIndex: 'nickname',
    width: 200,
  },
  {
    title: '获得积分',
    dataIndex: 'point',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderTag(text, text > 0 ? 'blue' : 'red')
    },
  },
  {
    title: '总积分',
    dataIndex: 'totalPoint',
    width: 100,
  },
  {
    title: '标题',
    dataIndex: 'title',
    width: 180,
  },
  {
    title: '描述',
    dataIndex: 'description',
    width: 180,
  },
  {
    title: '业务编码',
    dataIndex: 'bizId',
    width: 100,
  },
  {
    title: '业务类型',
    dataIndex: 'bizType',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.MEMBER_POINT_BIZ_TYPE)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '用户',
    field: 'nickname',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '业务类型',
    field: 'bizType',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.MEMBER_POINT_BIZ_TYPE),
    },
    colProps: { span: 8 },
  },
  {
    label: '积分标题',
    field: 'title',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '获得时间',
    field: 'createTime',
    component: 'RangePicker',
    colProps: { span: 8 },
  },
]
