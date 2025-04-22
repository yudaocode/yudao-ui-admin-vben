<script lang="ts" setup>
import { Page } from '@vben/common-ui'
import { DocAlert } from '#/components/doc-alert'
import { IFrame } from '#/components/iframe'

import { ref, onMounted } from 'vue'
import { getConfigKey } from '#/api/infra/config'

const loading = ref(true) // 是否加载中
const src = ref(import.meta.env.VITE_BASE_URL + '/druid/index.html')

/** 初始化 */
onMounted(async () => {
  try {
    const data = await getConfigKey('url.druid')
    if (data && data.length > 0) {
      src.value = data
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="数据库 MyBatis" url="https://doc.iocoder.cn/mybatis/" />
    <DocAlert title="多数据源（读写分离）" url="https://doc.iocoder.cn/dynamic-datasource/" />

    <IFrame v-if="!loading" v-loading="loading" :src="src" />
  </Page>
</template>
