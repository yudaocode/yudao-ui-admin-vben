<template>
  <MenuItem :key="itemKey">
    <span class="flex items-center">
      <Icon :icon="icon" class="mr-1" />
      <span>{{ text }}</span>
    </span>
  </MenuItem>
</template>
<script lang="ts" setup name="DropdownMenuItem">
import { MenuItem } from 'ant-design-vue'
import { computed, getCurrentInstance } from 'vue'

import Icon from '@/components/Icon'
import { propTypes } from '@/utils/propTypes'

const props = defineProps({
  // eslint-disable-next-line
  key: propTypes.string,
  text: propTypes.string,
  icon: propTypes.string
})

const instance = getCurrentInstance()
const itemKey = computed(() => props.key || instance?.vnode?.props?.key)
</script>
