<script lang="ts" setup>
import { columns, searchFormSchema } from './mailLog.data'
import MailLogModal from './MailLogModal.vue'
import { useI18n } from '@/hooks/web/useI18n'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { getMailAccountPage } from '@/api/system/mail/log'
import { useModal } from '@/components/Modal'

defineOptions({ name: 'SystemOperateLog' })

const { t } = useI18n()
const [registerTable] = useTable({
  title: '邮件日志列表',
  api: getMailAccountPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

const [registerModal, { openModal }] = useModal()

function handleShowInfo(record: Recordable) {
  openModal(true, record)
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.VIEW,
                label: t('action.detail'),
                onClick: handleShowInfo.bind(null, record),
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <MailLogModal @register="registerModal" />
  </div>
</template>
