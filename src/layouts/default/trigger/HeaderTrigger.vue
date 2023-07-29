<script lang="ts" setup>
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons-vue'
import { useMenuSetting } from '@/hooks/setting/useMenuSetting'
import { useDesign } from '@/hooks/web/useDesign'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'HeaderTrigger' })

defineProps({
  theme: propTypes.oneOf(['light', 'dark']),
})
const { getCollapsed, toggleCollapsed } = useMenuSetting()
const { prefixCls } = useDesign('layout-header-trigger')
</script>

<template>
  <span :class="[prefixCls, theme]" @click="toggleCollapsed"> <MenuUnfoldOutlined v-if="getCollapsed" /> <MenuFoldOutlined v-else /> </span>
</template>
