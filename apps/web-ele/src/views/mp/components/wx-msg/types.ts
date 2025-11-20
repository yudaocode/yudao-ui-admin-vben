// TODO @hw：是不是放枚举里？
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

// TODO @hw：用 MpUserApi 里的 user 可以么？
export interface User {
  nickname: string;
  avatar: string;
  accountId: number;
}
