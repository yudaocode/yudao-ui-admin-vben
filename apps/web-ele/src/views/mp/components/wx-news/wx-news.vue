<script lang="ts" setup>
import { ElImage } from 'element-plus';

/** 微信消息 - 图文 */
defineOptions({ name: 'WxNews' });

const props = withDefaults(
  defineProps<{
    articles?: any[] | null;
  }>(),
  {
    articles: null,
  },
);

defineExpose({
  articles: props.articles,
});
</script>

<template>
  <div class="news-home">
    <div v-for="(article, index) in articles" :key="index" class="news-div">
      <!-- 头条 -->
      <!-- TODO @hw：第一篇文章（头条）图片是铺满，不过要限制高度；第二篇文章开始（次条），图片是在右侧，也是需要限制宽高 -->
      <a v-if="index === 0" :href="article.url" target="_blank">
        <div class="news-main">
          <div class="news-content flex items-center justify-center">
            <ElImage
              :src="article.picUrl || article.thumbUrl"
              class="material-img"
            />
            <div class="news-content-title">
              <span>{{ article.title }}</span>
            </div>
          </div>
        </div>
      </a>
      <!-- 二条/三条等等 -->
      <a v-else :href="article.url" target="_blank">
        <div class="news-main-item">
          <div class="news-content-item">
            <div class="news-content-item-title">{{ article.title }}</div>
            <div class="news-content-item-img flex items-center justify-center">
              <img
                :src="article.picUrl || article.thumbUrl"
                class="material-img"
                height="100%"
              />
            </div>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/** TODO @dylan：@hw：看看有没适合 tindwind 的哈。 */

.news-home {
  width: 100%;
  margin: auto;
  background-color: #fff;
}

.news-main {
  width: 100%;
  margin: auto;
}

.news-content {
  position: relative;
  width: 100%;
  background-color: #acadae;
}

.news-content-title {
  position: absolute;
  bottom: 0;
  left: 0;
  box-sizing: unset !important;
  display: inline-block;
  width: 98%;
  padding: 1%;
  font-size: 12px;
  color: #fff;
  white-space: normal;
  background-color: black;
  opacity: 0.65;
}

.news-main-item {
  padding: 5px 0;
  background-color: #fff;
  border-top: 1px solid #eaeaea;
}

.news-content-item {
  position: relative;
}

.news-content-item-title {
  display: inline-block;
  width: 70%;
  margin-left: 1%;
  font-size: 10px;
  white-space: normal;
}

.news-content-item-img {
  display: inline-block;
  width: 25%;
  margin-right: 1%;
  background-color: #acadae;
}

.material-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
</style>
