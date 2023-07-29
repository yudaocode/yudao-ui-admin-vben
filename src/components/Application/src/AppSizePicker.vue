<script lang="ts" setup>
import { computed, ref, unref, watchEffect } from 'vue'
import type { AppSizeType } from '@/types/config'
import type { DropMenu } from '@/components/Dropdown'
import { Dropdown } from '@/components/Dropdown'
import { Icon } from '@/components/Icon'
import { sizeList } from '@/settings/sizeSetting'
import { useAppStore } from '@/store/modules/app'

const props = defineProps({
  // 是否显示文本
  showText: { type: Boolean, default: true },
  // 更改时是否刷新界面
  reload: { type: Boolean },
})

const appStore = useAppStore()

const selectedKeys = ref<string[]>([])

const getSizeText = computed(() => {
  const key = selectedKeys.value[0]
  if (!key)
    return ''

  return sizeList.find(item => item.event === key)?.text
})

watchEffect(() => {
  selectedKeys.value = [unref(appStore.getComponentSize as AppSizeType)]
})

async function toggleSize(size: AppSizeType) {
  appStore.setComponentSize(size)
  selectedKeys.value = [size as string]
  props.reload && location.reload()
}

function handleMenuEvent(menu: DropMenu) {
  if (unref(appStore.getComponentSize) === menu.event)
    return

  toggleSize(menu.event as AppSizeType)
}
</script>

<template>
  <Dropdown
    placement="bottom"
    :trigger="['click']"
    :drop-menu-list="sizeList"
    :selected-keys="selectedKeys"
    overlay-class-name="app-locale-picker-overlay"
    @menu-event="handleMenuEvent"
  >
    <span class="cursor-pointer flex items-center">
      <Icon icon="mdi:format-size" />
      <span v-if="showText" class="ml-1">{{ getSizeText }}</span>
    </span>
  </Dropdown>
</template>

<style lang="less">
.app-locale-picker-overlay {
  .ant-dropdown-menu-item {
    min-width: 160px;
  }
}
</style>
