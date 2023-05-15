<template>
  <PageWrapper title="公众号图文">
    <WxNews :search-schema="searchSchema" :api="getFreePublishPage" @get-method="getMethod" @delete="handleDelete" />
  </PageWrapper>
</template>
<script lang="ts" setup>
// import { Icon } from '@/components/Icon'
import { PageWrapper } from '@/components/Page'
import WxNews from '../components/WxNews/index.vue'
import { getSimpleAccounts } from '@/api/mp/account'
import { deleteFreePublish, getFreePublishPage } from '@/api/mp/freePublish'
import { FormSchema } from '@/components/Form'

const searchSchema: FormSchema[] = [
  {
    label: '公众号',
    field: 'accountId',
    component: 'ApiSelect',
    componentProps: {
      api: () => getSimpleAccounts(),
      labelField: 'name',
      valueField: 'id'
    },
    colProps: { span: 8 }
  }
]

let reload = () => {}
// 获取内部fetch方法;
function getMethod(m: any) {
  reload = m
}

//删除按钮事件
function handleDelete(id) {
  deleteFreePublish(id, id)
  reload()
}
</script>
