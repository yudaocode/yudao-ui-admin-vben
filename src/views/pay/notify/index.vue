<script lang="ts" setup>
import NotifyModal from './NotifyModal.vue'
import { columns, searchFormSchema } from './notify.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { getNotifyTaskPage } from '@/api/pay/notify'

defineOptions({ name: 'PayNotify' })

const { t } = useI18n()
const [registerModal, { openModal }] = useModal()

const [registerTable] = useTable({
  title: '通知列表',
  api: getNotifyTaskPage,
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

async function handleQueryDetails(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.DATA, label: t('action.detail'), auth: 'pay:order:query', onClick: handleQueryDetails.bind(null, record) },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <NotifyModal @register="registerModal" />
  </div>
</template>
