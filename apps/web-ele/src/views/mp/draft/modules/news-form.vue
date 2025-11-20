<script lang="ts" setup>
import type { NewsItem } from './types';

import { computed, ref } from 'vue';

import { confirm } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ElAside,
  ElButton,
  ElCol,
  ElContainer,
  ElInput,
  ElMain,
  ElRow,
} from 'element-plus';

import { Tinymce as RichTextarea } from '#/components/tinymce';

import CoverSelect from './cover-select.vue';
import { createEmptyNewsItem } from './types';

defineOptions({ name: 'NewsForm' });

const props = defineProps<{
  isCreating: boolean;
  modelValue: NewsItem[] | null;
}>();

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
  <ElContainer>
    <ElAside width="40%">
      <div class="mx-auto mb-2.5 w-3/5 border border-gray-200 p-2.5">
        <div v-for="(news, index) in newsList" :key="index">
          <div
            class="group mx-auto h-[120px] w-full cursor-pointer bg-white"
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
              v-if="newsList.length > 1"
              class="relative -bottom-6 hidden text-center group-hover:block"
            >
              <ElButton
                type="info"
                circle
                size="small"
                @click="() => moveDownNews(index)"
              >
                <IconifyIcon icon="ep:arrow-down-bold" />
              </ElButton>
              <ElButton
                v-if="isCreating"
                type="danger"
                circle
                size="small"
                @click="() => removeNews(index)"
              >
                <IconifyIcon icon="ep:delete" />
              </ElButton>
            </div>
          </div>
          <!-- TODO @hw：1）每个文章的选中框太粗了；2）没完全覆盖住文章；；；最好首个文章，和第个文章的情况，都看看 -->
          <div
            class="group mx-auto w-full cursor-pointer border-t border-gray-200 bg-white py-1.5"
            v-if="index > 0"
            :class="{
              'border-[5px] border-[#2bb673]': activeNewsIndex === index,
            }"
            @click="activeNewsIndex = index"
          >
            <div class="relative -ml-0.5">
              <div class="inline-block w-[70%] text-xs">{{ news.title }}</div>
              <div class="inline-block w-1/4 bg-[#acadae]">
                <img class="h-full w-full" :src="news.thumbUrl" width="100%" />
              </div>
            </div>
            <!-- TODO @hw：这里的按钮，交互不太对。应该在每个卡片的里面；或者类似公众号现在的交互，放到右侧；。。。复现本周：如果有 2 个文章的时候 -->
            <!-- TODO @hw：当有 2 个文章的时候，挪到第二个文章的时候，卡片会变大。期望：不变大 -->
            <div
              class="relative -bottom-6 hidden text-center group-hover:block"
            >
              <ElButton
                v-if="newsList.length > index + 1"
                circle
                type="info"
                size="small"
                @click="() => moveDownNews(index)"
              >
                <IconifyIcon icon="ep:arrow-down-bold" />
              </ElButton>
              <ElButton
                v-if="index > 0"
                type="info"
                circle
                size="small"
                @click="() => moveUpNews(index)"
              >
                <IconifyIcon icon="ep:arrow-up-bold" />
              </ElButton>
              <ElButton
                v-if="isCreating"
                type="danger"
                size="small"
                circle
                @click="() => removeNews(index)"
              >
                <IconifyIcon icon="ep:delete" />
              </ElButton>
            </div>
          </div>
        </div>
        <ElRow
          justify="center"
          class="mt-1.5 border-t border-gray-200 pt-1.5 text-center"
        >
          <ElButton
            type="primary"
            circle
            @click="plusNews"
            v-if="newsList.length < 8 && isCreating"
          >
            <IconifyIcon icon="ep:plus" />
          </ElButton>
        </ElRow>
      </div>
    </ElAside>
    <ElMain>
      <div v-if="newsList.length > 0 && activeNewsItem">
        <!-- 标题、作者、原文地址 -->
        <ElRow :gutter="20" class="mb-5 last:mb-0">
          <ElInput
            v-model="activeNewsItem.title"
            placeholder="请输入标题（必填）"
          />
          <ElInput
            v-model="activeNewsItem.author"
            placeholder="请输入作者"
            class="mt-1.5"
          />
          <ElInput
            v-model="activeNewsItem.contentSourceUrl"
            placeholder="请输入原文地址"
            class="mt-1.5"
          />
        </ElRow>
        <!-- 封面和摘要 -->
        <ElRow :gutter="20" class="mb-5 last:mb-0">
          <ElCol :span="12">
            <CoverSelect
              v-model="activeNewsItem"
              :is-first="activeNewsIndex === 0"
            />
          </ElCol>
          <ElCol :span="12">
            <p>摘要:</p>
            <ElInput
              :rows="8"
              type="textarea"
              v-model="activeNewsItem.digest"
              placeholder="请输入摘要"
              class="inline-block w-full align-top"
              maxlength="120"
            />
          </ElCol>
        </ElRow>
        <!--富文本编辑器组件-->
        <ElRow class="mb-5 last:mb-0">
          <RichTextarea v-model="activeNewsItem.content" />
        </ElRow>
      </div>
    </ElMain>
  </ElContainer>
</template>
