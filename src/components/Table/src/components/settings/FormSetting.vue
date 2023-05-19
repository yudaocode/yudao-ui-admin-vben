<template>
  <Tooltip placement="top">
    <template #title>
      <span>{{ t('common.searchText') }}</span>
    </template>
    <SearchOutlined @click="redo" />
  </Tooltip>
</template>
<script lang="ts" setup>
import { Tooltip } from 'ant-design-vue'
import { SearchOutlined } from '@ant-design/icons-vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useTableContext } from '../../hooks/useTableContext'

defineOptions({ name: 'FormSetting' })

const table = useTableContext()
const { t } = useI18n()

function redo() {
  table.setShowForm(!table.getShowForm())
  table.redoHeight()
}
</script>
