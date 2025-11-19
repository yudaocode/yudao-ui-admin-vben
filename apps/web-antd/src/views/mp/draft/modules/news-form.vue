<script lang="ts" setup>
import type { MpDraftApi } from '#/api/mp/draft';

import { computed, ref } from 'vue';

import { confirm } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Col, Input, Layout, Row, Textarea } from 'ant-design-vue';

import { createEmptyNewsItem } from '#/api/mp/draft';
import { Tinymce as RichTextarea } from '#/components/tinymce';

import CoverSelect from './cover-select.vue';

defineOptions({ name: 'NewsForm' });

const props = defineProps<{
  isCreating: boolean;
  modelValue: MpDraftApi.NewsItem[] | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: MpDraftApi.NewsItem[]): void;
}>();

const newsList = computed<MpDraftApi.NewsItem[]>({
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

/** 将图文向下移动 */
function moveDownNews(index: number) {
  const current = newsList.value[index];
  const next = newsList.value[index + 1];
  if (current && next) {
    newsList.value[index] = next;
    newsList.value[index + 1] = current;
    activeNewsIndex.value = index + 1;
  }
}

/** 将图文向上移动 */
function moveUpNews(index: number) {
  const current = newsList.value[index];
  const prev = newsList.value[index - 1];
  if (current && prev) {
    newsList.value[index] = prev;
    newsList.value[index - 1] = current;
    activeNewsIndex.value = index - 1;
  }
}

/** 删除指定 index 的图文 */
async function removeNews(index: number) {
  await confirm('确定删除该图文吗?');
  newsList.value.splice(index, 1);
  if (activeNewsIndex.value === index) {
    activeNewsIndex.value = 0;
  }
}

/** 添加一个图文 */
function plusNews() {
  newsList.value.push(createEmptyNewsItem());
  activeNewsIndex.value = newsList.value.length - 1;
}
</script>

<template>
  <Layout>
    <Layout.Sider width="40%" theme="light">
      <div class="mx-auto mb-[10px] w-[60%] border border-[#eaeaea] p-[10px]">
        <div v-for="(news, index) in newsList" :key="index">
          <div
            class="group relative mx-auto h-[120px] w-full cursor-pointer bg-white"
            v-if="index === 0"
            :class="{
              'border-[5px] border-[#2bb673]': activeNewsIndex === index,
            }"
            @click="activeNewsIndex = index"
          >
            <div class="relative h-[120px] w-full bg-[#acadae]">
              <img class="h-full w-full" :src="news.thumbUrl" />
              <div
                class="absolute bottom-0 left-0 inline-block h-[25px] w-[98%] overflow-hidden text-ellipsis whitespace-nowrap bg-black p-[1%] text-[15px] text-white opacity-65"
              >
                {{ news.title }}
              </div>
            </div>
            <div
              class="relative -bottom-[25px] hidden text-center group-hover:block"
              v-if="newsList.length > 1"
            >
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
            class="group relative mx-auto w-full cursor-pointer border-t border-[#eaeaea] bg-white py-[5px]"
            v-if="index > 0"
            :class="{
              'border-[5px] border-[#2bb673]': activeNewsIndex === index,
            }"
            @click="activeNewsIndex = index"
          >
            <div class="relative -ml-[3px]">
              <div class="inline-block w-[70%] text-xs">{{ news.title }}</div>
              <div class="inline-block w-[25%] bg-[#acadae]">
                <img class="h-full w-full" :src="news.thumbUrl" />
              </div>
            </div>
            <div
              class="relative -bottom-[25px] hidden text-center group-hover:block"
            >
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
        <Row
          justify="center"
          class="mt-[5px] border-t border-[#eaeaea] pt-[5px] text-center"
        >
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
    <Layout.Content class="bg-white">
      <div v-if="newsList.length > 0 && activeNewsItem">
        <!-- 标题、作者、原文地址 -->
        <Row :gutter="20">
          <Col :span="24">
            <Input
              v-model:value="activeNewsItem.title"
              placeholder="请输入标题（必填）"
            />
          </Col>
          <Col :span="24" class="mt-[5px]">
            <Input
              v-model:value="activeNewsItem.author"
              placeholder="请输入作者"
            />
          </Col>
          <Col :span="24" class="mt-[5px]">
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
              class="inline-block w-full align-top"
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
:deep(.ant-row) {
  margin-bottom: 20px;
}

:deep(.ant-row:last-child) {
  margin-bottom: 0;
}
</style>
