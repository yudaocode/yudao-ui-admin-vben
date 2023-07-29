<script lang="ts" setup>
import { MenuItem } from 'ant-design-vue'
import { itemProps } from '../props'
import MenuItemContent from './MenuItemContent.vue'

defineOptions({ name: 'BasicMenuItem' })

defineProps(itemProps)
</script>

<template>
  <MenuItem :key="item.path">
    <MenuItemContent v-bind="$props" :item="item" />
  </MenuItem>
</template>
