// 统一导出所有模块组件

export { default as AccountSelect } from './wx-account-select/wx-account-select.vue';
export { default as WxAccountSelect } from './wx-account-select/wx-account-select.vue';

// TODO @hw：还是带着 wx 前缀。。。貌似好点，我的锅！！！
export { default as Location } from './wx-location/wx-location.vue';
export * from './wx-material-select/types';

export { default as MaterialSelect } from './wx-material-select/wx-material-select.vue';

export * from './wx-msg/types';

export { default as Music } from './wx-music/wx-music.vue';

export { default as News } from './wx-news/wx-news.vue';

export * from './wx-reply/types';

export { default as ReplySelect } from './wx-reply/wx-reply.vue';

export { default as VideoPlayer } from './wx-video-play/wx-video-play.vue';

export { default as VoicePlayer } from './wx-voice-play/wx-voice-play.vue';
