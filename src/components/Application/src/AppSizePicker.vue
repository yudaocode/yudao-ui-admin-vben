<template>
  <Dropdown
    placement="bottom"
    :trigger="['click']"
    :dropMenuList="sizeList"
    :selectedKeys="selectedKeys"
    @menu-event="handleMenuEvent"
    overlayClassName="app-locale-picker-overlay"
  >
    <span class="cursor-pointer flex items-center">
      <Icon icon="mdi:format-size" />
      <span v-if="showText" class="ml-1">{{ getSizeText }}</span>
    </span>
  </Dropdown>
</template>
<script lang="ts" setup>
import type { AppSizeType } from '@/types/config'
import type { DropMenu } from '@/components/Dropdown'
import { ref, watchEffect, unref, computed } from 'vue'
import { Dropdown } from '@/components/Dropdown'
import { Icon } from '@/components/Icon'
import { sizeList } from '@/settings/sizeSetting'
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()

const props = defineProps({
  // 是否显示文本
  showText: { type: Boolean, default: true },
  // 更改时是否刷新界面
  reload: { type: Boolean }
})

const selectedKeys = ref<string[]>([])

const getSizeText = computed(() => {
  const key = selectedKeys.value[0]
  if (!key) {
    return ''
  }
  return sizeList.find((item) => item.event === key)?.text
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
  if (unref(appStore.getComponentSize) === menu.event) {
    return
  }
  toggleSize(menu.event as AppSizeType)
}
</script>

<style lang="less">
.app-locale-picker-overlay {
  .ant-dropdown-menu-item {
    min-width: 160px;
  }
}
</style>
