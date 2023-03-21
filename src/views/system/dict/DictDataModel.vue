<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="PostModal">
import { ref, computed, unref } from 'vue'
import { BasicModal, useModalInner } from '@/components/Modal'
import { BasicForm, useForm } from '@/components/Form'
import { dataFormSchema } from './dict.data'
import { createDictDataApi, getDictDataApi, updateDictDataApi } from '@/api/system/dict/data'

const emit = defineEmits(['success', 'register'])
const isUpdate = ref(true)
const rowId = ref()

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 100,
  baseColProps: { span: 24 },
  schemas: dataFormSchema,
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
    const res = await getDictDataApi(data.record.id)
    rowId.value = res.id
    setFieldsValue({
      ...res
    })
  }
})

const getTitle = computed(() => (!unref(isUpdate) ? '新增字典分类' : '编辑字典分类'))

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    if (unref(isUpdate)) {
      await updateDictDataApi(values)
    } else {
      await createDictDataApi(values)
    }
    closeModal()
    emit('success')
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
