import type { Ref } from 'vue'
import { computed, toRaw, unref } from 'vue'

import { uniq } from 'lodash-es'

import { useDebounceFn, useTimeoutFn } from '@vueuse/core'
import type { MenuState } from './types'
import { getAllParentPath } from '@/router/helper/menuHelper'
import type { Menu as MenuType } from '@/router/types'

export function useOpenKeys(
  menuState: MenuState,
  menus: Ref<MenuType[]>,
  accordion: Ref<boolean>,
  mixSider: Ref<boolean>,
  collapse: Ref<boolean>,
) {
  const debounceSetOpenKeys = useDebounceFn(setOpenKeys, 50)

  function setOpenKeys(path: string) {
    const native = !mixSider.value
    const menuList = toRaw(menus.value)
    const handle = () => {
      if (menuList?.length === 0) {
        menuState.activeSubMenuNames = []
        menuState.openNames = []
        return
      }
      const keys = getAllParentPath(menuList, path)

      if (!unref(accordion))
        menuState.openNames = uniq([...menuState.openNames, ...keys])
      else
        menuState.openNames = keys

      menuState.activeSubMenuNames = menuState.openNames
    }
    if (native)
      handle()
    else
      useTimeoutFn(handle, 30)
  }

  const getOpenKeys = computed(() => {
    return unref(collapse) ? [] : menuState.openNames
  })

  return { setOpenKeys: debounceSetOpenKeys, getOpenKeys }
}
