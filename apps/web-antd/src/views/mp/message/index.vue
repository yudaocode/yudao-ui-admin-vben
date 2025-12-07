<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MpMessageApi } from '#/api/mp/message';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { MpMsgType as MsgType } from '@vben/constants';
import { formatDate2 } from '@vben/utils';

import { Image, Modal, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMessagePage } from '#/api/mp/message';
import {
  WxAccountSelect,
  WxLocation,
  WxMsg,
  WxMusic,
  WxNews,
  WxVideoPlayer,
  WxVoicePlayer,
} from '#/views/mp/components';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'MpMessage' });

// 消息对话框
const messageBoxVisible = ref(false);
const messageBoxUserId = ref(0);

/** 公众号变化时查询数据 */
function handleAccountChange(accountId: number) {
  gridApi.formApi.setValues({ accountId });
  gridApi.formApi.submitForm();
}

/** 打开消息发送窗口 */
function handleSend(userId: number) {
  messageBoxUserId.value = userId;
  messageBoxVisible.value = true;
}

const [Grid, gridApi] = useVbenVxeGrid<MpMessageApi.Message>({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMessagePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
      autoLoad: false,
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
    showOverflow: 'tooltip',
  } as VxeTableGridOptions<MpMessageApi.Message>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #form-accountId>
        <WxAccountSelect @change="handleAccountChange" />
      </template>
      <template #createTime="{ row }">
        {{ row.createTime ? formatDate2(row.createTime) : '' }}
      </template>

      <template #sendFrom="{ row }">
        <Tag v-if="row.sendFrom === 1" color="success">粉丝</Tag>
        <Tag v-else>公众号</Tag>
      </template>

      <template #content="{ row }">
        <div
          v-if="
            (row.type as string) === (MsgType.Event as string) &&
            (row.event as string) === 'subscribe'
          "
        >
          <Tag color="success">关注</Tag>
        </div>
        <div
          v-else-if="
            (row.type as string) === (MsgType.Event as string) &&
            (row.event as string) === 'unsubscribe'
          "
        >
          <Tag color="error">取消关注</Tag>
        </div>
        <div
          v-else-if="
            (row.type as string) === (MsgType.Event as string) &&
            (row.event as string) === 'CLICK'
          "
        >
          <Tag>点击菜单</Tag>
          【{{ row.eventKey }}】
        </div>
        <div v-else-if="row.type === MsgType.Event && row.event === 'VIEW'">
          <Tag>点击菜单链接</Tag>
          【{{ row.eventKey }}】
        </div>
        <div
          v-else-if="
            row.type === MsgType.Event && row.event === 'scancode_waitmsg'
          "
        >
          <Tag>扫码结果</Tag>
          【{{ row.eventKey }}】
        </div>
        <div
          v-else-if="
            row.type === MsgType.Event && row.event === 'scancode_push'
          "
        >
          <Tag>扫码结果</Tag>
          【{{ row.eventKey }}】
        </div>
        <div
          v-else-if="row.type === MsgType.Event && row.event === 'pic_sysphoto'"
        >
          <Tag>系统拍照发图</Tag>
        </div>
        <div
          v-else-if="
            row.type === MsgType.Event && row.event === 'pic_photo_or_album'
          "
        >
          <Tag>拍照或者相册</Tag>
        </div>
        <div
          v-else-if="row.type === MsgType.Event && row.event === 'pic_weixin'"
        >
          <Tag>微信相册</Tag>
        </div>
        <div
          v-else-if="
            row.type === MsgType.Event && row.event === 'location_select'
          "
        >
          <Tag>选择地理位置</Tag>
        </div>
        <div v-else-if="row.type === MsgType.Event">
          <Tag color="error">未知事件类型</Tag>
        </div>

        <div v-else-if="row.type === MsgType.Text">{{ row.content }}</div>
        <div v-else-if="row.type === MsgType.Voice">
          <WxVoicePlayer
            :url="row.mediaUrl || ''"
            :content="row.recognition || ''"
          />
        </div>
        <div v-else-if="row.type === MsgType.Image">
          <a :href="row.mediaUrl" target="_blank">
            <Image :src="row.mediaUrl" :width="100" :preview="false" />
          </a>
        </div>
        <div
          v-else-if="row.type === MsgType.Video || row.type === 'shortvideo'"
        >
          <WxVideoPlayer :url="row.mediaUrl || ''" class="mt-2" />
        </div>
        <div v-else-if="row.type === MsgType.Link">
          <Tag>链接</Tag>
          ：
          <a :href="row.url" target="_blank">{{ row.title }}</a>
        </div>
        <div v-else-if="row.type === MsgType.Location">
          <WxLocation
            :label="row.label || ''"
            :location-y="row.locationY || 0"
            :location-x="row.locationX || 0"
          />
        </div>
        <div v-else-if="row.type === MsgType.Music">
          <WxMusic
            :title="row.title"
            :description="row.description"
            :thumb-media-url="row.thumbMediaUrl || ''"
            :music-url="row.musicUrl"
            :hq-music-url="row.hqMusicUrl"
          />
        </div>
        <div v-else-if="row.type === MsgType.News">
          <WxNews :articles="row.articles" />
        </div>
        <div v-else>
          <Tag color="error">未知消息类型</Tag>
        </div>
      </template>

      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '消息',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              onClick: () => handleSend(row.userId || 0),
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 发送消息的弹窗 -->
    <Modal
      v-model:open="messageBoxVisible"
      title="粉丝消息列表"
      :width="800"
      :footer="null"
      destroy-on-close
    >
      <WxMsg :user-id="messageBoxUserId" />
    </Modal>
  </Page>
</template>
