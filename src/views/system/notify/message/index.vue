<template>
  <div>
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                label: '详情',
                icon: IconEnum.LOG,
                onClick: handleShowInfo.bind(null, record)
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <MessageInfoModal @register="registerModal" />
  </div>
</template>
<script lang="ts" setup>
import { IconEnum } from '@/enums/appEnum'
import { useI18n } from '@/hooks/web/useI18n'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { getNotifyMessagePage } from '@/api/system/notify/message'
import { columns, searchFormSchema } from './message.data'
import MessageInfoModal from '@/views/system/notify/components/MessageInfoModal.vue'
import { useModal } from '@/components/Modal'

defineOptions({ name: 'SystemMessage' })

const { t } = useI18n()

const [registerTable] = useTable({
  title: '站内信记录列表',
  api: getNotifyMessagePage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 100,
    title: t('common.action'),
    fixed: 'right',
    key: 'action'
  }
})

const [registerModal, { openModal }] = useModal()

const handleShowInfo = (record: Recordable) => {
  openModal(true, record)
}
</script>
