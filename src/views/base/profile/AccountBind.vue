<script setup lang="ts">
import { List } from 'ant-design-vue'
import { onMounted } from 'vue'
import { accountBindList } from './data'
import { Icon } from '@/components/Icon'
import { CollapseContainer } from '@/components/Container/index'
import { getUserProfileApi } from '@/api/base/profile'

const ListItem = List.Item
const ListItemMeta = List.Item.Meta

async function init() {
  const userInfo = await getUserProfileApi()
  // TODO
  for (const i in accountBindList) {
    if (userInfo.socialUsers) {
      for (const j in userInfo.socialUsers) {
        if (accountBindList[i].key === userInfo.socialUsers[j].type) {
          accountBindList[i].title = '已綁定'
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
        <ListItem>
          <ListItemMeta>
            <template #avatar>
              <Icon v-if="item.avatar" class="avatar" :icon="item.avatar" :color="item.color" />
            </template>
            <template #title>
              {{ item.title }}
              <a-button v-if="item.extra" type="link" size="small" class="extra">
                {{ item.extra }}
              </a-button>
            </template>
            <template #description>
              <div>{{ item.description }}</div>
            </template>
          </ListItemMeta>
        </ListItem>
      </template>
    </List>
  </CollapseContainer>
</template>

<style lang="less" scoped>
.avatar {
  font-size: 40px !important;
}

.extra {
  float: right;
  margin-top: 10px;
  margin-right: 30px;
  cursor: pointer;
}
</style>
