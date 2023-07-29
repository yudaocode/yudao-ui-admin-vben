<script lang="ts" setup>
import { ref } from 'vue'
import { Dropdown, Menu, Tooltip } from 'ant-design-vue'
import { ColumnHeightOutlined } from '@ant-design/icons-vue'
import type { SizeType } from '../../types/table'
import { useTableContext } from '../../hooks/useTableContext'
import { useI18n } from '@/hooks/web/useI18n'
import { getPopupContainer } from '@/utils'

defineOptions({ name: 'SizeSetting' })

const table = useTableContext()
const { t } = useI18n()

const selectedKeysRef = ref<SizeType[]>([table.getSize()])

function handleTitleClick({ key }: { key: any }) {
  selectedKeysRef.value = [key]
  table.setProps({
    size: key,
  })
}
</script>

<template>
  <Tooltip placement="top">
    <template #title>
      <span>{{ t('component.table.settingDens') }}</span>
    </template>

    <Dropdown placement="bottom" :trigger="['click']" :get-popup-container="getPopupContainer">
      <ColumnHeightOutlined />
      <template #overlay>
        <Menu v-model:selectedKeys="selectedKeysRef" selectable @click="handleTitleClick">
          <Menu.Item key="default">
            <span>{{ t('component.table.settingDensDefault') }}</span>
          </Menu.Item>
          <Menu.Item key="middle">
            <span>{{ t('component.table.settingDensMiddle') }}</span>
          </Menu.Item>
          <Menu.Item key="small">
            <span>{{ t('component.table.settingDensSmall') }}</span>
          </Menu.Item>
        </Menu>
      </template>
    </Dropdown>
  </Tooltip>
</template>
