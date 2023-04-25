<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="isUpdate ? '编辑' : '新增'" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <template #menuIds="{ model, field }">
        <BasicTree
          v-model:value="model[field]"
          :treeData="treeData"
          :fieldNames="{ title: 'name', key: 'id' }"
          :checkStrictly="true"
          checkable
          toolbar
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
const treeData = ref<TreeItem[]>([])

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 }
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  resetFields()
  setModalProps({ confirmLoading: false })
  if (unref(treeData).length === 0) {
    const res = await listSimpleMenus()
    treeData.value = handleTree(res, 'id')
  }
  isUpdate.value = !!data?.isUpdate

  if (unref(isUpdate)) {
    const res = await getTenantPackage(data.record.id)
    setFieldsValue({ ...res })
  }
})

async function handleSubmit() {
  try {
    const values = await validate()
    values.menuIds = values.menuIds.checked
    setModalProps({ confirmLoading: true })
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
