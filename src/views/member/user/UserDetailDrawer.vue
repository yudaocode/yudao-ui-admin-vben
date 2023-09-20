<script lang="ts" setup>
import { ref } from 'vue'
import { Avatar } from 'ant-design-vue'
import { userAccountInfoDesc, userBasicInfoDesc } from './user.data'
import { BasicDrawer, useDrawerInner } from '@/components/Drawer'
import { Description, useDescription } from '@/components/Description'
import { CollapseContainer } from '@/components/Container'
import { getUser } from '@/api/member/user'

defineEmits(['success', 'register'])
const userInfo = ref<any>()
const loading = ref(true)

const [registerBasicInfoDesc] = useDescription({
  schema: userBasicInfoDesc,
  data: userInfo,
})

const [registerAccountDesc] = useDescription({
  schema: userAccountInfoDesc,
  data: userInfo,
})

const [registerDrawer, { setDrawerProps }] = useDrawerInner(async (data) => {
  setDrawerProps({ loading: true })
  const res = await getUser(data.id)
  userInfo.value = res
  loading.value = false
  setDrawerProps({ loading: false })
})

function handleEdit() {
  console.info('edit')
}
</script>

<template>
  <BasicDrawer v-bind="$attrs" title="会员详情" width="80%" @register="registerDrawer">
    <CollapseContainer title="基本信息" :can-expan="false" :loading="loading">
      <template #action>
        <a-button type="link" @click="handleEdit">
          修改
        </a-button>
      </template>
      <div class="flex">
        <Avatar v-if="userInfo" class="w-1/5" :src="userInfo.avatar || ''" :size="72" />
        <Description class="ml-4 w-4/5" :bordered="false" :column="4" @register="registerBasicInfoDesc" />
      </div>
    </CollapseContainer>
    <CollapseContainer title="账户信息" :loading="loading">
      <Description :bordered="false" :column="4" @register="registerAccountDesc" />
    </CollapseContainer>
    <CollapseContainer title="账户明细" :loading="loading">
      账户明细
    </CollapseContainer>
  </BasicDrawer>
</template>
