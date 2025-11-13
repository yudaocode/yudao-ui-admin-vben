export enum MsgType {
  Event = 'event',
  Image = 'image',
  Link = 'link',
  Location = 'location',
  Music = 'music',
  News = 'news',
  Text = 'text',
  Video = 'video',
  Voice = 'voice',
}

export interface User {
  accountId: number;
  avatar: string;
  nickname: string;
}
