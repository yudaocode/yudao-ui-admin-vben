<script lang="ts" setup>
import { computed, unref } from 'vue'
import { SvgIcon } from '@/components/Icon'
import { useDesign } from '@/hooks/web/useDesign'
import { useRootSetting } from '@/hooks/setting/useRootSetting'
import { updateHeaderBgColor, updateSidebarBgColor } from '@/logics/theme/updateBackground'
import { updateDarkTheme } from '@/logics/theme/dark'
import { ThemeEnum } from '@/enums/appEnum'

const { prefixCls } = useDesign('dark-switch')
const { getDarkMode, setDarkMode, getShowDarkModeToggle } = useRootSetting()

const isDark = computed(() => getDarkMode.value === ThemeEnum.DARK)

const getClass = computed(() => [
  prefixCls,
  {
    [`${prefixCls}--dark`]: unref(isDark),
  },
])

function toggleDarkMode() {
  const darkMode = getDarkMode.value === ThemeEnum.DARK ? ThemeEnum.LIGHT : ThemeEnum.DARK
  setDarkMode(darkMode)
  updateDarkTheme(darkMode)
  updateHeaderBgColor()
  updateSidebarBgColor()
}
</script>

<template>
  <div
    v-if="getShowDarkModeToggle" :class="getClass"
    class="relative mr-auto h-6.5 w-12.5 flex cursor-pointer items-center justify-between rounded-4.5 bg-black px-1.5"
    @click="toggleDarkMode"
  >
    <div
      class="dark:(transform translateX(calc(100% + 2px))) absolute z-1 h-4.5 w-4.5 rounded-1/2 bg-white will-change-transform"
    />
    <SvgIcon size="14" name="sun" />
    <SvgIcon size="14" name="moon" />
  </div>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-dark-switch';

html[data-theme='dark'] {
  .@{prefix-cls} {
    border: 1px solid rgb(196 188 188);
  }
}

.@{prefix-cls} {

  &-inner {
    transition:
      transform 0.5s,
      background-color 0.5s;
  }

  &--dark {
    .@{prefix-cls}-inner {
      transform: translateX(calc(100% + 2px));
    }
  }
}
</style>
