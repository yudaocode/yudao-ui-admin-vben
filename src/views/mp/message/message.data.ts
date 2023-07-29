import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { getSimpleAccounts } from '@/api/mp/account'

export enum MsgType {
  Event = 'event',
  Text = 'text',
  Voice = 'voice',
  Image = 'image',
  Video = 'video',
  Link = 'link',
  Location = 'location',
  Music = 'music',
  News = 'news',
}

export const columns: BasicColumn[] = [
  {
    title: '发送时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '消息类型',
    dataIndex: 'type',
    width: 80,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.MP_MESSAGE_TYPE)
    },
  },
  {
    title: '发送方',
    dataIndex: 'sendFrom',
    width: 180,
    customRender: ({ text }) => {
      if (text === 1)
        return useRender.renderTag('粉丝', 'success')
      else
        return useRender.renderTag('公众号', 'default')
    },
  },
  {
    title: '用户标识',
    dataIndex: 'openid',
    width: 300,
  },
  {
    title: '内容',
    dataIndex: 'content',
    width: 300,
    customRender: ({ text, record }) => {
      if (record.type === MsgType.Event && record.event === 'subscribe') {
        return useRender.renderTag('关注', 'success')
      }
      else if (record.type === MsgType.Event && record.event === 'unsubscribe') {
        return useRender.renderTag('取消关注', 'warn')
      }
      else if (record.type === MsgType.Event && record.event === 'CLICK') {
        return useRender.renderTag(`点击菜单${record.eventKey}`)
      }
      else if (record.type === MsgType.Event && record.event === 'VIEW') {
        return useRender.renderTag(`点击菜单链接${record.eventKey}`)
      }
      else if (record.type === MsgType.Event && record.event === 'scancode_waitmsg') {
        return useRender.renderTag(`扫码结果${record.eventKey}`)
      }
      else if (record.type === MsgType.Event && record.event === 'scancode_push') {
        return useRender.renderTag(`扫码结果${record.eventKey}`)
      }
      else if (record.type === MsgType.Event && record.event === 'pic_sysphoto') {
        return useRender.renderTag('系统拍照发图')
      }
      else if (record.type === MsgType.Event && record.event === 'pic_photo_or_album') {
        return useRender.renderTag('拍照或者相册')
      }
      else if (record.type === MsgType.Event && record.event === 'pic_weixin') {
        return useRender.renderTag('微信相册')
      }
      else if (record.type === MsgType.Event && record.event === 'location_select') {
        return useRender.renderTag('选择地理位置')
      }
      else if (record.type === MsgType.Event) {
        return useRender.renderTag('未知事件类型')
      }
      else if (record.type === MsgType.Text) {
        return text
      }
      else if (record.type === MsgType.Voice) {
        // TODO voice
        return record.mediaUrl
      }
      else if (record.type === MsgType.Image) {
        return useRender.renderImg(record.mediaUrl)
      }
      else if (record.type === MsgType.Video || record.type === 'shortvideo') {
        // TODO
        return record.mediaUrl
      }
      else if (record.type === MsgType.Link) {
        return useRender.renderLink(record.url, record.title)
      }
      else if (record.type === MsgType.Location) {
        // TODO
        return record.label
      }
      else if (record.type === MsgType.Music) {
        // TODO
        return record.title
      }
      else if (record.type === MsgType.News) {
        // TODO
        return record.articles
      }
      else {
        return useRender.renderTag('未知消息类型', 'warn')
      }
    },
  },
]

const simpleAccountsOptinos = await getSimpleAccounts()

export const searchFormSchema: FormSchema[] = [
  {
    label: '公众号',
    field: 'accountId',
    component: 'Select',
    required: true,
    defaultValue: simpleAccountsOptinos[0].id,
    componentProps: {
      options: simpleAccountsOptinos,
      fieldNames: {
        label: 'name',
        value: 'id',
      },
    },
    colProps: { span: 8 },
  },
  {
    label: '消息类型',
    field: 'type',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.MP_MESSAGE_TYPE, 'string'),
    },
    colProps: { span: 8 },
  },
  {
    label: '用户标识',
    field: 'openid',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '创建时间',
    field: 'createTime',
    component: 'RangePicker',
    colProps: { span: 8 },
  },
]

export const formSchema: FormSchema[] = []
