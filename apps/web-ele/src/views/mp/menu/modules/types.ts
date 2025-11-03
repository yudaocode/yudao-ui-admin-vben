export interface Replay {
  title: string;
  description: string;
  picUrl: string;
  url: string;
}

export type MenuType =
  | ''
  | 'article_view_limited'
  | 'click'
  | 'location_select'
  | 'pic_photo_or_album'
  | 'pic_sysphoto'
  | 'pic_weixin'
  | 'scancode_push'
  | 'scancode_waitmsg'
  | 'view';

interface _RawMenu {
  // db
  id: number;
  parentId: number;
  accountId: number;
  appId: string;
  createTime: number;

  // mp-native
  name: string;
  menuKey: string;
  type: MenuType;
  url: string;
  miniProgramAppId: string;
  miniProgramPagePath: string;
  articleId: string;
  replyMessageType: string;
  replyContent: string;
  replyMediaId: string;
  replyMediaUrl: string;
  replyThumbMediaId: string;
  replyThumbMediaUrl: string;
  replyTitle: string;
  replyDescription: string;
  replyArticles: Replay;
  replyMusicUrl: string;
  replyHqMusicUrl: string;
}

export type RawMenu = Partial<_RawMenu>;

interface _Reply {
  type: string;
  accountId: number;
  content: string;
  mediaId: string;
  url: string;
  thumbMediaId: string;
  thumbMediaUrl: string;
  title: string;
  description: string;
  articles: null | Replay[];
  musicUrl: string;
  hqMusicUrl: string;
}

export type Reply = Partial<_Reply>;

interface _Menu extends RawMenu {
  children: _Menu[];
  reply: Reply;
}

export type Menu = Partial<_Menu>;
