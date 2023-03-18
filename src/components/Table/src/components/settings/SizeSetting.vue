<template>
  <Tooltip placement="top">
    <template #title>
      <span>{{ t('component.table.settingDens') }}</span>
    </template>

    <Dropdown placement="bottom" :trigger="['click']" :getPopupContainer="getPopupContainer">
      <ColumnHeightOutlined />
      <template #overlay>
        <Menu @click="handleTitleClick" selectable v-model:selectedKeys="selectedKeysRef">
          <MenuItem key="default">
            <span>{{ t('component.table.settingDensDefault') }}</span>
          </MenuItem>
          <MenuItem key="middle">
            <span>{{ t('component.table.settingDensMiddle') }}</span>
          </MenuItem>
          <MenuItem key="small">
            <span>{{ t('component.table.settingDensSmall') }}</span>
          </MenuItem>
        </Menu>
      </template>
    </Dropdown>
  </Tooltip>
</template>
<script lang="ts" setup name="SizeSetting">
import type { SizeType } from '../../types/table'
import { ref } from 'vue'
import { Tooltip, Dropdown, Menu } from 'ant-design-vue'
import { ColumnHeightOutlined } from '@ant-design/icons-vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useTableContext } from '../../hooks/useTableContext'
import { getPopupContainer } from '@/utils'

const MenuItem = Menu.Item
const table = useTableContext()
const { t } = useI18n()

const selectedKeysRef = ref<SizeType[]>([table.getSize()])

function handleTitleClick({ key }: { key: any }) {
  selectedKeysRef.value = [key]
  table.setProps({
    size: key
  })
}
</script>
