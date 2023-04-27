<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="编辑角色数据权限" @ok="handleSubmit">
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
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { BasicTree, TreeItem } from '@/components/Tree'
import { dataScopeFormSchema } from './role.data'
import { getRole } from '@/api/system/role'
import { listSimpleDept } from '@/api/system/dept'
import { handleTree } from '@/utils/tree'
import { assignRoleDataScope } from '@/api/system/permission'

const { t } = useI18n()
const { createMessage } = useMessage()
const emit = defineEmits(['success', 'register'])
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
  const res = await getRole(data.record.id)
  res.roleId = data.record.id
  setFieldsValue({ ...res })
})

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    await assignRoleDataScope(values)
    closeModal()
    emit('success')
    createMessage.success(t('common.saveSuccessText'))
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
