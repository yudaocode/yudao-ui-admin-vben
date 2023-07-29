import { Button, Switch } from 'ant-design-vue'
import { h } from 'vue'
import { getSimpleForms } from '@/api/bpm/form'
import { updateModelState } from '@/api/bpm/model'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { useGo } from '@/hooks/web/usePage'
import { useMessage } from '@/hooks/web/useMessage'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    defaultHidden: true,
    width: 100,
  },
  {
    title: '流程标识',
    dataIndex: 'key',
    width: 180,
  },
  {
    title: '流程名称',
    dataIndex: 'name',
    width: 180,
    customRender: ({ record }) => {
      return h(Button, { type: 'link', onClick: handleBpmnDetail.bind(null, record) }, () => record.formName)
    },
  },
  {
    title: '流程分类',
    dataIndex: 'category',
    width: 120,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.BPM_MODEL_CATEGORY)
    },
  },
  {
    title: '表单信息',
    dataIndex: 'formType',
    width: 180,
    customRender: ({ record }) => {
      if (record.formId)
        return h(Button, { type: 'link', onClick: handleFormDetail.bind(null, record) }, () => record.formName)
      else if (record.formCustomCreatePath)
        return h(Button, { type: 'link', onClick: handleFormDetail.bind(null, record) }, () => record.formCustomCreatePath)
      else
        return useRender.renderTag('暂无表单')
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '最新部署的流程定义',
    children: [
      {
        title: '流程版本',
        dataIndex: 'processDefinition.version',
        width: 160,
        customRender: ({ record }) => {
          if (record.processDefinition)
            return useRender.renderTag(`v${record.processDefinition.version}`)
          else
            return useRender.renderTag('未部署')
        },
      },
      {
        title: '激活状态',
        dataIndex: 'processDefinition.suspensionState',
        width: 100,
        customRender: ({ record }) => {
          if (record.processDefinition) {
            if (!Reflect.has(record, 'suspensionState'))
              record.pendingStatus = false

            return h(Switch, {
              checked: record.processDefinition.suspensionState === 1,
              checkedChildren: '激活',
              unCheckedChildren: '挂起',
              onChange(checked: boolean) {
                const newStatus = checked ? 0 : 1
                const { createMessage } = useMessage()
                updateModelState({ id: record.id, state: newStatus })
                  .then(() => {
                    record.status = newStatus
                    createMessage.success('已成功修改流程状态')
                  })
                  .catch(() => {
                    createMessage.error('修改流程状态失败')
                  })
                  .finally(() => {
                    record.pendingStatus = false
                  })
              },
            })
          }
        },
      },
      {
        title: '部署时间',
        dataIndex: 'processDefinition.deploymentTim',
        width: 180,
        customRender: ({ record }) => {
          if (record.processDefinition)
            return useRender.renderDate(record.processDefinition.deploymentTime)
        },
      },
    ],
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '流程标识',
    field: 'key',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '流程名称',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '流程分类',
    field: 'category',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.BPM_MODEL_CATEGORY),
    },
    colProps: { span: 8 },
  },
]

export const formSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input',
  },
  {
    label: '流程标识',
    field: 'key',
    required: true,
    component: 'Input',
    dynamicDisabled: ({ values }) => !!values.id,
  },
  {
    label: '流程名称',
    field: 'name',
    required: true,
    component: 'Input',
    dynamicDisabled: ({ values }) => !!values.id,
  },
  {
    label: '流程分类',
    field: 'category',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.BPM_MODEL_CATEGORY),
    },
  },
  {
    label: '流程描述',
    field: 'description',
    component: 'InputTextArea',
  },
  {
    label: '表单类型',
    field: 'formType',
    component: 'Select',
    ifShow: ({ values }) => !!values.id,
    componentProps: {
      options: getDictOptions(DICT_TYPE.BPM_MODEL_FORM_TYPE),
    },
  },
  {
    label: '流程表单',
    field: 'formId',
    component: 'ApiSelect',
    ifShow: ({ values }) => !!values.id && values.formType === 10,
    componentProps: {
      api: () => getSimpleForms(),
      labelField: 'name',
      valueField: 'id',
    },
  },
  {
    label: '表单提交路由',
    field: 'formCustomCreatePath',
    component: 'Input',
    helpMessage: '自定义表单的提交路径，使用 Vue 的路由地址，例如说：bpm/oa/leave/create',
    ifShow: ({ values }) => !!values.id && values.formType === 20,
  },
  {
    label: '表单查看路由',
    field: 'formCustomViewPath',
    component: 'Input',
    helpMessage: '自定义表单的查看路径，使用 Vue 的路由地址，例如说：bpm/oa/leave/view',
    ifShow: ({ values }) => !!values.id && values.formType === 20,
  },
]

function handleBpmnDetail(record: Recordable) {
  console.info('handleBpmnDetail', record)
}

function handleFormDetail(record: Recordable) {
  if (record.formType === 10) {
    console.info('handleFormDetail')
  }
  else {
    const go = useGo()
    go({ path: record.formCustomCreatePath })
  }
}
