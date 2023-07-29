<script lang="ts" setup>
import { ref, unref } from 'vue'
import { dataScopeFormSchema } from './role.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import type { TreeItem } from '@/components/Tree'
import { BasicTree } from '@/components/Tree'
import { getRole } from '@/api/system/role'
import { listSimpleDept } from '@/api/system/dept'
import { handleTree } from '@/utils/tree'
import { assignRoleDataScope } from '@/api/system/permission'

defineOptions({ name: 'SystemRoleScopeModal' })

const emit = defineEmits(['success', 'register'])
const { t } = useI18n()
const { createMessage } = useMessage()
const treeData = ref<TreeItem[]>([])

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: dataScopeFormSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 },
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
  }
  finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>

<template>
  <BasicModal v-bind="$attrs" title="编辑角色数据权限" @register="registerModal" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <template #dataScopeDeptIds="{ model, field }">
        <BasicTree
          v-model:value="model[field]"
          :tree-data="treeData"
          :field-names="{ title: 'name', key: 'id' }"
          :check-strictly="false"
          checkable
          toolbar
          title="部门分配"
        />
      </template>
    </BasicForm>
  </BasicModal>
</template>
