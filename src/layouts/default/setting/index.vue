<template>
  <div @click="openDrawer(true)">
    <Icon icon="ion:settings-outline" />
    <SettingDrawer @register="register" />
  </div>
</template>
<script lang="ts" setup name="SettingButton">
import SettingDrawer from './SettingDrawer'
import Icon from '@/components/Icon'

import { useDrawer } from '@/components/Drawer'

const [register, { openDrawer }] = useDrawer()
</script>
