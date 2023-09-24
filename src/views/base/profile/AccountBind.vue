<script lang="ts" setup>
import { List } from 'ant-design-vue'
import { onMounted } from 'vue'
import { accountBindList } from './data'
import { Icon } from '@/components/Icon'
import { CollapseContainer } from '@/components/Container/index'
import { getUserProfileApi } from '@/api/base/profile'

async function init() {
  const userInfo = await getUserProfileApi()
  // TODO
  for (const i in accountBindList) {
    if (userInfo.socialUsers) {
      for (const j in userInfo.socialUsers) {
        if (accountBindList[i].key === userInfo.socialUsers[j].type) {
          accountBindList[i].title = '已绑定'
          break
        }
      }
    }
  }
}
onMounted(async () => {
  await init()
})
</script>

<template>
  <CollapseContainer title="账号绑定" :can-expan="false">
    <List>
      <template v-for="item in accountBindList" :key="item.key">
        <List.Item>
          <List.Item.Meta>
            <template #avatar>
              <Icon v-if="item.avatar" class="text-4xl" :icon="item.avatar" :color="item.color" />
            </template>
            <template #title>
              {{ item.title }}
              <a-button v-if="item.extra" type="link" size="small" class="float-right mr-7.5 mt-2.5 cursor-pointer">
                {{ item.extra }}
              </a-button>
            </template>
            <template #description>
              <div>{{ item.description }}</div>
            </template>
          </List.Item.Meta>
        </List.Item>
      </template>
    </List>
  </CollapseContainer>
</template>
