import { defineStore } from 'pinia'
import { getUnreadNotifyMessageCount } from '@/api/system/notify/message'

interface MessageState {
  unreadCount: number // 未读消息数量
}

export const useUserMessageStore = defineStore('userMessage', {
  state: (): MessageState => ({
    unreadCount: 0,
  }),
  getters: {
    getUnreadCount(state) {
      return state.unreadCount
    },
  },
  actions: {
    // 更新未读消息的数量
    async updateUnreadCount() {
      const count = await getUnreadNotifyMessageCount()
      this.unreadCount = count
    },
  },
})
