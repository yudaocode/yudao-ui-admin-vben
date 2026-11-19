<script lang="ts" setup>
import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  Descriptions,
  DescriptionsItem,
  Image,
  Spin,
} from 'antdv-next';

import { getDramaProjectPublicDetail } from '#/api/ai/drama/project';
import { DictTag } from '#/components/dict-tag';
import { formatDramaDuration } from '#/views/ai/utils/drama';

/** AI 短剧：公开项目详情 */
defineOptions({ name: 'AiDramaPublicDetail' });

const loading = ref(false); // 弹窗的加载中
const detail = ref<AiDramaProjectApi.Public>(); // 公开项目详情

/** 下载成片 */
function handleDownload() {
  if (detail.value?.composeFileUrl) {
    window.open(detail.value.composeFileUrl, '_blank');
  }
}

const [Modal, modalApi] = useVbenModal({
  cancelText: '关 闭',
  confirmText: '下载',
  onConfirm: handleDownload,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      detail.value = undefined;
      return;
    }
    const data = modalApi.getData() as { id: number };
    if (!data?.id) {
      return;
    }
    loading.value = true;
    try {
      detail.value = await getDramaProjectPublicDetail(data.id);
      modalApi.setState({ title: detail.value.name || '短剧详情' });
    } finally {
      loading.value = false;
    }
  },
});
</script>

<template>
  <Modal title="短剧详情" class="w-[760px]">
    <Spin :spinning="loading">
      <div class="min-h-[200px]">
        <template v-if="detail">
          <video
            :src="detail.composeFileUrl"
            controls
            class="max-h-[480px] w-full rounded-md bg-black"
          ></video>
          <Descriptions :column="2" bordered size="small" class="mt-3">
            <DescriptionsItem label="作者">
              {{ detail.userNickname || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="时长">
              {{ formatDramaDuration(detail.composeDuration) }}
            </DescriptionsItem>
            <DescriptionsItem label="画风">
              <DictTag
                v-if="detail.style"
                :type="DICT_TYPE.AI_DRAMA_STYLE"
                :value="detail.style"
              />
              <span v-else>-</span>
            </DescriptionsItem>
            <DescriptionsItem label="画幅 / 镜头">
              {{ detail.aspectRatio || '-' }} /
              {{ detail.storyboardCount ? `${detail.storyboardCount} 个` : '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="剧情大纲" :span="2">
              <span class="whitespace-pre-wrap break-all">
                {{ detail.outline || '-' }}
              </span>
            </DescriptionsItem>
          </Descriptions>
          <div v-if="detail.characters?.length" class="mt-3">
            <div class="mb-2 font-medium">角色</div>
            <div class="flex flex-wrap gap-3">
              <div
                v-for="(item, index) in detail.characters"
                :key="index"
                class="w-20 text-center"
              >
                <Image
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  :width="80"
                  :height="80"
                  class="rounded-md object-cover"
                />
                <div
                  v-else
                  class="flex size-20 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800"
                >
                  <IconifyIcon icon="lucide:user" class="size-7" />
                </div>
                <div class="mt-1 truncate text-xs">{{ item.name }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </Spin>
  </Modal>
</template>
