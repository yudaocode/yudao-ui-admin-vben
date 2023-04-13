<template>
  <div class="flex">
    <DeptTree class="w-1/4 xl:w-1/5" @select="handleSelect" />
    <BasicTable @register="registerTable" class="w-3/4 xl:w-4/5" :searchInfo="searchInfo">
      <template #toolbar>
        <a-button type="primary" v-auth="['system:user:create']" :preIcon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
        <a-button type="warning" v-auth="['system:user:export']" :preIcon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'system:user:update', onClick: handleEdit.bind(null, record) }
            ]"
            :dropDownActions="[
              {
                icon: IconEnum.EDIT,
                label: '分配角色',
                auth: 'system:permission:assign-user-role',
                onClick: handleRole.bind(null, record)
              },
              {
                icon: IconEnum.EDIT,
                label: '重置密码',
                auth: 'system:user:update-password',
                onClick: handleResetPwd.bind(null, record)
              },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'system:user:delete',
                popConfirm: {
                  title: t('common.delMessage'),
                  placement: 'left',
                  confirm: handleDelete.bind(null, record)
                }
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <UserModal @register="registerModal" @success="reload()" />
    <UserRoleModal @register="registerRoleModal" @success="reload()" />
    <ResetPwdModal @register="registerPwdModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="SystemUser">
import { reactive } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import UserModal from './UserModal.vue'
import UserRoleModal from './UserRoleModal.vue'
import ResetPwdModal from './ResetPwdModal.vue'
import DeptTree from './DeptTree.vue'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { columns, searchFormSchema } from './user.data'
import { UserExportReqVO, deleteUser, exportUser, getUserPage } from '@/api/system/user'

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const [registerRoleModal, { openModal: openRoleModal }] = useModal()
const [registerPwdModal, { openModal: openPwdModal }] = useModal()
const searchInfo = reactive<Recordable>({})

const [registerTable, { getForm, reload }] = useTable({
  title: '账号列表',
  api: getUserPage,
  columns,
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema,
    autoSubmitOnEnter: true
  },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right'
  }
})

/** 新增按钮操作 */
function handleCreate() {
  openModal(true, { isUpdate: false })
}

/** 导出按钮操作 */
async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportUser(getForm().getFieldsValue() as UserExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}

/** 修改按钮操作 */
function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

/** 分配用户角色操作 */
function handleRole(record: Recordable) {
  openRoleModal(true, { record })
}

/** 重置密码按钮操作 */
function handleResetPwd(record: Recordable) {
  openPwdModal(true, { record })
}

/** 删除按钮操作 */
async function handleDelete(record: Recordable) {
  await deleteUser(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
/** 点击部门操作 */
function handleSelect(deptId = '') {
  searchInfo.deptId = deptId
  reload()
}
</script>
