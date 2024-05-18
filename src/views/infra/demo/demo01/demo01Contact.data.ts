import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 80
  },
  {
    title: '名字',
    dataIndex: 'name',
    width: 160
  },
  {
    title: '性别',
    dataIndex: 'sex',
    width: 80,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_USER_SEX)
    }
  },
  {
    title: '出生年',
    dataIndex: 'birthday',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    }
  },
  {
    title: '简介',
    dataIndex: 'description',
    width: 180
  },
  {
    title: '头像',
    dataIndex: 'avatar',
    width: 120,
    customRender: ({ text }) => {
      return useRender.renderImg(text)
    }
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
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
    label: '性别',
    field: 'sex',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX)
    },
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
    label: '性别',
    field: 'sex',
    required: true,
    component: 'RadioGroup',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX)
    }
  },
  {
    label: '出生年月',
    field: 'birthday',
    required: true,
    component: 'DatePicker',
    componentProps: {
      showTime: true,
      format: 'YYYY-MM-DD',
      valueFormat: 'x'
    }
  },
  {
    label: '简介',
    field: 'description',
    required: true,
    component: 'Editor'
  },
  {
    label: '头像',
    field: 'avatar',
    required: true,
    component: 'FileUpload',
    componentProps: {
      fileType: 'image',
      maxCount: 1
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
    label: '性别',
    field: 'sex',
    required: true,
    component: 'RadioGroup',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX)
    }
  },
  {
    label: '出生年',
    field: 'birthday',
    required: true,
    component: 'DatePicker',
    componentProps: {
      showTime: true,
      format: 'YYYY-MM-DD',
      valueFormat: 'x'
    }
  },
  {
    label: '简介',
    field: 'description',
    required: true,
    component: 'Editor'
  },
  {
    label: '头像',
    field: 'avatar',
    required: true,
    component: 'FileUpload',
    componentProps: {
      fileType: 'image',
      maxCount: 1
    }
  }
]
