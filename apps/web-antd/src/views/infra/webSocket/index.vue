<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user'

import { message } from 'ant-design-vue'
import { Card, Tag, Divider, Input, Button, Select, Avatar, Empty, Badge } from 'ant-design-vue'
import { Page } from '@vben/common-ui'
import { DocAlert } from '#/components/doc-alert'

import { formatDate } from '@vben/utils'
import { useWebSocket } from '@vueuse/core'
import { getSimpleUserList } from '#/api/system/user'
import { ref, computed, watchEffect, onMounted } from 'vue'
import { useAccessStore } from '@vben/stores'

const accessStore = useAccessStore()
const refreshToken = accessStore.refreshToken as string

const server = ref(
  (import.meta.env.VITE_BASE_URL + '/infra/ws').replace('http', 'ws') +
    '?token=' +
    refreshToken // 使用 refreshToken，而不使用 accessToken 方法的原因：WebSocket 无法方便的刷新访问令牌
) // WebSocket 服务地址
const getIsOpen = computed(() => status.value === 'OPEN') // WebSocket 连接是否打开
const getTagColor = computed(() => (getIsOpen.value ? 'success' : 'red')) // WebSocket 连接的展示颜色
const getStatusText = computed(() => (getIsOpen.value ? '已连接' : '未连接')) // 连接状态文本

/** 发起 WebSocket 连接 */
const { status, data, send, close, open } = useWebSocket(server.value, {
  autoReconnect: true,
  heartbeat: true
})

/** 监听接收到的数据 */
const messageList = ref([] as { time: number; text: string; type?: string; userId?: string }[]) // 消息列表
const messageReverseList = computed(() => messageList.value.slice().reverse())
watchEffect(() => {
  if (!data.value) {
    return
  }
  try {
    // 1. 收到心跳
    if (data.value === 'pong') {
      // state.recordList.push({
      //   text: '【心跳】',
      //   time: new Date().getTime()
      // })
      return
    }

    // 2.1 解析 type 消息类型
    const jsonMessage = JSON.parse(data.value)
    const type = jsonMessage.type
    const content = JSON.parse(jsonMessage.content)
    if (!type) {
      message.error('未知的消息类型：' + data.value)
      return
    }
    // 2.2 消息类型：demo-message-receive
    if (type === 'demo-message-receive') {
      const single = content.single
      messageList.value.push({
        text: content.text,
        time: new Date().getTime(),
        type: single ? 'single' : 'group',
        userId: content.fromUserId
      })
      return
    }
    // 2.3 消息类型：notice-push
    if (type === 'notice-push') {
      messageList.value.push({
        text: content.title,
        time: new Date().getTime(),
        type: 'system'
      })
      return
    }
    message.error('未处理消息：' + data.value)
  } catch (error) {
    message.error('处理消息发生异常：' + data.value)
    console.error(error)
  }
})

/** 发送消息 */
const sendText = ref('') // 发送内容
const sendUserId = ref('') // 发送人
const handlerSend = () => {
  if (!sendText.value.trim()) {
    message.warning('消息内容不能为空')
    return
  }
  
  // 1.1 先 JSON 化 message 消息内容
  const messageContent = JSON.stringify({
    text: sendText.value,
    toUserId: sendUserId.value
  })
  // 1.2 再 JSON 化整个消息
  const jsonMessage = JSON.stringify({
    type: 'demo-message-send',
    content: messageContent
  })
  // 2. 最后发送消息
  send(jsonMessage)
  sendText.value = ''
}

/** 切换 websocket 连接状态 */
const toggleConnectStatus = () => {
  if (getIsOpen.value) {
    close()
  } else {
    open()
  }
}

/** 获取消息类型的徽标颜色 */
const getMessageBadgeColor = (type?: string) => {
  switch (type) {
    case 'single': return 'blue'
    case 'group': return 'green'
    case 'system': return 'red'
    default: return 'default'
  }
}

/** 获取消息类型的文本 */
const getMessageTypeText = (type?: string) => {
  switch (type) {
    case 'single': return '单发'
    case 'group': return '群发'
    case 'system': return '系统'
    default: return '未知'
  }
}

