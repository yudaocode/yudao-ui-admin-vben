<script lang="ts" setup>
import HeaderTrigger from './HeaderTrigger.vue'
import { createAsyncComponent } from '@/utils/factory/createAsyncComponent'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'LayoutTrigger' })

defineProps({
  sider: propTypes.bool.def(true),
  theme: propTypes.oneOf(['light', 'dark']),
})

const SiderTrigger = createAsyncComponent(() => import('./SiderTrigger.vue'))
</script>

<template>
  <SiderTrigger v-if="sider" />
  <HeaderTrigger v-else :theme="theme" />
</template>
