<script lang="ts" setup>
import AreaModal from './AreaModal.vue'
import { columns } from './area.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, useTable } from '@/components/Table'
import { getAreaTree } from '@/api/system/area'

defineOptions({ name: 'SystemArea' })

const { t } = useI18n()

const [registerModal, { openModal }] = useModal()

const [register, { expandAll, collapseAll, reload }] = useTable({
  title: 'IP 地区列表',
  api: getAreaTree,
  columns,
  rowKey: 'id',
  isTreeTable: true,
  pagination: false,
  striped: false,
  useSearchForm: false,
  showTableSetting: true,
  bordered: true,
  showIndexColumn: false,
  canResize: true,
})

function handleCreate() {
  openModal(true, { isUpdate: false })
}
</script>

<template>
  <div class="p-4">
    <BasicTable @register="register">
      <template #toolbar>
        <a-button type="primary" :pre-icon="IconEnum.ADD" @click="handleCreate">
          IP 查询
        </a-button>
        <a-button type="info" @click="expandAll">
          {{ t('component.tree.expandAll') }}
        </a-button>
        <a-button type="info" @click="collapseAll">
          {{ t('component.tree.unExpandAll') }}
        </a-button>
      </template>
    </BasicTable>
    <AreaModal @register="registerModal" @success="reload()" />
  </div>
</template>
