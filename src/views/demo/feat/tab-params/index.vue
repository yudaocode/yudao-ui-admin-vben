<template>
  <PageWrapper title="带参数标签页" content="支持带参数多tab缓存">
    Current Param : {{ params }}
    <br />
    Keep Alive
    <Input />
  </PageWrapper>
</template>
<script lang="ts" setup name="TestTab">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { PageWrapper } from '@/components/Page'
import { Input } from 'ant-design-vue'

const route = useRoute()
const params = computed(() => {
  return route.params
})
</script>
