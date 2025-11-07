import type { Ref } from 'vue';

import { unref } from 'vue';

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

enum NewsType {
  Draft = '2',
  Published = '1',
}

/** 利用旧的reply[accountId, type]初始化新的Reply */
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

export { createEmptyReply, NewsType, type Reply, ReplyType };
