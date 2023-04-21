<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="isUpdate ? '编辑' : '新增'" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <template #dataScopeDeptIds="{ model, field }">
        <BasicTree
          v-model:value="model[field]"
          :treeData="treeData"
          :fieldNames="{ title: 'name', key: 'id' }"
          :checkStrictly="false"
          checkable
          toolbar
          title="部门分配"
        />
      </template>
    </BasicForm>
  </BasicModal>
</template>
<script lang="ts" setup name="SystemRoleScopeModal">
import { ref, unref } from 'vue'
import { BasicModal, useModalInner } from '@/components/Modal'
import { BasicForm, useForm } from '@/components/Form'
import { BasicTree, TreeItem } from '@/components/Tree'
import { dataScopeFormSchema } from './role.data'
import { createRole, getRole, updateRole } from '@/api/system/role'
import { listSimpleDept } from '@/api/system/dept'
import { handleTree } from '@/utils/tree'

const emit = defineEmits(['success', 'register'])
const isUpdate = ref(true)
const treeData = ref<TreeItem[]>([])

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: dataScopeFormSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 }
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  resetFields()
  setModalProps({ confirmLoading: false })
  if (unref(treeData).length === 0) {
    const res = await listSimpleDept()
    treeData.value = handleTree(res, 'id')
  }
  isUpdate.value = !!data?.isUpdate

  if (unref(isUpdate)) {
    const res = await getRole(data.record.id)
    setFieldsValue({ ...res })
  }
})

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    if (unref(isUpdate)) {
      await updateRole(values)
    } else {
      await createRole(values)
    }
    closeModal()
    emit('success')
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
