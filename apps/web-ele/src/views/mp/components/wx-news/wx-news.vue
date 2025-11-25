<script lang="ts" setup>
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
      <a v-if="index === 0" :href="article.url" target="_blank">
        <div class="news-main">
          <div class="news-content">
            <img
              :src="article.picUrl"
              :preview="false"
              class="material-img flex w-[100px] items-center justify-center"
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
            <div class="news-content-item-img">
              <div class="news-content-item-title">{{ article.title }}</div>

              <img
                :src="article.picUrl"
                class="h-[70px] w-[70px] object-cover"
                alt="文章图片"
              />
            </div>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/** TODO @dylan：看看有没适合 tindwind 的哈。 */

.news-home {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  margin-left: 10px;
  font-size: 16px;
  color: #fff;
  white-space: normal;
}

.news-main-item {
  background-color: #fff;
}

.news-content-item {
  position: relative;
  box-sizing: border-box;
  padding: 10px;
}

.news-content-item-title {
  flex: 1;
  font-size: 14px;
}

.news-content-item-img {
  display: flex;
  align-items: center;
}

.material-img {
  width: auto;
  object-fit: cover;
}
</style>
