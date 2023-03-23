<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" :preIcon="IconEnum.ADD" @click="handleCreate"> {{ t('action.create') }} </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.EDIT, label: t('action.edit'), onClick: handleEdit.bind(null, record) },
              { icon: IconEnum.TEST, label: t('action.test'), onClick: handleTest.bind(null, record) },
              { icon: IconEnum.AUTH, label: '主配置', onClick: handleMaster.bind(null, record) },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
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
    <PostModal @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="FileConfig">
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import PostModal from './FileConfigModal.vue'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { deleteFileConfig, getFileConfigPage, testFileConfig, updateFileConfigMaster } from '@/api/infra/fileConfig'
import { columns, searchFormSchema } from './ficleConfig.data'

const { t } = useI18n()
const { createConfirm, createMessage, createSuccessModal } = useMessage()
const [registerModal, { openModal }] = useModal()

const [registerTable, { reload }] = useTable({
  title: '文件配置列表',
  api: getFileConfigPage,
  columns,
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema
  },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 240,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right'
  }
})

function handleCreate() {
  openModal(true, {
    isUpdate: false
  })
}

function handleEdit(record: Recordable) {
  openModal(true, {
    record,
    isUpdate: true
  })
}

async function handleTest(record: Recordable) {
  const res = await testFileConfig(record.id)
  createSuccessModal({ content: res })
}

function handleMaster(record: Recordable) {
  createConfirm({
    title: '主配置',
    iconType: 'warning',
    content: '是否确认修改配置编号为"' + record.id + '"的数据项为主配置?',
    async onOk() {
      await updateFileConfigMaster(record.id)
      createMessage.success('配置成功')
    }
  })
}

async function handleDelete(record: Recordable) {
  await deleteFileConfig(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>
