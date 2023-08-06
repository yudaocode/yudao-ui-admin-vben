<script lang="ts" setup>
import { DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons-vue'
import { useMenuSetting } from '@/hooks/setting/useMenuSetting'

defineOptions({ name: 'SiderTrigger' })

const { getCollapsed, toggleCollapsed } = useMenuSetting()
</script>

<template>
  <div @click.stop="toggleCollapsed">
    <DoubleRightOutlined v-if="getCollapsed" />
    <DoubleLeftOutlined v-else />
  </div>
</template>
