<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MpMessageApi } from '#/api/mp/message';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { MpMsgType as MsgType } from '@vben/constants';
import { formatDate2 } from '@vben/utils';

import { ElDialog, ElImage, ElTag } from 'element-plus';

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
        <ElTag v-if="row.sendFrom === 1" type="success">粉丝</ElTag>
        <ElTag v-else>公众号</ElTag>
      </template>

      <template #content="{ row }">
        <div
          v-if="
            (row.type as string) === (MsgType.Event as string) &&
            (row.event as string) === 'subscribe'
          "
        >
          <ElTag type="success">关注</ElTag>
        </div>
        <div
          v-else-if="
            (row.type as string) === (MsgType.Event as string) &&
            (row.event as string) === 'unsubscribe'
          "
        >
          <ElTag type="danger">取消关注</ElTag>
        </div>
        <div
          v-else-if="
            (row.type as string) === (MsgType.Event as string) &&
            (row.event as string) === 'CLICK'
          "
        >
          <ElTag>点击菜单</ElTag>
          【{{ row.eventKey }}】
        </div>
        <div v-else-if="row.type === MsgType.Event && row.event === 'VIEW'">
          <ElTag>点击菜单链接</ElTag>
          【{{ row.eventKey }}】
        </div>
        <div
          v-else-if="
            row.type === MsgType.Event && row.event === 'scancode_waitmsg'
          "
        >
          <ElTag>扫码结果</ElTag>
          【{{ row.eventKey }}】
        </div>
        <div
          v-else-if="
            row.type === MsgType.Event && row.event === 'scancode_push'
          "
        >
          <ElTag>扫码结果</ElTag>
          【{{ row.eventKey }}】
        </div>
        <div
          v-else-if="row.type === MsgType.Event && row.event === 'pic_sysphoto'"
        >
          <ElTag>系统拍照发图</ElTag>
        </div>
        <div
          v-else-if="
            row.type === MsgType.Event && row.event === 'pic_photo_or_album'
          "
        >
          <ElTag>拍照或者相册</ElTag>
        </div>
        <div
          v-else-if="row.type === MsgType.Event && row.event === 'pic_weixin'"
        >
          <ElTag>微信相册</ElTag>
        </div>
        <div
          v-else-if="
            row.type === MsgType.Event && row.event === 'location_select'
          "
        >
          <ElTag>选择地理位置</ElTag>
        </div>
        <div v-else-if="row.type === MsgType.Event">
          <ElTag type="danger">未知事件类型</ElTag>
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
            <ElImage :src="row.mediaUrl" :width="100" :preview-src-list="[]" />
          </a>
        </div>
        <div
          v-else-if="row.type === MsgType.Video || row.type === 'shortvideo'"
        >
          <WxVideoPlayer :url="row.mediaUrl || ''" class="mt-2" />
        </div>
        <div v-else-if="row.type === MsgType.Link">
          <ElTag>链接</ElTag>
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
          <ElTag type="danger">未知消息类型</ElTag>
        </div>
      </template>

      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '消息',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              onClick: () => handleSend(row.userId || 0),
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 发送消息的弹窗 -->
    <ElDialog
      v-model="messageBoxVisible"
      title="粉丝消息列表"
      width="800"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <WxMsg :user-id="messageBoxUserId" />
    </ElDialog>
  </Page>
</template>
