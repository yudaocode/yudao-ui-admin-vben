<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" v-auth="['bpm:model:create']" :preIcon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
        <BasicUpload
          :maxSize="20"
          :maxNumber="1"
          :emptyHidePreview="true"
          @change="handleChange"
          :uploadParams="uploadParams"
          :api="importModel"
          class="my-5"
          :accept="['.bpmn', '.xml']"
        />
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'bpm:model:update', onClick: handleEdit.bind(null, record) },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'bpm:model:delete',
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
    <ModelModal @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import ModelModal from './ModelModal.vue'
import { IconEnum } from '@/enums/appEnum'
import { BasicUpload } from '@/components/Upload'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { deleteModel, getModelPage, importModel } from '@/api/bpm/model'
import { columns, searchFormSchema } from './model.data'
import { getAccessToken, getTenantId } from '@/utils/auth'

defineOptions({ name: 'BpmModel' })

const { t } = useI18n()
const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const uploadParams = ref({
  Authorization: 'Bearer ' + getAccessToken(),
  'tenant-id': getTenantId()
})

const [registerTable, { reload }] = useTable({
  title: '流程模型图列表',
  api: getModelPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right'
  }
})

function handleCreate() {
  openModal(true, { isUpdate: false })
}

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

function handleChange() {
  reload()
}

async function handleDelete(record: Recordable) {
  await deleteModel(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>
