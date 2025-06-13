<script setup lang="ts">
import type { AiImageApi } from '#/api/ai/image';

import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, useVbenDrawer } from '@vben/common-ui';

import { useDebounceFn } from '@vueuse/core';
import { Button, Card, message, Pagination } from 'ant-design-vue';

import {
  deleteImageMy,
  getImageListMyByIds,
  getImagePageMy,
  midjourneyAction,
} from '#/api/ai/image';
import { AiImageStatusEnum } from '#/utils/constants';
import { download } from '#/utils/download';

import ImageCard from './ImageCard.vue';
import ImageDetail from './ImageDetail.vue';

// 暴露组件方法

const emits = defineEmits(['onRegeneration']);
const router = useRouter(); // 路由
const [Drawer, drawerApi] = useVbenDrawer({
  title: '图片详情',
  footer: false,
});
// 图片分页相关的参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
});
const pageTotal = ref<number>(0); // page size
const imageList = ref<AiImageApi.ImageVO[]>([]); // image 列表
const imageListRef = ref<any>(); // ref
// 图片轮询相关的参数（正在生成中的）
const inProgressImageMap = ref<{}>({}); // 监听的 image 映射，一般是生成中（需要轮询），key 为 image 编号，value 为 image
const inProgressTimer = ref<any>(); // 生成中的 image 定时器，轮询生成进展
const showImageDetailId = ref<number>(0); // 图片详情的图片编号

/** 处理查看绘图作品 */
const handleViewPublic = () => {
  router.push({
    name: 'AiImageSquare',
  });
};

/** 查看图片的详情  */
const handleDetailOpen = async () => {
  drawerApi.open();
};
/** 获得 image 图片列表 */
const getImageList = async () => {
  const loading = message.loading({
    content: `加载中...`,
  });
  try {
    // 1. 加载图片列表

    const { list, total } = await getImagePageMy(queryParams);
    imageList.value = list;
    pageTotal.value = total;

    // 2. 计算需要轮询的图片
    const newWatImages: any = {};
    imageList.value.forEach((item: any) => {
      if (item.status === AiImageStatusEnum.IN_PROGRESS) {
        newWatImages[item.id] = item;
      }
    });
    inProgressImageMap.value = newWatImages;
  } finally {
    // 关闭正在“加载中”的 Loading
    loading();
  }
};
const debounceGetImageList = useDebounceFn(getImageList, 80);
/** 轮询生成中的 image 列表 */
const refreshWatchImages = async () => {
  const imageIds = Object.keys(inProgressImageMap.value).map(Number);
  if (imageIds.length === 0) {
    return;
  }
  const list = (await getImageListMyByIds(imageIds)) as AiImageApi.ImageVO[];
  const newWatchImages: any = {};
  list.forEach((image) => {
    if (image.status === AiImageStatusEnum.IN_PROGRESS) {
      newWatchImages[image.id] = image;
    } else {
      const index = imageList.value.findIndex(
        (oldImage) => image.id === oldImage.id,
      );
      if (index !== -1) {
        // 更新 imageList
        imageList.value[index] = image;
      }
    }
  });
  inProgressImageMap.value = newWatchImages;
};

/** 图片的点击事件 */
const handleImageButtonClick = async (
  type: string,
  imageDetail: AiImageApi.ImageVO,
) => {
  // 详情
  if (type === 'more') {
    showImageDetailId.value = imageDetail.id;
    await handleDetailOpen();
    return;
  }
  // 删除
  if (type === 'delete') {
    await confirm(`是否删除照片?`);
    await deleteImageMy(imageDetail.id);
    await getImageList();
    message.success('删除成功!');
    return;
  }
  // 下载
  if (type === 'download') {
    await download.image({ url: imageDetail.picUrl });
    return;
  }
  // 重新生成
  if (type === 'regeneration') {
    await emits('onRegeneration', imageDetail);
  }
};

/** 处理 Midjourney 按钮点击事件  */
const handleImageMidjourneyButtonClick = async (
  button: AiImageApi.ImageMidjourneyButtonsVO,
  imageDetail: AiImageApi.ImageVO,
) => {
  // 1. 构建 params 参数
  const data = {
    id: imageDetail.id,
    customId: button.customId,
  } as AiImageApi.ImageMidjourneyActionVO;
  // 2. 发送 action
  await midjourneyAction(data);
  // 3. 刷新列表
  await getImageList();
};

defineExpose({ getImageList }); /** 组件挂在的时候 */
onMounted(async () => {
  // 获取 image 列表
  await getImageList();
  // 自动刷新 image 列表
  inProgressTimer.value = setInterval(async () => {
    await refreshWatchImages();
  }, 1000 * 3);
});

/** 组件取消挂在的时候 */
onUnmounted(async () => {
  if (inProgressTimer.value) {
    clearInterval(inProgressTimer.value);
  }
});
</script>

<template>
  <Drawer class="w-[600px]">
    <ImageDetail :id="showImageDetailId" />
  </Drawer>
  <Card
    class="dr-task"
    :body-style="{
      margin: 0,
      padding: 0,
      height: '100%',
      position: 'relative',
    }"
  >
    <template #title>
      绘画任务
      <!-- TODO @fan：看看，怎么优化下这个样子哈。 -->
      <Button @click="handleViewPublic">绘画作品</Button>
    </template>
    <div class="task-image-list" ref="imageListRef">
      <ImageCard
        v-for="image in imageList"
        :key="image.id"
        :detail="image"
        @on-btn-click="handleImageButtonClick"
        @on-mj-btn-click="handleImageMidjourneyButtonClick"
      />
    </div>
    <div class="task-image-pagination">
      <Pagination
        :total="pageTotal"
        :show-total="(total: number) => `共 ${total} 条`"
        show-quick-jumper
        show-size-changer
        v-model:current="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        @change="debounceGetImageList"
        @show-size-change="debounceGetImageList"
      />
    </div>
  </Card>
</template>
<style lang="scss">
.dr-task {
  width: 100%;
  height: 100%;
}

.task-image-list {
  position: relative;
  box-sizing: border-box; /* 确保内边距不会增加高度 */
  display: flex;
  flex-flow: row wrap;
  align-content: flex-start;
  height: 100%;
  padding: 20px 20px 140px;
  overflow: auto;

  > div {
    margin-right: 20px;
    margin-bottom: 20px;
  }

  > div:last-of-type {
    //margin-bottom: 100px;
  }
}

.task-image-pagination {
  position: absolute;
  bottom: 60px;
  z-index: 999;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 50px;
  line-height: 90px;
  background-color: #fff;
}
</style>
