<script lang="ts" setup>
import type { WxMusicProps } from './types';

import { computed } from 'vue';

import { Typography } from 'ant-design-vue';

/** 微信消息 - 音乐 */
defineOptions({ name: 'WxMusic' });

const props = withDefaults(defineProps<WxMusicProps>(), {
  title: '',
  description: '',
  musicUrl: '',
  hqMusicUrl: '',
  thumbMediaUrl: '',
});

const { Link } = Typography;

const href = computed(() => props.hqMusicUrl || props.musicUrl);

defineExpose({
  musicUrl: props.musicUrl,
});
</script>

<template>
  <div>
    <Link :href="href" target="_blank" class="text-success no-underline">
      <div class="music-card">
        <div class="music-avatar">
          <img :src="thumbMediaUrl" alt="音乐封面" />
        </div>
        <div class="music-detail">
          <div class="music-title">{{ title }}</div>
          <div class="music-description">{{ description }}</div>
        </div>
      </div>
    </Link>
  </div>
</template>

<style lang="scss" scoped>
/** TODO @dylan：看看有没适合 tindwind 的哈。 */

.music-card {
  display: flex;
  padding: 10px;
  background-color: #fff;
  border-radius: 5px;
}

.music-avatar {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  margin-right: 12px;
  overflow: hidden;
  border-radius: 4px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.music-detail {
  flex: 1;
  overflow: hidden;
}

.music-title {
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.music-description {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}
</style>
