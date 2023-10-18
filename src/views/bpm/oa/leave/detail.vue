<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { descSchema } from './leave.data'
import { Description, useDescription } from '@/components/Description'
import { PageWrapper } from '@/components/Page'
import { getLeave } from '@/api/bpm/leave'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'InfraJobModal' })

const props = defineProps({
  id: propTypes.number.def(undefined),
})

const { query } = useRoute()
const datas = ref()

const [registerDesc] = useDescription({
  schema: descSchema,
  data: datas,
})

async function getInfo() {
  const queryId = query.id as unknown as number // 从 URL 传递过来的 id 编号
  const res = await getLeave(props.id || queryId)
  datas.value = res
}

/** 初始化 */
onMounted(async () => {
  await getInfo()
})
</script>

<template>
  <PageWrapper>
    <Description :column="1" @register="registerDesc" />
  </PageWrapper>
</template>
