<script lang="ts" setup>
import type { NewsItem } from './types';

import { computed, ref } from 'vue';

import { confirm } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Col, Input, Layout, Row, Textarea } from 'ant-design-vue';

import { Tinymce as RichTextarea } from '#/components/tinymce';

import CoverSelect from './cover-select.vue';
import { createEmptyNewsItem } from './types';

defineOptions({ name: 'NewsForm' });

const props = defineProps<{
  isCreating: boolean;
  modelValue: NewsItem[] | null;
}>();

// v-model=newsList
const emit = defineEmits<{
  (e: 'update:modelValue', v: NewsItem[]): void;
}>();

const newsList = computed<NewsItem[]>({
  get() {
    return props.modelValue === null
      ? [createEmptyNewsItem()]
      : props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});

const activeNewsIndex = ref(0);
const activeNewsItem = computed(() => {
  const item = newsList.value[activeNewsIndex.value];
  if (!item) {
    return createEmptyNewsItem();
  }
  return item;
});

// 将图文向下移动
function moveDownNews(index: number) {
  const current = newsList.value[index];
  const next = newsList.value[index + 1];
  if (current && next) {
    newsList.value[index] = next;
    newsList.value[index + 1] = current;
    activeNewsIndex.value = index + 1;
  }
}

// 将图文向上移动
function moveUpNews(index: number) {
  const current = newsList.value[index];
  const prev = newsList.value[index - 1];
  if (current && prev) {
    newsList.value[index] = prev;
    newsList.value[index - 1] = current;
    activeNewsIndex.value = index - 1;
  }
}

// 删除指定 index 的图文
async function removeNews(index: number) {
  try {
    await confirm('确定删除该图文吗?');
    newsList.value.splice(index, 1);
    if (activeNewsIndex.value === index) {
      activeNewsIndex.value = 0;
    }
  } catch {
    // empty
  }
}

// 添加一个图文
function plusNews() {
  newsList.value.push(createEmptyNewsItem());
  activeNewsIndex.value = newsList.value.length - 1;
}
</script>

<template>
  <Layout>
    <Layout.Sider width="40%" theme="light">
      <div class="select-item">
        <div v-for="(news, index) in newsList" :key="index">
          <div
            class="news-main father"
            v-if="index === 0"
            :class="{ activeAddNews: activeNewsIndex === index }"
            @click="activeNewsIndex = index"
          >
            <div class="news-content">
              <img class="material-img" :src="news.thumbUrl" />
              <div class="news-content-title">{{ news.title }}</div>
            </div>
            <div class="child" v-if="newsList.length > 1">
              <Button
                type="default"
                shape="circle"
                size="small"
                @click="() => moveDownNews(index)"
              >
                <IconifyIcon icon="lucide:arrow-down" />
              </Button>
              <Button
                v-if="isCreating"
                type="primary"
                danger
                shape="circle"
                size="small"
                @click="() => removeNews(index)"
              >
                <IconifyIcon icon="lucide:trash-2" />
              </Button>
            </div>
          </div>
          <div
            class="news-main-item father"
            v-if="index > 0"
            :class="{ activeAddNews: activeNewsIndex === index }"
            @click="activeNewsIndex = index"
          >
            <div class="news-content-item">
              <div class="news-content-item-title">{{ news.title }}</div>
              <div class="news-content-item-img">
                <img class="material-img" :src="news.thumbUrl" width="100%" />
              </div>
            </div>
            <div class="child">
              <Button
                v-if="newsList.length > index + 1"
                shape="circle"
                type="default"
                size="small"
                @click="() => moveDownNews(index)"
              >
                <IconifyIcon icon="lucide:arrow-down" />
              </Button>
              <Button
                v-if="index > 0"
                type="default"
                shape="circle"
                size="small"
                @click="() => moveUpNews(index)"
              >
                <IconifyIcon icon="lucide:arrow-up" />
              </Button>
              <Button
                v-if="isCreating"
                type="primary"
                danger
                size="small"
                shape="circle"
                @click="() => removeNews(index)"
              >
                <IconifyIcon icon="lucide:trash-2" />
              </Button>
            </div>
          </div>
        </div>
        <Row justify="center" class="ope-row">
          <Button
            type="primary"
            shape="circle"
            @click="plusNews"
            v-if="newsList.length < 8 && isCreating"
          >
            <IconifyIcon icon="lucide:plus" />
          </Button>
        </Row>
      </div>
    </Layout.Sider>
    <Layout.Content :style="{ backgroundColor: '#fff' }">
      <div v-if="newsList.length > 0 && activeNewsItem">
        <!-- 标题、作者、原文地址 -->
        <Row :gutter="20">
          <Col :span="24">
            <Input
              v-model:value="activeNewsItem.title"
              placeholder="请输入标题（必填）"
            />
          </Col>
          <Col :span="24" style="margin-top: 5px">
            <Input
              v-model:value="activeNewsItem.author"
              placeholder="请输入作者"
            />
          </Col>
          <Col :span="24" style="margin-top: 5px">
            <Input
              v-model:value="activeNewsItem.contentSourceUrl"
              placeholder="请输入原文地址"
            />
          </Col>
        </Row>
        <!-- 封面和摘要 -->
        <Row :gutter="20">
          <Col :span="12">
            <CoverSelect
              v-model="activeNewsItem"
              :is-first="activeNewsIndex === 0"
            />
          </Col>
          <Col :span="12">
            <p>摘要:</p>
            <Textarea
              :rows="8"
              v-model:value="activeNewsItem.digest"
              placeholder="请输入摘要"
              class="digest"
              :maxlength="120"
              :show-count="true"
            />
          </Col>
        </Row>
        <!--富文本编辑器组件-->
        <Row>
          <Col :span="24">
            <RichTextarea v-model="activeNewsItem.content" />
          </Col>
        </Row>
      </div>
    </Layout.Content>
  </Layout>
</template>

<style lang="scss" scoped>
.ope-row {
  padding-top: 5px;
  margin-top: 5px;
  text-align: center;
  border-top: 1px solid #eaeaea;
}

:deep(.ant-row) {
  margin-bottom: 20px;
}

:deep(.ant-row:last-child) {
  margin-bottom: 0;
}

.digest {
  display: inline-block;
  width: 100%;
  vertical-align: top;
}

/* 新增图文 */
.news-main {
  width: 100%;
  height: 120px;
  margin: auto;
  background-color: #fff;
}

.news-content {
  position: relative;
  width: 100%;
  height: 120px;
  background-color: #acadae;
}

.news-content-title {
  position: absolute;
  bottom: 0;
  left: 0;
  display: inline-block;
  width: 98%;
  height: 25px;
  padding: 1%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
  color: #fff;
  white-space: nowrap;
  background-color: black;
  opacity: 0.65;
}

.news-main-item {
  width: 100%;
  padding: 5px 0;
  margin: auto;
  background-color: #fff;
  border-top: 1px solid #eaeaea;
}

.news-content-item {
  position: relative;
  margin-left: -3px;
}

.news-content-item-title {
  display: inline-block;
  width: 70%;
  font-size: 12px;
}

.news-content-item-img {
  display: inline-block;
  width: 25%;
  background-color: #acadae;
}

.select-item {
  width: 60%;
  padding: 10px;
  margin: 0 auto 10px;
  border: 1px solid #eaeaea;

  .activeAddNews {
    border: 5px solid #2bb673;
  }
}

.father .child {
  position: relative;
  bottom: 25px;
  display: none;
  text-align: center;
}

.father:hover .child {
  display: block;
}

.material-img {
  width: 100%;
  height: 100%;
}
</style>
