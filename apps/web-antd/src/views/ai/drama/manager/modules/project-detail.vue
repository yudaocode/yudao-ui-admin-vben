<script lang="ts" setup>
import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { AiDramaStatusEnum, DICT_TYPE } from '@vben/constants';

import {
  Descriptions,
  DescriptionsItem,
  Empty,
  Spin,
  Table,
  TabPane,
  Tabs,
} from 'ant-design-vue';

import { getDramaProjectDetail } from '#/api/ai/drama/project';
import { DictTag } from '#/components/dict-tag';
import AssetImage from '#/views/ai/drama/components/asset-image.vue';
import {
  formatDramaDuration,
  getDramaProps,
  getSelectedImageUrl,
} from '#/views/ai/utils/drama';

/** AI 短剧制作管理：项目详情（只读） */
defineOptions({ name: 'AiDramaProjectDetail' });

const loading = ref(false); // 弹窗的加载中
const detail = ref<AiDramaProjectApi.ProjectDetail>(); // 项目详情

/** 当前的道具：不含关键帧、历史版本 */
const propList = computed(() => getDramaProps(detail.value?.visualAssets));

/** 镜头列表的字段 */
const storyboardColumns = [
  { title: '镜头', dataIndex: 'sceneNo', width: 60, align: 'center' as const },
  { title: '标题', dataIndex: 'title', width: 140, ellipsis: true },
  { title: '时长', dataIndex: 'duration', width: 70, align: 'center' as const },
  { title: '画面描述', dataIndex: 'sceneText', width: 220, ellipsis: true },
  { title: '状态', key: 'videoStatus', width: 100, align: 'center' as const },
  { title: '服务商任务', dataIndex: 'taskId', width: 160, ellipsis: true },
  { title: '视频', key: 'videoUrl', width: 80, align: 'center' as const },
  { title: '失败原因', key: 'errorMessage', width: 200, ellipsis: true },
];

const [Modal, modalApi] = useVbenModal({
  footer: false,
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
      detail.value = await getDramaProjectDetail(data.id);
    } finally {
      loading.value = false;
    }
  },
});
</script>

