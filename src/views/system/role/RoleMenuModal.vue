<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="修改角色菜单权限" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <template #menuIds="{ model, field }">
        <BasicTree
          v-model:value="model[field]"
          :treeData="treeData"
          :fieldNames="{ title: 'name', key: 'id' }"
          checkable
          toolbar
          @check="menuCheck"
          title="菜单分配"
        />
      </template>
    </BasicForm>
  </BasicModal>
</template>
<script lang="ts" setup name="SystemRoleMenuModal">
import { ref, unref } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { menuScopeFormSchema } from './role.data'
import { getRole } from '@/api/system/role'
import { BasicTree, TreeItem } from '@/components/Tree'
import { listSimpleMenus } from '@/api/system/menu'
import { handleTree } from '@/utils/tree'
import { assignRoleMenu, listRoleMenus } from '@/api/system/permission'

const { t } = useI18n()
const { createMessage } = useMessage()
const emit = defineEmits(['success', 'register'])
const treeData = ref<TreeItem[]>([])
const menuKeys = ref<(string | number)[]>([])
const menuHalfKeys = ref<(string | number)[]>([])

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: menuScopeFormSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 }
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  resetFields()
  menuReset()
  setModalProps({ confirmLoading: false })
  if (unref(treeData).length === 0) {
    const res = await listSimpleMenus()
    treeData.value = handleTree(res, 'id')
  }

  const res = await getRole(data.record.id)
  const menuRes = await listRoleMenus(data.record.id)
  res.roleId = data.record.id
  res.menuIds = menuRes
  menuKeys.value = res.menuIds
  setFieldsValue({ ...res })
})

function menuCheck(checkedKeys, e) {
  menuKeys.value = checkedKeys as (string | number)[]
  menuHalfKeys.value = e.halfCheckedKeys as (string | number)[]
}

function menuReset() {
  menuKeys.value = []
  menuHalfKeys.value = []
}

async function handleSubmit() {
  try {
    const values = await validate()
    values.menuIds = menuKeys.value.concat(menuHalfKeys.value)
    setModalProps({ confirmLoading: true })
    await assignRoleMenu(values)
    closeModal()
    emit('success')
  } finally {
    createMessage.success(t('common.saveSuccessText'))
    setModalProps({ confirmLoading: false })
  }
}
</script>
