<template>
  <CollapseContainer title="账号绑定" :canExpan="false">
    <List>
      <template v-for="item in accountBindList" :key="item.key">
        <ListItem>
          <ListItemMeta>
            <template #avatar>
              <Icon v-if="item.avatar" class="avatar" :icon="item.avatar" :color="item.color" />
            </template>
            <template #title>
              {{ item.title }}
              <a-button type="link" size="small" v-if="item.extra" class="extra">
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
<script setup lang="ts">
import { List } from 'ant-design-vue'
import { CollapseContainer } from '@/components/Container/index'
import { accountBindList } from './data'
import { getUserProfileApi } from '@/api/base/profile'
import { onMounted } from 'vue'

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
