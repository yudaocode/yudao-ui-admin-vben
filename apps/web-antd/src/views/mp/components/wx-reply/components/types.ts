import type { Ref } from 'vue';

import { unref } from 'vue';

export enum ReplyType {
  Image = 'image',
  Music = 'music',
  News = 'news',
  Text = 'text',
  Video = 'video',
  Voice = 'voice',
}

export interface Reply {
  accountId: number;
  articles?: any[];
  content?: null | string;
  description?: null | string;
  hqMusicUrl?: null | string;
  introduction?: null | string;
  mediaId?: null | string;
  musicUrl?: null | string;
  name?: null | string;
  thumbMediaId?: null | string;
  thumbMediaUrl?: null | string;
  title?: null | string;
  type: ReplyType;
  url?: null | string;
}

export enum NewsType {
  Draft = '2',
  Published = '1',
}

/** 利用旧的reply[accountId, type]初始化新的Reply */
export const createEmptyReply = (old: Ref<Reply> | Reply): Reply => {
  return {
    accountId: unref(old).accountId,
    articles: [],
    content: null,
    description: null,
    hqMusicUrl: null,
    introduction: null,
    mediaId: null,
    musicUrl: null,
    name: null,
    thumbMediaId: null,
    thumbMediaUrl: null,
    title: null,
    type: unref(old).type,
    url: null,
  };
};
