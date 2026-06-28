<script lang="ts" setup>
import type { User } from '../../types';

import { computed } from 'vue';

import { ElImage } from 'element-plus';

import { ImFriendAddSource } from '../../../utils/constants';
import { getAvatarBgColor, getAvatarText } from '../../../utils/user';
import { useImUiStore } from '../../store/uiStore';

defineOptions({ name: 'ImUserAvatar', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    addSource?: number; // 加好友来源；点头像弹 UserInfoCard 时透传给 FriendAddDialog（默认 1=搜索）
    addSourceExtra?: string; // 加好友来源附加：addSource=2（群聊）时传群名，话术拼为「我是 XX 群的 YY」
    clickable?: boolean; // 是否点击弹出 UserInfoCard；默认 true
    id?: number | string; // 用户 id；传了才能点开名片
    name?: string; // 用户名（色卡文字 + 名片备用）
    previewable?: boolean; // 是否点头像直接放大预览；开启后忽略 clickable，不再弹名片
    previewZIndex?: number; // 预览层 z-index；放在高 z-index 弹层（如 UserInfoCard）里时需手动抬高
    radius?: string; // 圆角，支持 CSS 长度；默认 15% 方块小圆角（参考微信）
    size?: number; // 尺寸（px），正方形；优先于 width/height
    url?: string; // 头像图片 URL；为空时走色卡文字
    user?: User; // 额外的用户信息，传了点击就不用现拉接口（弹名片用）
  }>(),
  {
    addSourceExtra: undefined,
    clickable: true,
    id: undefined,
    name: undefined,
    previewable: false,
    previewZIndex: 2000,
    radius: '15%',
    size: 42,
    url: undefined,
    user: undefined,
    addSource: ImFriendAddSource.SEARCH,
  },
);

const uiStore = useImUiStore();

const imgStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: props.radius,
}));

const textStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.floor(props.size * (avatarText.value.length > 1 ? 0.34 : 0.42))}px`,
  background: textColor.value,
  borderRadius: props.radius,
}));

/** 色卡首字：中文取 1 个字、英文 / 拉丁取前 2 个字母 */
const avatarText = computed(() => getAvatarText(props.name));

/** 色卡底色：按昵称 charCode 哈希取调色板色 */
const textColor = computed(() => getAvatarBgColor(props.name));

/** 头像点击：previewable 走 el-image 预览不弹名片；否则按 user / id 任一入参打开名片 */
function handleClick(e: MouseEvent) {
  if (props.previewable) {
    return;
  }
  if (!props.clickable) {
    return;
  }
  // 情况一：有预传 user 信息：就直接用，省一次接口
  if (props.user) {
    uiStore.openUserInfoCardAtEvent(
      props.user,
      e,
      props.addSource,
      props.addSourceExtra,
    );
    return;
  }
  // 情况二：无预传 user 信息：打开名片，传最小必要信息（id + 昵称 + 头像），位置在鼠标右侧
  const numId = Number(props.id);
  if (!numId || numId <= 0) {
    return;
  }
  uiStore.openUserInfoCardAtEvent(
    {
      id: numId,
      nickname: props.name,
      avatar: props.url,
    },
    e,
    props.addSource,
    props.addSourceExtra,
  );
}
</script>

<template>
  <!--
    通用用户头像组件
    - 有 url 时展示图片；无 url 时展示色卡 + 首字母/首字
    - 点击默认触发 UserInfoCard（clickable）
    - previewable=true 时改为点头像直接放大预览（用于名片 / 详情页等大头像位）
  -->
  <div
    class="relative inline-flex"
    :style="{ cursor: clickable && !previewable ? 'pointer' : 'default' }"
    v-bind="$attrs"
    @click="handleClick"
  >
    <ElImage
      v-if="url && previewable"
      class="block overflow-hidden"
      :src="url"
      :preview-src-list="[url]"
      :preview-teleported="true"
      :z-index="previewZIndex"
      :style="imgStyle"
    />
    <img
      v-else-if="url"
      class="block overflow-hidden object-cover"
      :src="url"
      :style="imgStyle"
      loading="lazy"
      :alt="name || 'avatar'"
    />
    <div
      v-else
      class="flex items-center justify-center text-white font-medium select-none"
      :style="textStyle"
    >
      {{ avatarText }}
    </div>
    <!-- 允许外部插入装饰，如群聊角标 -->
    <slot></slot>
  </div>
</template>