/** 初始化 **/
const userList = ref<SystemUserApi.SystemUser[]>([]) // 用户列表
onMounted(async () => {
  userList.value = await getSimpleUserList()
})
</script>

<template>
  <Page>
    <DocAlert title="WebSocket 实时通信" url="https://doc.iocoder.cn/websocket/" />

    <div class="flex flex-col md:flex-row gap-4 mt-4">
      <!-- 左侧：建立连接、发送消息 -->
      <Card :bordered="false" class="w-full md:w-1/2">
        <template #title>
          <div class="flex items-center">
            <Badge :status="getIsOpen ? 'success' : 'error'" />
            <span class="ml-2 text-lg font-medium">连接管理</span>
          </div>
        </template>
        <div class="flex items-center mb-4 bg-gray-50 p-3 rounded-lg">
          <span class="mr-4 font-medium">连接状态:</span>
          <Tag :color="getTagColor" class="px-3 py-1">{{ getStatusText }}</Tag>
        </div>
        <div class="flex space-x-2 mb-6">
          <Input 
            v-model:value="server" 
            disabled
            class="rounded-md"
            size="large">
            <template #addonBefore>
              <span class="text-gray-600">服务地址</span>
            </template>
          </Input>
          <Button
            :type="getIsOpen ? 'default' : 'primary'"
            :danger="getIsOpen"
            size="large"
            class="flex-shrink-0"
            @click="toggleConnectStatus"
          >
            {{ getIsOpen ? '关闭连接' : '开启连接' }}
          </Button>
        </div>
        
        <Divider>
          <span class="text-gray-500">消息发送</span>
        </Divider>

        <Select 
          v-model:value="sendUserId" 
          class="w-full mb-3" 
          size="large"
          placeholder="请选择接收人"
          :disabled="!getIsOpen">
          <Select.Option key="" value="" label="所有人">
            <div class="flex items-center">
              <Avatar size="small" class="mr-2">全</Avatar>
              <span>所有人</span>
            </div>
          </Select.Option>
          <Select.Option
            v-for="user in userList"
            :key="user.id"
            :value="user.id"
            :label="user.nickname"
          >
            <div class="flex items-center">
              <Avatar size="small" class="mr-2">{{ user.nickname.slice(0, 1) }}</Avatar>
              <span>{{ user.nickname }}</span>
            </div>
          </Select.Option>
        </Select>
        
        <Input.TextArea
          v-model:value="sendText"
          :auto-size="{ minRows: 3, maxRows: 6 }"
          :disabled="!getIsOpen"
          class="rounded-lg border-1 border-gray-300"
          allowClear
          placeholder="请输入你要发送的消息..."
        />
        
        <Button 
          :disabled="!getIsOpen" 
          block 
          class="mt-4" 
          type="primary" 
          size="large"
          @click="handlerSend">
          <template #icon>
            <span class="i-ant-design:send-outlined mr-1" />
          </template>
          发送消息
        </Button>
      </Card>
      
      <!-- 右侧：消息记录 -->
      <Card :bordered="false" class="w-full md:w-1/2">
        <template #title>
          <div class="flex items-center">
            <span class="i-ant-design:message-outlined mr-2 text-lg" />
            <span class="text-lg font-medium">消息记录</span>
            <Tag v-if="messageList.length > 0" class="ml-2">{{ messageList.length }} 条</Tag>
          </div>
        </template>
        <div class="h-96 overflow-auto p-2 bg-gray-50 rounded-lg">
          <Empty v-if="messageList.length === 0" description="暂无消息记录" />
          <div v-else class="space-y-3">
            <div 
              v-for="msg in messageReverseList" 
              :key="msg.time" 
              class="p-3 bg-white rounded-lg shadow-sm"
            >
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center">
                  <Badge :color="getMessageBadgeColor(msg.type)" />
                  <span class="ml-1 text-gray-600 font-medium">{{ getMessageTypeText(msg.type) }}</span>
                  <span v-if="msg.userId" class="ml-2 text-gray-500">用户 ID: {{ msg.userId }}</span>
                </div>
                <span class="text-xs text-gray-400">{{ formatDate(msg.time) }}</span>
              </div>
              <div class="mt-2 text-gray-800 break-words">
                {{ msg.text }}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </Page>
</template>
