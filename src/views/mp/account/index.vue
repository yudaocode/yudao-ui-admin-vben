<script lang="ts" setup>
import AccountModal from './AccountModal.vue'
import { columns, searchFormSchema } from './account.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { clearAccountQuota, deleteAccount, generateAccountQrCode, getAccountPage } from '@/api/mp/account'

defineOptions({ name: 'MpAccount' })

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [registerTable, { reload }] = useTable({
  title: '公众号账号列表',
  api: getAccountPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

/** 新增按钮操作 */
function handleCreate() {
  openModal(true, { isUpdate: false })
}

/** 修改按钮操作 */
function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

/** 生成二维码的按钮操作 */
function handleGenerateQrCode(record: Recordable) {
  createConfirm({
    title: '生成二维码',
    iconType: 'warning',
    content: `是否确认生成公众号账号${record.name}的二维码?`,
    async onOk() {
      await generateAccountQrCode(record.id)
      createMessage.success(t('common.exportSuccessText'))
    },
  })
}

/** 清空二维码 API 配额的按钮操作 */
function handleCleanQuota(record: Recordable) {
  createConfirm({
    title: '删除二维码',
    iconType: 'warning',
    content: `是否确认清空生成公众号账号${record.name}的 API 配额?`,
    async onOk() {
      await clearAccountQuota(record.id)
      createMessage.success('清空 API 配额成功')
    },
  })
}

/** 删除按钮操作 */
async function handleDelete(record: Recordable) {
  await deleteAccount(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['mp:account:create']" type="primary" :pre-icon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[{ icon: IconEnum.EDIT, label: t('action.edit'), auth: 'mp:account:update', onClick: handleEdit.bind(null, record) }]"
            :drop-down-actions="[
              {
                icon: IconEnum.RESET,
                label: '生成二维码',
                auth: 'mp:account:qr-code',
                onClick: handleGenerateQrCode.bind(null, record),
              },
              {
                icon: IconEnum.TEST,
                label: '清空 API 配额',
                auth: 'mp:account:clear-quota',
                onClick: handleCleanQuota.bind(null, record),
              },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'mp:account:delete',
                popConfirm: {
                  title: t('common.delMessage'),
                  placement: 'left',
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <AccountModal @register="registerModal" @success="reload()" />
  </div>
</template>
