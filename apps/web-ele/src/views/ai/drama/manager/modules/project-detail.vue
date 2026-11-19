<script lang="ts" setup>
import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { AiDramaStatusEnum, DICT_TYPE } from '@vben/constants';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
} from 'element-plus';

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
    <div v-loading="loading" class="min-h-[200px]">
        <template v-if="detail">
          <ElDescriptions :column="3" border size="small">
            <ElDescriptionsItem label="编号">
              {{ detail.project.id }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="项目名称">
              {{ detail.project.name }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="用户">
              {{ detail.project.userNickname || detail.project.userId }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="画风">
              <DictTag
                :type="DICT_TYPE.AI_DRAMA_STYLE"
                :value="detail.project.style"
              />
            </ElDescriptionsItem>
            <ElDescriptionsItem label="画幅">
              {{ detail.project.composeAspectRatio }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="项目状态">
              <DictTag
                :type="DICT_TYPE.AI_DRAMA_PROJECT_STATUS"
                :value="detail.project.status"
              />
            </ElDescriptionsItem>
            <ElDescriptionsItem label="故事想法" :span="3">
              <span class="whitespace-pre-wrap break-all">
                {{ detail.project.idea || '-' }}
              </span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="成片状态">
              <DictTag
                v-if="detail.project.composeStatus"
                :type="DICT_TYPE.AI_DRAMA_STATUS"
                :value="detail.project.composeStatus"
              />
              <span v-else>未合成</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="成片时长">
              {{ formatDramaDuration(detail.project.composeDuration) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="成片画幅 / 镜头">
              {{ detail.project.composeAspectRatio || '-' }} /
              {{
                detail.project.composeStoryboardCount
                  ? `${detail.project.composeStoryboardCount} 个`
                  : '-'
              }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="是否公开">
              {{ detail.project.publicStatus ? '是' : '否' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem
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
            </ElDescriptionsItem>
          </ElDescriptions>
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

          <ElTabs class="mt-3">
            <ElTabPane label="剧本" name="script">
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
              <ElEmpty v-else description="暂无剧本" />
            </ElTabPane>
            <ElTabPane
              :label="`角色（${detail.characters.length}）`"
              name="character"
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
              <ElEmpty v-if="detail.characters.length === 0" description="暂无角色" />
            </ElTabPane>
            <ElTabPane
              :label="`场景与道具（${detail.locations.length + propList.length}）`"
              name="asset"
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
              <ElEmpty
                v-if="detail.locations.length === 0 && propList.length === 0"
                description="暂无场景与道具"
              />
            </ElTabPane>
            <ElTabPane
              :label="`镜头（${detail.storyboards.length}）`"
              name="storyboard"
            >
              <ElTable
                :data="detail.storyboards"
                row-key="id"
                size="small"
                max-height="400"
              >
                <ElTableColumn
                  label="镜头"
                  prop="sceneNo"
                  width="60"
                  align="center"
                />
                <ElTableColumn
                  label="标题"
                  prop="title"
                  width="140"
                  show-overflow-tooltip
                />
                <ElTableColumn
                  label="时长"
                  prop="duration"
                  width="70"
                  align="center"
                />
                <ElTableColumn
                  label="画面描述"
                  prop="sceneText"
                  width="220"
                  show-overflow-tooltip
                />
                <ElTableColumn label="状态" width="100" align="center">
                  <template #default="{ row }">
                    <DictTag
                      v-if="row.videoStatus"
                      :type="DICT_TYPE.AI_DRAMA_STATUS"
                      :value="row.videoStatus"
                    />
                    <span v-else>未生成</span>
                  </template>
                </ElTableColumn>
                <ElTableColumn
                  label="服务商任务"
                  prop="taskId"
                  width="160"
                  show-overflow-tooltip
                />
                <ElTableColumn label="视频" width="80" align="center">
                  <template #default="{ row }">
                    <a
                      v-if="row.videoUrl"
                      :href="row.videoUrl"
                      target="_blank"
                      class="text-[var(--el-color-primary)]"
                    >
                      播放
                    </a>
                    <span v-else>-</span>
                  </template>
                </ElTableColumn>
                <ElTableColumn
                  label="失败原因"
                  min-width="200"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    {{
                      row.videoStatus === AiDramaStatusEnum.FAIL
                        ? row.errorMessage || '-'
                        : '-'
                    }}
                  </template>
                </ElTableColumn>
              </ElTable>
            </ElTabPane>
          </ElTabs>
        </template>
        <ElEmpty v-else-if="!loading" description="项目不存在" />
    </div>
  </Modal>
</template>
