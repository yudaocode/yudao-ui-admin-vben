<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="PostModal">
import { ref, computed, unref } from 'vue'
import { BasicModal, useModalInner } from '@/components/Modal'
import { BasicForm, FormSchema, useForm } from '@/components/Form'

const formSchema: FormSchema[] = [
  {
    field: 'name',
    label: '岗位名称',
    required: true,
    component: 'Input'
  },
  {
    field: 'code',
    label: '岗位编码',
    required: true,
    component: 'Input'
  },
  {
    field: 'status',
    label: '状态',
    component: 'RadioButtonGroup',
    defaultValue: '0',
    componentProps: {
      options: [
        { label: '启用', value: '0' },
        { label: '停用', value: '1' }
      ]
    }
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea'
  }
]

const emit = defineEmits(['success', 'register'])
const isUpdate = ref(true)
const rowId = ref('')

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 100,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  actionColOptions: {
    span: 23
  }
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  resetFields()
  setModalProps({ confirmLoading: false })
  isUpdate.value = !!data?.isUpdate

  if (unref(isUpdate)) {
    rowId.value = data.record.id
    setFieldsValue({
      ...data.record
    })
  }
})

const getTitle = computed(() => (!unref(isUpdate) ? '新增账号' : '编辑账号'))

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    // TODO custom api
    console.log(values)
    closeModal()
    emit('success', { isUpdate: unref(isUpdate), values: { ...values, id: rowId.value } })
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
