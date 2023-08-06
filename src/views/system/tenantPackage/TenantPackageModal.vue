<script lang="ts" setup>
import { ref, unref } from 'vue'
import { without } from 'lodash-es'
import { formSchema } from './tenantPackage.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicForm, useForm } from '@/components/Form'
import type { CheckedEvent, CheckedKeys, TreeItem } from '@/components/Tree'
import { BasicTree } from '@/components/Tree'
import { BasicModal, useModalInner } from '@/components/Modal'
import { createTenantPackage, getTenantPackage, updateTenantPackage } from '@/api/system/tenantPackage'
import { listSimpleMenus } from '@/api/system/menu'
import { handleTree } from '@/utils/tree'

defineOptions({ name: 'SystemTenantPackageModal' })

const emit = defineEmits(['success', 'register'])
const { t } = useI18n()
const { createMessage } = useMessage()
const isUpdate = ref(true)
const treeData = ref<TreeItem[]>([])
const menuKeys = ref<number[]>([])
const menuHalfKeys = ref<number[]>([])
// 默认展开的层级
const defaultExpandLevel = ref<number>(1)
// 祖先节点list
const parentIdSets = ref<Set<number>>(new Set())
const treeRef = ref()

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 },
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  resetFields()
  menuReset()
  setModalProps({ confirmLoading: false })
  if (unref(treeData).length === 0) {
    const res = await listSimpleMenus()
    treeData.value = handleTree(res, 'id')
    // 去重 拿到所有的祖先节点
    parentIdSets.value = new Set<number>(res.map(item => item.parentId))
  }
  isUpdate.value = !!data?.isUpdate

  if (unref(isUpdate)) {
    const res = await getTenantPackage(data.record.id)
    // 默认关联节点  需要排除所有的祖先节点  否则会全部勾选
    // 只保留子节点 关联情况下会自己选中父节点
    // 排除祖先节点后的子节点  达到"独立"的效果 但可以进行关联选择
    const excludeParentIds: number[] = without(res.menuIds, ...Array.from(parentIdSets.value))
    // 这里的checkedKeys为包含所有节点的数组  用作判断数组是否修改过
    menuKeys.value = res.menuIds
    // 这里只控制页面显示 不包含祖先节点
    res.menuIds = excludeParentIds
    await setFieldsValue({ ...res })
  }

  // 默认展开的层级
  if (unref(treeRef))
    unref(treeRef).filterByLevel(defaultExpandLevel.value)
})

async function handleSubmit() {
  try {
    const values = await validate()
    values.menuIds = [...menuKeys.value, ...menuHalfKeys.value]
    setModalProps({ confirmLoading: true })
    if (unref(isUpdate))
      await updateTenantPackage(values)
    else
      await createTenantPackage(values)

    closeModal()
    emit('success')
    createMessage.success(t('common.saveSuccessText'))
  }
  finally {
    setModalProps({ confirmLoading: false })
  }
}

function menuReset() {
  menuKeys.value = []
  menuHalfKeys.value = []
}

/**
 * 父子节点关联情况下 checkedKeys为选中的菜单 e.halfCheckedKeys为父节点数组
 * 父子节点独立情况下 checkedKeys为{checked: number[], halfChecked: number[]} e.halfCheckedKeys为null
 * @param checkedKeys 选中的菜单
 * @param e event
 */
function menuCheck(checkedKeys: CheckedKeys, event: CheckedEvent) {
  if (Array.isArray(checkedKeys)) {
    menuKeys.value = checkedKeys
    menuHalfKeys.value = event.halfCheckedKeys!
  }
}
</script>

<template>
  <BasicModal v-bind="$attrs" :title="isUpdate ? t('action.edit') : t('action.create')" @register="registerModal" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <template #menuIds="{ model, field }">
        <BasicTree
          v-if="treeData.length"
          ref="treeRef"
          v-model:checkedKeys="model[field]"
          :tree-data="treeData"
          :field-names="{ title: 'name', key: 'id' }"
          checkable
          toolbar
          search
          :show-strictly-button="false"
          :selectable="false"
          title="菜单分配"
          @check="menuCheck"
        />
      </template>
    </BasicForm>
  </BasicModal>
</template>
