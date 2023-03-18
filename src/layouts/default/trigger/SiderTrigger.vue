<template>
  <div @click.stop="toggleCollapsed">
    <DoubleRightOutlined v-if="getCollapsed" />
    <DoubleLeftOutlined v-else />
  </div>
</template>
<script lang="ts" setup name="SiderTrigger">
import { DoubleRightOutlined, DoubleLeftOutlined } from '@ant-design/icons-vue'
import { useMenuSetting } from '@/hooks/setting/useMenuSetting'

const { getCollapsed, toggleCollapsed } = useMenuSetting()
</script>
