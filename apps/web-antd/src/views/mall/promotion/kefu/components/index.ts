export { default as KeFuConversationList } from './KeFuConversationList.vue';
export { default as KeFuMessageList } from './KeFuMessageList.vue';
export { default as MemberInfo } from './member/MemberInfo.vue';

// TODO @jawe：components =》modules；在 vben 里，modules 是给自己用的，把一个大 vue 拆成 n 个小 vue；components 是给别的模块使用的；
// TODO @jawe：1）组件名小写，类似 conversation-list.vue；2）KeFu 开头可以去掉，因为已经是当前模块下，不用重复拼写；
