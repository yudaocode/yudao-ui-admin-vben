import antdLocale from 'ant-design-vue/es/locale/zh_CN'
import { genMessage } from '../helper'

const modules = import.meta.glob('./zh-CN/**/*.json', { eager: true })
export default {
  message: {
    ...genMessage(modules as Recordable<Recordable>, 'zh-CN'),
    antdLocale,
  },
}
