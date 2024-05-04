<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { IFrame } from '@/components/IFrame'
import { getConfigKey } from '@/api/infra/config'
import { DocAlert } from '@/components/DocAlert'

defineOptions({ name: 'InfraAdminServer' })

const src = ref(`${import.meta.env.VITE_GLOB_BASE_URL}/admin/applications`)

const loading = ref(true)

async function getInfo() {
  const res = await getConfigKey('url.spring-boot-admin')
  if (res && res.length !== 0)
    src.value = res

  loading.value = false
}

onMounted(() => {
  getInfo()
})
</script>

<template>
  <div>
    <DocAlert title="服务监控" url="https://doc.iocoder.cn/server-monitor/" />

    <IFrame v-if="!loading" :src="src" />
  </div>
</template>
