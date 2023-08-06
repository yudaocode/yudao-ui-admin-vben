<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { Badge, Tooltip } from 'ant-design-vue'
import { BellOutlined } from '@ant-design/icons-vue'
import { storeToRefs } from 'pinia'
import { useGo } from '@/hooks/web/usePage'
import { PageEnum } from '@/enums/pageEnum'
import { useUserMessageStore } from '@/store/modules/userMessage'

const go = useGo()

const store = useUserMessageStore()
const { unreadCount } = storeToRefs(store)
const tips = computed<string>(() => {
  if (unreadCount.value === 0)
    return '查看站内信'

  return `查看站内信: 未读 ${unreadCount.value} 条`
})

onMounted(async () => {
  // 通过store进行更新
  store.updateUnreadCount()
})
</script>

<template>
  <div>
    <Tooltip :title="tips">
      <Badge :count="unreadCount" :offset="[0, 15]" size="small" @click="go({ path: PageEnum.MESSAGE_PAGE })">
        <BellOutlined />
      </Badge>
    </Tooltip>
  </div>
</template>

<style lang="less"></style>
