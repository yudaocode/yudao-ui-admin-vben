import type { Ref } from 'vue';

import { unref } from 'vue';

// TODO @hw：和 antd 风格，保持一致；
enum ReplyType {
  Image = 'image',
  Music = 'music',
  News = 'news',
  Text = 'text',
  Video = 'video',
  Voice = 'voice',
}

interface _Reply {
  accountId: number;
  type: ReplyType;
  name?: null | string;
  content?: null | string;
  mediaId?: null | string;
  url?: null | string;
  title?: null | string;
  description?: null | string;
  thumbMediaId?: null | string;
  thumbMediaUrl?: null | string;
  musicUrl?: null | string;
  hqMusicUrl?: null | string;
  introduction?: null | string;
  articles?: any[];
}

type Reply = _Reply; // Partial<_Reply>

/** 利用旧的 reply[accountId, type] 初始化新的 Reply */
const createEmptyReply = (old: Ref<Reply> | Reply): Reply => {
  return {
    accountId: unref(old).accountId,
    type: unref(old).type,
    name: null,
    content: null,
    mediaId: null,
    url: null,
    title: null,
    description: null,
    thumbMediaId: null,
    thumbMediaUrl: null,
    musicUrl: null,
    hqMusicUrl: null,
    introduction: null,
    articles: [],
  };
};

export { createEmptyReply, type Reply, ReplyType };
