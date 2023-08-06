<script lang="ts" setup>
import { Tooltip } from 'ant-design-vue'
import { SearchOutlined } from '@ant-design/icons-vue'
import { useTableContext } from '../../hooks/useTableContext'
import { useI18n } from '@/hooks/web/useI18n'

defineOptions({ name: 'FormSetting' })

const table = useTableContext()
const { t } = useI18n()

function redo() {
  table.setShowForm(!table.getShowForm())
  table.redoHeight()
}
</script>

<template>
  <Tooltip placement="top">
    <template #title>
      <span>{{ t('common.searchText') }}</span>
    </template>
    <SearchOutlined @click="redo" />
  </Tooltip>
</template>
