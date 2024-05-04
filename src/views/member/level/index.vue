<script lang="ts" setup>
import LevelModal from './LevelModal.vue'
import { columns, searchFormSchema } from './level.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { getLevelList } from '@/api/member/level'
import { DocAlert } from '@/components/DocAlert'

defineOptions({ name: 'MemberLevel' })

const { t } = useI18n()
const [registerModal, { openModal }] = useModal()
const [registerTable, { reload }] = useTable({
  title: '会员等级列表',
  api: getLevelList,
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

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}
</script>

<template>
  <div>
    <DocAlert title="会员等级、积分、签到" url="https://doc.iocoder.cn/member/level/" />

    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'member:level:update', onClick: handleEdit.bind(null, record) },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <LevelModal @register="registerModal" @success="reload()" />
  </div>
</template>
