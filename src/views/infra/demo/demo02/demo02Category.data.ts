import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { getDemo02CategoryPage } from '@/api/infra/demo/demo02'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '名字',
    dataIndex: 'name',
    width: 290
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 120,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    }
  }
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '名字',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '创建时间',
    field: 'createTime',
    component: 'RangePicker',
    colProps: { span: 8 }
  }
]

export const createFormSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input'
  },
  {
    label: '名字',
    field: 'name',
    required: true,
    component: 'Input'
  },
  {
    label: '父级编号',
    field: 'parentId',
    required: true,
    component: 'ApiTreeSelect',
    componentProps: {
      api: () => getDemo02CategoryPage(null),
      parentLabel: '顶级示例分类',
      fieldNames: {
        label: 'name',
        key: 'id',
        value: 'id'
      },
      handleTree: 'id'
    }
  }
]

export const updateFormSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input'
  },
  {
    label: '名字',
    field: 'name',
    required: true,
    component: 'Input'
  },
  {
    label: '父级编号',
    field: 'parentId',
    required: true,
    component: 'ApiTreeSelect',
    componentProps: {
      api: () => getDemo02CategoryPage(null),
      fieldNames: {
        parentLabel: '顶级示例分类',
        label: 'name',
        key: 'id',
        value: 'id'
      },
      handleTree: 'id'
    }
  }
]
