<script lang="ts" setup>
import { Tooltip } from 'ant-design-vue'
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons-vue'
import { useFullscreen } from '@vueuse/core'
import { useTableContext } from '../../hooks/useTableContext'
import { useI18n } from '@/hooks/web/useI18n'

defineOptions({ name: 'FullScreenSetting' })

const table = useTableContext()
const { t } = useI18n()
const { toggle, isFullscreen } = useFullscreen(table.wrapRef)
</script>

<template>
  <Tooltip placement="top">
    <template #title>
      <span>{{ t('component.table.settingFullScreen') }}</span>
    </template>
    <FullscreenOutlined v-if="!isFullscreen" @click="toggle" />
    <FullscreenExitOutlined v-else @click="toggle" />
  </Tooltip>
</template>
