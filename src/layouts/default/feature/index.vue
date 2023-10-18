<script lang="ts" setup>
import { FloatButton } from 'ant-design-vue'
import { QuestionCircleOutlined } from '@ant-design/icons-vue'
import { computed, unref } from 'vue'

import { SettingButtonPositionEnum } from '@/enums/appEnum'
import { useHeaderSetting } from '@/hooks/setting/useHeaderSetting'
import { useRootSetting } from '@/hooks/setting/useRootSetting'
import { useUserStoreWithOut } from '@/store/modules/user'
import { createAsyncComponent } from '@/utils/factory/createAsyncComponent'
import SessionTimeoutLogin from '@/views/base/login/SessionTimeoutLogin.vue'
import { openWindow } from '@/utils'
import { SITE_URL } from '@/settings/siteSetting'

defineOptions({ name: 'LayoutFeatures' })
const LayoutLockPage = createAsyncComponent(() => import('@/views/base/lock/index.vue'))
const SettingDrawer = createAsyncComponent(() => import('@/layouts/default/setting/index.vue'))

const { getUseOpenBackTop, getShowSettingButton, getSettingButtonPosition, getFullContent }
  = useRootSetting()

const getTarget = () => document.body
const userStore = useUserStoreWithOut()
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
  <FloatButton
    shape="circle"
    type="primary"
    :badge="{ dot: true }"
    :style="{ right: '64px' }"
    @click="openWindow(SITE_URL)"
  >
    <template #icon>
      <QuestionCircleOutlined />
    </template>
  </FloatButton>
  <SettingDrawer
    v-if="getIsFixedSettingDrawer"
    class="absolute top-[45%] z-10 flex cursor-pointer items-center justify-items-center rounded-l-md rounded-r-none p-2.5"
  />
  <SessionTimeoutLogin v-if="getIsSessionTimeout" />
</template>
