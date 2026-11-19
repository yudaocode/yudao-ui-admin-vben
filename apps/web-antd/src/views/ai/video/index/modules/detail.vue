<script lang="ts" setup>
import type { AiVideoApi } from '#/api/ai/video';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { AiVideoStatusEnum, DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Descriptions,
  DescriptionsItem,
  Empty,
  Spin,
} from 'ant-design-vue';

import { getVideo, getVideoDetail } from '#/api/ai/video';
import { DictTag } from '#/components/dict-tag';
import {
  formatVideoOptions,
  VIDEO_MODE_LABELS,
  VIDEO_ROLE_LABELS,
} from '#/views/ai/utils/video';

/** AI 视频：作品详情（创作页：本人或已公开；视频生成管理：管理员视角） */
defineOptions({ name: 'AiVideoDetail' });

const emit = defineEmits<{
  same: [item: AiVideoApi.Video];
}>();

const loading = ref(false); // 弹窗的加载中
const scope = ref('mine'); // 详情的来源：mine - 创作页（我的、公开作品）；admin - 视频生成管理
const detail = ref<AiVideoApi.Video | null>(); // 详情

const getTitle = computed(() =>
  scope.value === 'admin' ? '视频详情' : '作品详情',
);

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      detail.value = undefined;
      return;
    }
    // 加载数据：创作页本人可见输入文件；视频生成管理额外展示用户、密钥与服务商任务
    const data = modalApi.getData() as { id: number; scope?: string };
    if (!data?.id) {
      return;
    }
    scope.value = data.scope || 'mine';
    modalApi.setState({ footer: scope.value !== 'admin' });
    loading.value = true;
    try {
      detail.value =
        scope.value === 'admin'
          ? await getVideo(data.id)
          : await getVideoDetail(data.id);
    } finally {
      loading.value = false;
    }
  },
});

/** 做同款：带回左侧表单 */
function handleSame() {
  emit('same', detail.value!);
  modalApi.close();
}
</script>

<template>
  <Modal :title="getTitle" class="w-[760px]">
    <Spin :spinning="loading">
      <template v-if="detail">
        <video
          v-if="detail.status === AiVideoStatusEnum.SUCCESS && detail.videoUrl"
          :src="detail.videoUrl"
          :poster="detail.coverUrl"
          controls
          class="mb-3 max-h-[400px] w-full rounded-md bg-black"
        ></video>
        <Descriptions :column="2" size="small" bordered>
          <template v-if="scope === 'admin'">
            <DescriptionsItem label="编号">{{ detail.id }}</DescriptionsItem>
            <DescriptionsItem label="用户">
              {{ detail.userNickname || detail.userId }}
            </DescriptionsItem>
          </template>
          <DescriptionsItem label="创作类型">
            <DictTag :type="DICT_TYPE.AI_VIDEO_TYPE" :value="detail.type" />
          </DescriptionsItem>
          <DescriptionsItem label="状态">
            <DictTag :type="DICT_TYPE.AI_VIDEO_STATUS" :value="detail.status" />
          </DescriptionsItem>
          <DescriptionsItem label="服务商">
            <DictTag :type="DICT_TYPE.AI_PLATFORM" :value="detail.platform" />
          </DescriptionsItem>
          <DescriptionsItem label="模型">{{ detail.model }}</DescriptionsItem>
          <DescriptionsItem v-if="detail.mode" label="生成方式">
            {{ VIDEO_MODE_LABELS[detail.mode] || detail.mode }}
          </DescriptionsItem>
          <DescriptionsItem v-if="scope !== 'admin'" label="作者">
            {{ detail.userNickname || '-' }}
          </DescriptionsItem>
          <template v-if="scope === 'admin'">
            <DescriptionsItem label="API 密钥">
              {{ detail.apiKeyName || detail.apiKeyId || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="服务商任务" :span="2">
              <span class="break-all">{{ detail.taskId || '-' }}</span>
            </DescriptionsItem>
          </template>
          <DescriptionsItem label="提示词" :span="2">
            <span class="whitespace-pre-wrap break-all">
              {{ detail.prompt || '-' }}
            </span>
          </DescriptionsItem>
          <DescriptionsItem label="参数" :span="2">
            <span class="break-all">{{ formatVideoOptions(detail) }}</span>
          </DescriptionsItem>
          <DescriptionsItem v-if="detail.inputUrls" label="输入文件" :span="2">
            <div
              v-for="(urls, role) in detail.inputUrls"
              :key="role"
              class="leading-[22px]"
            >
              <span class="text-gray-500">
                {{ VIDEO_ROLE_LABELS[role] || role }}：
              </span>
              <a
                v-for="(url, index) in urls"
                :key="index"
                :href="url"
                target="_blank"
                class="mr-2 text-primary"
              >
                查看{{ urls.length > 1 ? index + 1 : '' }}
              </a>
            </div>
          </DescriptionsItem>
          <DescriptionsItem
            v-if="detail.errorMessage"
            label="失败原因"
            :span="2"
          >
            <span class="break-all text-red-500">{{
              detail.errorMessage
            }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="创建时间">
            {{ formatDateTime(detail.createTime) }}
          </DescriptionsItem>
          <DescriptionsItem label="完成时间">
            {{ detail.finishTime ? formatDateTime(detail.finishTime) : '-' }}
          </DescriptionsItem>
        </Descriptions>
      </template>
      <Empty v-else-if="!loading" description="视频不存在" />
    </Spin>
    <template #footer>
      <Button
        v-if="detail?.videoUrl"
        :href="detail.videoUrl"
        target="_blank"
        download
      >
        下载
      </Button>
      <Button type="primary" :disabled="!detail" @click="handleSame">
        做同款
      </Button>
    </template>
  </Modal>
</template>
