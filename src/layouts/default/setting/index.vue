<script lang="ts" setup>
import SettingDrawer from './SettingDrawer'
import { Icon } from '@/components/Icon'

import { useDrawer } from '@/components/Drawer'

defineOptions({ name: 'SettingButton' })

const [register, { openDrawer }] = useDrawer()
</script>

<template>
  <div @click="openDrawer(true)">
    <Icon icon="ion:settings-outline" />
    <SettingDrawer @register="register" />
  </div>
</template>
