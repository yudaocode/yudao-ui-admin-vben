<script lang="ts" setup>
import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';

import { TabPane, Tabs } from 'ant-design-vue';

import MyList from './modules/my-list.vue';
import PublicList from './modules/public-list.vue';

/** AI 短剧：项目列表、公开广场；新建、编辑项目跳转到独立路由的项目表单 */
defineOptions({ name: 'AiDrama' });

const router = useRouter();

const activeTab = ref('my'); // 当前页签
const myListRef = ref<InstanceType<typeof MyList>>(); // 我的项目
const publicListRef = ref<InstanceType<typeof PublicList>>(); // 公开广场
let activated = false; // 是否已激活过：首次激活时列表已自行加载

/** 新建、编辑项目：同一个独立路由的项目表单，可刷新、返回 */
function openForm(id?: number) {
  if (id) {
    router.push({ name: 'AiDramaProject', params: { id } });
  } else {
    router.push({ name: 'AiDramaProjectCreate' });
  }
}

/** 从项目表单返回时，刷新当前列表 */
onActivated(() => {
  if (!activated) {
    activated = true;
    return;
  }
  if (activeTab.value === 'my') {
    myListRef.value?.getList();
  } else {
    publicListRef.value?.getList();
  }
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="AI 短剧制作" url="https://doc.iocoder.cn/ai/drama/" />
    </template>
    <div class="flex h-full flex-col">
      <Tabs v-model:active-key="activeTab" class="bg-card rounded-md px-4">
        <TabPane key="my" tab="我的项目" />
        <TabPane key="public" tab="公开广场" />
      </Tabs>
      <div class="mt-2 min-h-0 flex-1">
        <!-- 「新建项目」在我的项目的工具栏，与其它列表的新增入口一致 -->
        <MyList
          v-if="activeTab === 'my'"
          ref="myListRef"
          @create="openForm()"
          @edit="openForm"
        />
        <PublicList v-else ref="publicListRef" />
      </div>
    </div>
  </Page>
</template>
