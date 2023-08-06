<script lang="ts" setup>
import FileConfigModal from './FileConfigModal.vue'
import { columns, searchFormSchema } from './ficleConfig.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { deleteFileConfig, getFileConfigPage, testFileConfig, updateFileConfigMaster } from '@/api/infra/fileConfig'

defineOptions({ name: 'InfraFileConfig' })

const { t } = useI18n()
const { createConfirm, createMessage, createSuccessModal } = useMessage()
const [registerModal, { openModal }] = useModal()

const [registerTable, { reload }] = useTable({
  title: '文件配置列表',
  api: getFileConfigPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 280,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

function handleCreate() {
  openModal(true, { isUpdate: false })
}

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

async function handleTest(record: Recordable) {
  const res = await testFileConfig(record.id)
  createSuccessModal({ content: res })
}

function handleMaster(record: Recordable) {
  createConfirm({
    title: '主配置',
    iconType: 'warning',
    content: `是否确认修改配置编号为"${record.id}"的数据项为主配置?`,
    async onOk() {
      await updateFileConfigMaster(record.id)
      createMessage.success('配置成功')
      reload()
    },
  })
}

async function handleDelete(record: Recordable) {
  await deleteFileConfig(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['infra:file-config:create']" type="primary" :pre-icon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'infra:file-config:update', onClick: handleEdit.bind(null, record) },
              { icon: IconEnum.TEST, label: t('action.test'), auth: 'infra:file-config:update', onClick: handleTest.bind(null, record) },
              {
                icon: IconEnum.AUTH,
                label: '主配置',
                auth: 'infra:file-config:update',
                ifShow: () => {
                  return !record.master
                },
                onClick: handleMaster.bind(null, record),
              },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'infra:file-config:delete',
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
    <FileConfigModal @register="registerModal" @success="reload()" />
  </div>
</template>
