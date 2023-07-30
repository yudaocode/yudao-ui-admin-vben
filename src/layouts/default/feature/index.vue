<script lang="ts" setup>
import { FloatButton } from 'ant-design-vue'
import { computed, unref } from 'vue'

import { SettingButtonPositionEnum } from '@/enums/appEnum'
import { useHeaderSetting } from '@/hooks/setting/useHeaderSetting'
import { useRootSetting } from '@/hooks/setting/useRootSetting'
import { useDesign } from '@/hooks/web/useDesign'
import { useUserStoreWithOut } from '@/store/modules/user'
import { createAsyncComponent } from '@/utils/factory/createAsyncComponent'
import SessionTimeoutLogin from '@/views/base/login/SessionTimeoutLogin.vue'

defineOptions({ name: 'LayoutFeatures' })
const LayoutLockPage = createAsyncComponent(() => import('@/views/base/lock/index.vue'))
const SettingDrawer = createAsyncComponent(() => import('@/layouts/default/setting/index.vue'))

const { getUseOpenBackTop, getShowSettingButton, getSettingButtonPosition, getFullContent }
    = useRootSetting()

const getTarget = () => document.body
const userStore = useUserStoreWithOut()
const { prefixCls } = useDesign('setting-drawer-feature')
const { getShowHeader } = useHeaderSetting()

const getIsSessionTimeout = computed(() => userStore.getSessionTimeout)

const getIsFixedSettingDrawer = computed(() => {
  if (!unref(getShowSettingButton))
    return false

  const settingButtonPosition = unref(getSettingButtonPosition)

  if (settingButtonPosition === SettingButtonPositionEnum.AUTO)
    return !unref(getShowHeader) || unref(getFullContent)

  return settingButtonPosition === SettingButtonPositionEnum.FIXED
})
</script>

<template>
  <LayoutLockPage />
  <FloatButton.BackTop v-if="getUseOpenBackTop" :target="getTarget" />
  <SettingDrawer v-if="getIsFixedSettingDrawer" :class="prefixCls" />
  <SessionTimeoutLogin v-if="getIsSessionTimeout" />
</template>

<style lang="less">
  @prefix-cls: ~'@{namespace}-setting-drawer-feature';

  .@{prefix-cls} {
    position: absolute;
    top: 45%;
    right: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    color: @white;
    cursor: pointer;
    border-radius: 6px 0 0 6px;

    svg {
      width: 1em;
      height: 1em;
    }
  }
</style>