<template>
  <Modal title="短剧项目详情" class="w-[960px]">
    <Spin :spinning="loading">
      <div class="min-h-[200px]">
        <template v-if="detail">
          <Descriptions :column="3" bordered size="small">
            <DescriptionsItem label="编号">
              {{ detail.project.id }}
            </DescriptionsItem>
            <DescriptionsItem label="项目名称">
              {{ detail.project.name }}
            </DescriptionsItem>
            <DescriptionsItem label="用户">
              {{ detail.project.userNickname || detail.project.userId }}
            </DescriptionsItem>
            <DescriptionsItem label="画风">
              <DictTag
                :type="DICT_TYPE.AI_DRAMA_STYLE"
                :value="detail.project.style"
              />
            </DescriptionsItem>
            <DescriptionsItem label="画幅">
              {{ detail.project.composeAspectRatio }}
            </DescriptionsItem>
            <DescriptionsItem label="项目状态">
              <DictTag
                :type="DICT_TYPE.AI_DRAMA_PROJECT_STATUS"
                :value="detail.project.status"
              />
            </DescriptionsItem>
            <DescriptionsItem label="故事想法" :span="3">
              <span class="whitespace-pre-wrap break-all">
                {{ detail.project.idea || '-' }}
              </span>
            </DescriptionsItem>
            <DescriptionsItem label="成片状态">
              <DictTag
                v-if="detail.project.composeStatus"
                :type="DICT_TYPE.AI_DRAMA_STATUS"
                :value="detail.project.composeStatus"
              />
              <span v-else>未合成</span>
            </DescriptionsItem>
            <DescriptionsItem label="成片时长">
              {{ formatDramaDuration(detail.project.composeDuration) }}
            </DescriptionsItem>
            <DescriptionsItem label="成片画幅 / 镜头">
              {{ detail.project.composeAspectRatio || '-' }} /
              {{
                detail.project.composeStoryboardCount
                  ? `${detail.project.composeStoryboardCount} 个`
                  : '-'
              }}
            </DescriptionsItem>
            <DescriptionsItem label="是否公开">
              {{ detail.project.publicStatus ? '是' : '否' }}
            </DescriptionsItem>
            <DescriptionsItem
              v-if="
                detail.project.composeStatus === AiDramaStatusEnum.FAIL &&
                detail.project.composeErrorMessage
              "
              label="合成失败原因"
              :span="3"
            >
              <span class="break-all text-red-500">
                {{ detail.project.composeErrorMessage }}
              </span>
            </DescriptionsItem>
          </Descriptions>
          <video
            v-if="
              detail.project.composeStatus === AiDramaStatusEnum.SUCCESS &&
              detail.project.composeFileUrl
            "
            :src="detail.project.composeFileUrl"
            controls
            preload="metadata"
            class="mt-3 max-h-[360px] w-full rounded-md bg-black"
          ></video>

          <Tabs class="mt-3">
            <TabPane key="script" tab="剧本">
              <template v-if="detail.script">
                <div class="font-medium">{{ detail.script.title || '-' }}</div>
                <div
                  class="my-2 whitespace-pre-wrap text-xs text-muted-foreground"
                >
                  {{ detail.script.outline }}
                </div>
                <div class="max-h-[360px] overflow-auto whitespace-pre-wrap break-all">
                  {{ detail.script.content }}
                </div>
              </template>
              <Empty v-else description="暂无剧本" />
            </TabPane>
            <TabPane
              key="character"
              :tab="`角色（${detail.characters.length}）`"
            >
              <div
                v-for="character in detail.characters"
                :key="character.id"
                class="mb-3"
              >
                <div class="font-medium">{{ character.name }}</div>
                <div class="mb-1.5 text-xs text-muted-foreground">
                  {{ character.description }}
                </div>
                <div class="flex flex-wrap gap-2">
                  <AssetImage
                    v-for="appearance in character.appearances"
                    :key="appearance.id"
                    :url="
                      getSelectedImageUrl(
                        appearance.imageUrls,
                        appearance.selectedIndex,
                      )
                    "
                    :status="appearance.status"
                    :error-message="appearance.errorMessage"
                    size="80px"
                  />
                </div>
              </div>
              <Empty v-if="detail.characters.length === 0" description="暂无角色" />
            </TabPane>
            <TabPane
              key="asset"
              :tab="`场景与道具（${detail.locations.length + propList.length}）`"
            >
              <div class="flex flex-wrap gap-3">
                <div
                  v-for="location in detail.locations"
                  :key="`l${location.id}`"
                  class="w-[100px] text-center text-xs"
                >
                  <AssetImage
                    :url="
                      getSelectedImageUrl(
                        location.imageUrls,
                        location.selectedIndex,
                      )
                    "
                    :status="location.status"
                    :error-message="location.errorMessage"
                    size="100px"
                  />
                  <div class="truncate">场景：{{ location.name }}</div>
                </div>
                <div
                  v-for="asset in propList"
                  :key="`v${asset.id}`"
                  class="w-[100px] text-center text-xs"
                >
                  <AssetImage
                    :url="asset.imageUrl"
                    :status="asset.status"
                    :error-message="asset.errorMessage"
                    size="100px"
                  />
                  <div class="truncate">道具：{{ asset.title }}</div>
                </div>
              </div>
              <Empty
                v-if="detail.locations.length === 0 && propList.length === 0"
                description="暂无场景与道具"
              />
            </TabPane>
            <TabPane
              key="storyboard"
              :tab="`镜头（${detail.storyboards.length}）`"
            >
              <Table
                :columns="storyboardColumns"
                :data-source="detail.storyboards"
                :pagination="false"
                :scroll="{ x: 'max-content', y: 400 }"
                row-key="id"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'videoStatus'">
                    <DictTag
                      v-if="record.videoStatus"
                      :type="DICT_TYPE.AI_DRAMA_STATUS"
                      :value="record.videoStatus"
                    />
                    <span v-else>未生成</span>
                  </template>
                  <template v-else-if="column.key === 'videoUrl'">
                    <a
                      v-if="record.videoUrl"
                      :href="record.videoUrl"
                      target="_blank"
                      class="text-primary"
                    >
                      播放
                    </a>
                    <span v-else>-</span>
                  </template>
                  <template v-else-if="column.key === 'errorMessage'">
                    {{
                      record.videoStatus === AiDramaStatusEnum.FAIL
                        ? record.errorMessage || '-'
                        : '-'
                    }}
                  </template>
                </template>
              </Table>
            </TabPane>
          </Tabs>
        </template>
        <Empty v-else-if="!loading" description="项目不存在" />
      </div>
    </Spin>
  </Modal>
</template>
