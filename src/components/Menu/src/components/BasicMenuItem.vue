<template>
  <MenuItem :key="item.path">
    <MenuItemContent v-bind="$props" :item="item" />
  </MenuItem>
</template>
<script lang="ts" setup name="BasicMenuItem">
import { Menu } from 'ant-design-vue'
import { itemProps } from '../props'
import MenuItemContent from './MenuItemContent.vue'

const MenuItem = Menu.Item

defineProps(itemProps)
</script>
