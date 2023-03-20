import { DictTag } from '@/components/DictTag'
import { Image, Tag } from 'ant-design-vue'
import dayjs from 'dayjs'
import { h } from 'vue'

export const useRender = {
  // 渲染图片
  renderImg: (text) => {
    if (text) {
      return h(Image, {
        src: text,
        height: 80,
        width: 80
      })
    }
  },
  renderTag: (text, color?) => {
    if (!color) {
      return h(Tag, { color }, () => text)
    } else {
      return h('span', text)
    }
  },
  renderDate: (text, format?) => {
    if (!format) {
      return dayjs(text).format('YYYY-MM-DD HH:mm:ss')
    } else {
      return dayjs(text).format(format)
    }
  },
  renderDict: (text, type, dictType?) => {
    if (type) {
      return h(DictTag, {
        type: type,
        value: text,
        dictType: dictType || 'number'
      })
    }
  }
}
