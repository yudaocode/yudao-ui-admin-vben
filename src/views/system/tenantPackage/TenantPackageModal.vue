<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="isUpdate ? '编辑' : '新增'" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <template #menuIds="{ model, field }">
        <BasicTree
          v-model:value="model[field]"
          :treeData="menuTree"
          :fieldNames="{ title: 'name', key: 'id' }"
          :checkStrictly="false"
          checkable
          toolbar
          @check="menuCheck"
          title="菜单分配"
        />
      </template>
    </BasicForm>
  </BasicModal>
</template>
<script lang="ts" setup name="SystemTenantPackageModal">
import { ref, unref } from 'vue'
import { BasicForm, useForm } from '@/components/Form'
import { BasicTree, TreeItem } from '@/components/Tree'
import { BasicModal, useModalInner } from '@/components/Modal'
import { formSchema } from './tenantPackage.data'
import { createTenantPackage, getTenantPackage, updateTenantPackage } from '@/api/system/tenantPackage'
import { listSimpleMenus } from '@/api/system/menu'
import { handleTree } from '@/utils/tree'

const emit = defineEmits(['success', 'register'])
const isUpdate = ref(true)
const menuTree = ref<TreeItem[]>([])
const menuKeys = ref<(string | number)[]>([])
const menuHalfKeys = ref<(string | number)[]>([])

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 }
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  menuKeys.value = []
  menuHalfKeys.value = []
  resetFields()
  setModalProps({ confirmLoading: false })
  isUpdate.value = !!data?.isUpdate
  if (unref(isUpdate)) {
    const res = await getTenantPackage(data.record.id)
    const menus = await listSimpleMenus()
    menuTree.value = handleTree(menus, 'id')
    setFieldsValue({ ...res })
  }
})

function menuCheck(checkedKeys, e) {
  menuKeys.value = checkedKeys as (string | number)[]
  menuHalfKeys.value = e.halfCheckedKeys as (string | number)[]
}

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    values.menuIds = menuKeys.value.concat(menuHalfKeys.value)
    if (unref(isUpdate)) {
      await updateTenantPackage(values)
    } else {
      await createTenantPackage(values)
    }
    closeModal()
    emit('success')
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
