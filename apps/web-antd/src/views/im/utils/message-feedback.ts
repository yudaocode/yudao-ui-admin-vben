// TODO @AI：是不是换成 vben 里更合适的方法；（直接使用 vben 内置的，不用封装）

import { h } from 'vue'

import { confirm, prompt } from '@vben/common-ui'

import { message as antdMessage, Checkbox, Input } from 'ant-design-vue'

type PromptOptions = {
  cancelText?: string
  defaultValue?: string
  maxLength?: number
  okText?: string
  placeholder?: string
  rows?: number
  textarea?: boolean
  validator?: (value: string) => string | true
}

/** IM 消息提示 */
export function useMessage() {
  return {
    async confirm(content: string, title = '提示') {
      await confirm(content, { title })
    },
    async createConfirm(options: {
      cancelText?: string
      confirmText?: string
      content: string
      title?: string
    }) {
      await confirm(options.content, {
        cancelText: options.cancelText,
        confirmText: options.confirmText,
        title: options.title || '提示'
      })
    },
    async delConfirm(content = '是否确认删除？') {
      await confirm(content, {
        cancelText: '取消',
        confirmText: '确定',
        icon: 'warning',
        title: '删除确认'
      })
    },
    error: antdMessage.error,
    info: antdMessage.info,
    async prompt(title: string, options: PromptOptions = {}) {
      const value = await prompt<string>({
        beforeClose(scope) {
          if (!scope.isConfirm) {
            return
          }
          const result = options.validator?.(scope.value || '')
          if (typeof result === 'string') {
            antdMessage.error(result)
            return false
          }
        },
        cancelText: options.cancelText || '取消',
        component: options.textarea ? Input.TextArea : Input,
        componentProps: {
          allowClear: true,
          maxlength: options.maxLength,
          placeholder: options.placeholder,
          rows: options.rows || 3
        },
        content: '',
        defaultValue: options.defaultValue || '',
        confirmText: options.okText || '确定',
        modelPropName: 'value',
        title
      })
      return { value: value || '' }
    },
    success: antdMessage.success,
    warning: antdMessage.warning
  }
}

/** 删除好友确认弹窗 */
export function confirmDeleteFriend(nickname: string, clearConversation: { value: boolean }) {
  return confirm({
    cancelText: '取消',
    confirmText: '删除',
    content: h('div', { class: 'flex flex-col gap-3 text-sm' }, [
      h('div', `确定删除好友「${nickname}」?`),
      h(
        Checkbox,
        {
          checked: clearConversation.value,
          'onUpdate:checked': (value: boolean) => {
            clearConversation.value = value
          }
        },
        () => '同时清空聊天记录'
      )
    ]),
    icon: 'warning',
    title: '删除联系人'
  })
}
