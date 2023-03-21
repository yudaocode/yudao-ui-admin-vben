<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="UserModal">
import { ref, computed, unref } from 'vue'
import { BasicModal, useModalInner } from '@/components/Modal'
import { BasicForm, useForm } from '@/components/Form'
import { formSchema } from './user.data'
import { createUserApi, getUserApi, updateUserApi } from '@/api/system/user'

const emit = defineEmits(['success', 'register'])
const isUpdate = ref(true)
const rowId = ref()

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
    const res = await getUserApi(data.record.id)
    rowId.value = res.id
    setFieldsValue({
      ...res
    })
  }
})

const getTitle = computed(() => (!unref(isUpdate) ? '新增用户' : '编辑用户'))

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    if (unref(isUpdate)) {
      await updateUserApi(values)
    } else {
      await createUserApi(values)
    }
    closeModal()
    emit('success')
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
