<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <template #menuIds="{ model, field }">
        <BasicTree
          v-model:value="model[field]"
          :treeData="menuTree"
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
<script lang="ts" setup name="TenantPackageModal">
import { ref, computed, unref } from 'vue'
import { BasicForm, useForm } from '@/components/Form'
import { BasicTree, TreeItem } from '@/components/Tree'
import { BasicModal, useModalInner } from '@/components/Modal'
import { formSchema } from './tenantPackage.data'
import { createTenantPackageApi, getTenantPackageApi, updateTenantPackageApi } from '@/api/system/tenantPackage'
import { listSimpleMenusApi } from '@/api/system/menu'
import { handleTree } from '@/utils/tree'

const emit = defineEmits(['success', 'register'])
const isUpdate = ref(true)
const rowId = ref()
const menuTree = ref<TreeItem[]>([])
const menuKeys = ref<(string | number)[]>([])
const menuHalfKeys = ref<(string | number)[]>([])

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 100,
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
    const res = await getTenantPackageApi(data.record.id)
    rowId.value = res.id
    const menus = await listSimpleMenusApi()
    menuTree.value = handleTree(menus, 'id')
    setFieldsValue({ ...res })
  }
})

const getTitle = computed(() => (!unref(isUpdate) ? '新增租户套餐' : '编辑租户套餐'))

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
      await updateTenantPackageApi(values)
    } else {
      await createTenantPackageApi(values)
    }
    closeModal()
    emit('success')
  } finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>
