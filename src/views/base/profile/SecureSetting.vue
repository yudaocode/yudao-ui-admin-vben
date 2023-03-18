<template>
  <CollapseContainer title="安全设置" :canExpan="false">
    <List>
      <template v-for="item in secureSettingList" :key="item.key">
        <ListItem>
          <ListItemMeta>
            <template #title>
              {{ item.title }}
              <div class="extra" v-if="item.extra">
                <a-button type="link" @click="handleEdit(item.title)">{{ item.extra }}</a-button>
              </div>
            </template>
            <template #description>
              <div>{{ item.description }}</div>
            </template>
          </ListItemMeta>
        </ListItem>
      </template>
    </List>
  </CollapseContainer>
  <PasswordModel @register="registerModal" @success="handleSuccess" />
</template>
<script setup lang="ts">
import { List } from 'ant-design-vue'
import { CollapseContainer } from '@/components/Container/index'
import { secureSettingList } from './data'
import { useModal } from '@/components/Modal'
import { useMessage } from '@/hooks/web/useMessage'
import PasswordModel from './PasswordModel.vue'

const ListItem = List.Item
const ListItemMeta = List.Item.Meta

const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

function handleEdit(title: string) {
  if (title == '账户密码') {
    openModal(true, {})
  }
}
function handleSuccess() {
  createMessage.success('更新成功！')
}
</script>
<style lang="less" scoped>
.extra {
  float: right;
  margin-top: 10px;
  margin-right: 30px;
  font-weight: normal;
  color: #1890ff;
  cursor: pointer;
}
</style>
