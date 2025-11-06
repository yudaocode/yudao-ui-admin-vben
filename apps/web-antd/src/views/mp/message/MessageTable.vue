<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { formatDate2 } from '@vben/utils';

import { Button, Image, Table, Tag } from 'ant-design-vue';

import { WxLocation } from '#/views/mp/components/wx-location';
import { MsgType } from '#/views/mp/components/wx-msg/types';
import { WxMusic } from '#/views/mp/components/wx-music';
import { WxNews } from '#/views/mp/components/wx-news';
import { WxVideoPlayer } from '#/views/mp/components/wx-video-play';
import { WxVoicePlayer } from '#/views/mp/components/wx-voice-play';

const props = withDefaults(
  defineProps<{
    list?: any[];
    loading?: boolean;
  }>(),
  {
    list() {
      return [];
    },
    loading: false,
  },
);

const emit = defineEmits<{
  (e: 'send', userId: number): void;
}>();

const columns: TableColumnsType = [
  {
    title: '发送时间',
    dataIndex: 'createTime',
    width: 180,
    align: 'center',
    customRender({ record }) {
      return formatDate2(record.createTime);
    },
  },
  {
    title: '消息类型',
    dataIndex: 'type',
    width: 80,
    align: 'center',
  },
  {
    title: '发送方',
    dataIndex: 'sendFrom',
    width: 80,
    align: 'center',
  },
  {
    title: '用户标识',
    dataIndex: 'openid',
    width: 300,
    align: 'center',
  },
  {
    title: '内容',
    dataIndex: 'content',
    align: 'left',
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    align: 'center',
    fixed: 'right',
  },
];
</script>

<template>
  <Table
    :columns="columns"
    :data-source="props.list"
    :loading="props.loading"
    :pagination="false"
    row-key="id"
  >
    <!-- 发送方列 -->
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'sendFrom'">
        <Tag v-if="record.sendFrom === 1" color="success">粉丝</Tag>
        <Tag v-else color="default">公众号</Tag>
      </template>

      <!-- 内容列 -->
      <template v-else-if="column.dataIndex === 'content'">
        <!-- 【事件】区域 -->
        <div
          v-if="record.type === MsgType.Event && record.event === 'subscribe'"
        >
          <Tag color="success">关注</Tag>
        </div>
        <div
          v-else-if="
            record.type === MsgType.Event && record.event === 'unsubscribe'
          "
        >
          <Tag color="error">取消关注</Tag>
        </div>
        <div
          v-else-if="record.type === MsgType.Event && record.event === 'CLICK'"
        >
          <Tag>点击菜单</Tag>
          【{{ record.eventKey }}】
        </div>
        <div
          v-else-if="record.type === MsgType.Event && record.event === 'VIEW'"
        >
          <Tag>点击菜单链接</Tag>
          【{{ record.eventKey }}】
        </div>
        <div
          v-else-if="
            record.type === MsgType.Event && record.event === 'scancode_waitmsg'
          "
        >
          <Tag>扫码结果</Tag>
          【{{ record.eventKey }}】
        </div>
        <div
          v-else-if="
            record.type === MsgType.Event && record.event === 'scancode_push'
          "
        >
          <Tag>扫码结果</Tag>
          【{{ record.eventKey }}】
        </div>
        <div
          v-else-if="
            record.type === MsgType.Event && record.event === 'pic_sysphoto'
          "
        >
          <Tag>系统拍照发图</Tag>
        </div>
        <div
          v-else-if="
            record.type === MsgType.Event &&
            record.event === 'pic_photo_or_album'
          "
        >
          <Tag>拍照或者相册</Tag>
        </div>
        <div
          v-else-if="
            record.type === MsgType.Event && record.event === 'pic_weixin'
          "
        >
          <Tag>微信相册</Tag>
        </div>
        <div
          v-else-if="
            record.type === MsgType.Event && record.event === 'location_select'
          "
        >
          <Tag>选择地理位置</Tag>
        </div>
        <div v-else-if="record.type === MsgType.Event">
          <Tag color="error">未知事件类型</Tag>
        </div>

        <!-- 【消息】区域 -->
        <div v-else-if="record.type === MsgType.Text">{{ record.content }}</div>
        <div v-else-if="record.type === MsgType.Voice">
          <WxVoicePlayer :url="record.mediaUrl" :content="record.recognition" />
        </div>
        <div v-else-if="record.type === MsgType.Image">
          <a :href="record.mediaUrl" target="_blank">
            <Image :src="record.mediaUrl" :width="100" :preview="false" />
          </a>
        </div>
        <div
          v-else-if="
            record.type === MsgType.Video || record.type === 'shortvideo'
          "
        >
          <WxVideoPlayer :url="record.mediaUrl" class="mt-2" />
        </div>
        <div v-else-if="record.type === MsgType.Link">
          <Tag>链接</Tag>
          ：
          <a :href="record.url" target="_blank">{{ record.title }}</a>
        </div>
        <div v-else-if="record.type === MsgType.Location">
          <WxLocation
            :label="record.label"
            :location-y="record.locationY"
            :location-x="record.locationX"
          />
        </div>
        <div v-else-if="record.type === MsgType.Music">
          <WxMusic
            :title="record.title"
            :description="record.description"
            :thumb-media-url="record.thumbMediaUrl"
            :music-url="record.musicUrl"
            :hq-music-url="record.hqMusicUrl"
          />
        </div>
        <div v-else-if="record.type === MsgType.News">
          <WxNews :articles="record.articles" />
        </div>
        <div v-else>
          <Tag color="error">未知消息类型</Tag>
        </div>
      </template>

      <!-- 操作列 -->
      <template v-else-if="column.key === 'action'">
        <Button type="link" @click="emit('send', record.userId)"> 消息 </Button>
      </template>
    </template>
  </Table>
</template>
