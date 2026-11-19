<script lang="ts" setup>
import type { AiDramaProjectApi } from '#/api/ai/drama/project';
import type { AiDramaScriptApi } from '#/api/ai/drama/script';
import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';
import type { AiModelModelApi } from '#/api/ai/model/model';

import { computed, onMounted, ref, watch } from 'vue';

import {
  AiDramaProjectStatusEnum,
  AiDramaStepEnum,
  AiModelTypeEnum,
  DICT_TYPE,
} from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  CollapsePanel,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  RadioButton,
  RadioGroup,
  Row,
  Select,
  Table,
  Textarea,
  Timeline,
  TimelineItem,
} from 'ant-design-vue';

import {
  analyzeDramaAssetList,
  getDramaScriptList,
  polishDramaScript,
  updateDramaScript,
} from '#/api/ai/drama/script';
import { getDramaStoryboardList } from '#/api/ai/drama/storyboard';
import { getModelSimpleList } from '#/api/ai/model/model';
import { DictTag } from '#/components/dict-tag';

/** AI 短剧：剧本审阅 */
defineOptions({ name: 'AiDramaScriptStep' });

const props = defineProps<{
  detail: AiDramaProjectApi.ProjectDetail;
}>();
const emit = defineEmits<{
  next: [step: number];
  refresh: [];
}>();

const formData = ref({
  title: '',
  tone: '',
  outline: '',
  worldbuilding: '',
  sourceMaterial: '',
  content: '',
});
const versions = ref<AiDramaScriptApi.Script[]>([]); // 剧本版本，新的在前
const versionVisible = ref(false);
const version = ref<AiDramaScriptApi.Script>(); // 只读查看的剧本版本
const historyVisible = ref(false); // 版本历史
const chatModelList = ref<AiModelModelApi.Model[]>([]); // 对话模型
const chatModelId = ref<number>();
const note = ref('');
const polishVisible = ref(false); // 是否展开打磨的修改意见
const moreActive = ref<string[]>([]); // 更多剧本信息：默认折叠
const contentMode = ref<'edit' | 'read'>(
  props.detail.script?.content ? 'read' : 'edit',
); // 正文：有正文时默认阅读
const saving = ref(false);
const polishing = ref(false);
const analyzing = ref(false);
const busy = computed(
  () => saving.value || polishing.value || analyzing.value,
); // 保存、打磨、分析互斥
const modelOptions = computed(() =>
  chatModelList.value.map((item) => ({ label: item.name, value: item.id })),
);

/** 剧本内容变化（保存、打磨）时，同步到表单；生成中的轮询返回的剧本未变，不覆盖正在编辑的内容 */
watch(
  [
    () => props.detail.script?.title,
    () => props.detail.script?.tone,
    () => props.detail.script?.outline,
    () => props.detail.script?.worldbuilding,
    () => props.detail.script?.sourceMaterial,
    () => props.detail.script?.content,
  ],
  ([title, tone, outline, worldbuilding, sourceMaterial, content]) => {
    formData.value = {
      title: title || '',
      tone: tone || '',
      outline: outline || '',
      worldbuilding: worldbuilding || '',
      sourceMaterial: sourceMaterial || '',
      content: content || '',
    };
  },
  { immediate: true },
);

/** 剧本版本变化（生成、打磨）时，重新加载版本列表 */
watch(
  () => props.detail.script?.id,
  async (id) => {
    versions.value = id ? await getDramaScriptList(props.detail.project.id) : [];
  },
  { immediate: true },
);

const versionStoryboards = ref<AiDramaStoryboardApi.Storyboard[]>([]); // 只读查看的剧本版本的镜头
const versionStoryboardLoading = ref(false);
const storyboardColumns = [
  { title: '镜头', dataIndex: 'sceneNo', width: 60, align: 'center' as const },
  { title: '标题', dataIndex: 'title', width: 140, ellipsis: true },
  { title: '时长', dataIndex: 'duration', width: 70, align: 'center' as const },
  { title: '画面描述', dataIndex: 'sceneText', ellipsis: true },
  { title: '视频', key: 'video', width: 100, align: 'center' as const },
];

/** 打开剧本版本：只读查看正文与该版本的镜头 */
async function openVersion(item: AiDramaScriptApi.Script) {
  version.value = item;
  versionVisible.value = true;
  // 加载该版本的镜头：连续切换版本时，只保留最后打开的版本的结果
  versionStoryboards.value = [];
  versionStoryboardLoading.value = true;
  try {
    const list = await getDramaStoryboardList(item.id);
    if (version.value?.id === item.id) {
      versionStoryboards.value = list;
    }
  } finally {
    if (version.value?.id === item.id) {
      versionStoryboardLoading.value = false;
    }
  }
}

/** 保存当前剧本：没有剧本时新增 */
async function save() {
  await updateDramaScript({
    id: props.detail.script?.id,
    projectId: props.detail.project.id,
    ...formData.value,
  });
}

/** 保存剧本 */
async function handleSave() {
  saving.value = true;
  try {
    await save();
    message.success('保存成功');
    emit('refresh');
  } finally {
    saving.value = false;
  }
}

/** 打磨：先保存当前修改，再按意见重写为新版本；完成后收起修改意见，留在本页阅读新版本 */
async function handlePolish() {
  polishing.value = true;
  try {
    await save();
    await polishDramaScript(
      props.detail.project.id,
      note.value.trim(),
      chatModelId.value,
    );
    note.value = '';
    polishVisible.value = false;
    contentMode.value = 'read';
    message.success('已生成新版本');
    emit('refresh');
  } finally {
    polishing.value = false;
  }
}

/** 分析资产：先保存当前修改，再从剧本提取角色、场景、道具，完成后进入资产配置 */
async function handleAnalyze() {
  analyzing.value = true;
  try {
    await save();
    await analyzeDramaAssetList(props.detail.project.id, chatModelId.value);
    message.success('资产分析完成');
    emit('next', AiDramaStepEnum.ASSET);
  } finally {
    analyzing.value = false;
  }
}

/** 初始化 */
onMounted(async () => {
  chatModelList.value = await getModelSimpleList(AiModelTypeEnum.CHAT);
});
</script>

<template>
  <Card>
    <Alert
      v-if="detail.project.status === AiDramaProjectStatusEnum.SCRIPT_CHANGED"
      type="warning"
      show-icon
      message="剧本已修改：请重新分析资产、拆分分镜后，再生成关键帧和镜头视频；原有资产保留"
      class="mb-4"
    />
    <!-- 工具栏：当前版本，右侧版本历史 -->
    <div class="mb-4 flex items-center justify-between gap-3">
      <span class="text-muted-foreground truncate text-sm">
        <template v-if="detail.script">
          当前版本 · {{ formatDateTime(detail.script.createTime) }}
          <template v-if="detail.script.revisionNote">
            · 打磨：{{ detail.script.revisionNote }}
          </template>
        </template>
        <template v-else>尚无剧本：可直接编写正文后保存，或回到上一步生成</template>
      </span>
      <Button
        type="link"
        :disabled="versions.length === 0"
        @click="historyVisible = true"
      >
        版本历史（{{ versions.length }}）
      </Button>
    </div>
    <Form :model="formData" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="剧名" :label-col="{ span: 6 }">
            <Input v-model:value="formData.title" :maxlength="128" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="叙事基调" :label-col="{ span: 6 }">
            <Input v-model:value="formData.tone" :maxlength="255" />
          </FormItem>
        </Col>
      </Row>
      <FormItem label="剧情大纲">
        <Textarea
          v-model:value="formData.outline"
          :rows="3"
          :maxlength="5000"
          show-count
        />
      </FormItem>
      <FormItem label="剧本正文">
        <div class="w-full">
          <div class="mb-2 flex justify-end">
            <RadioGroup v-model:value="contentMode" size="small">
              <RadioButton value="read">阅读</RadioButton>
              <RadioButton value="edit">编辑</RadioButton>
            </RadioGroup>
          </div>
          <div
            v-if="contentMode === 'read'"
            class="border-border max-h-[560px] min-h-[120px] overflow-auto whitespace-pre-wrap break-all rounded border border-solid px-3 py-2 text-sm leading-6"
          >
            {{ formData.content || '暂无正文，切换到「编辑」直接编写' }}
          </div>
          <Textarea
            v-else
            v-model:value="formData.content"
            :rows="18"
            placeholder="可直接编写，或在上一步生成"
          />
        </div>
      </FormItem>
      <!-- 打磨剧本：在正文下方原位展开修改意见，重写后新增版本，留在本页查看 -->
      <template v-if="polishVisible">
        <FormItem label="修改意见">
          <Textarea
            v-model:value="note"
            :rows="3"
            placeholder="例如：结尾加一个反转；台词更口语化"
            :maxlength="1000"
            show-count
          />
        </FormItem>
        <FormItem label="对话模型">
          <Select
            v-model:value="chatModelId"
            :options="modelOptions"
            placeholder="默认对话模型"
            allow-clear
            class="w-full"
          />
        </FormItem>
      </template>
      <!-- 更多剧本信息：默认折叠 -->
      <Collapse v-model:active-key="moreActive" class="mb-4">
        <CollapsePanel key="more">
          <template #header>
            <span class="font-medium">更多剧本信息</span>
            <span class="text-muted-foreground ml-3 text-xs">
              世界观 · 原始素材
            </span>
          </template>
          <FormItem label="世界观">
            <Textarea
              v-model:value="formData.worldbuilding"
              :rows="3"
              placeholder="时代、地点、规则等设定，生成、打磨剧本时沿用"
            />
          </FormItem>
          <FormItem label="原始素材">
            <Textarea
              v-model:value="formData.sourceMaterial"
              :rows="3"
              placeholder="改编的小说片段、新闻等原始素材，可不填"
            />
          </FormItem>
        </CollapsePanel>
      </Collapse>
      <!-- 底部操作：左侧上一步，右侧打磨、保存、保存并分析 -->
      <div class="flex items-center justify-between gap-3">
        <Button :disabled="busy" @click="emit('next', AiDramaStepEnum.IDEA)">
          上一步
        </Button>
        <div class="flex items-center gap-2">
          <Button
            type="primary"
            ghost
            :disabled="busy || !detail.script?.content"
            @click="polishVisible = !polishVisible"
          >
            {{ polishVisible ? '收起打磨' : '打磨剧本' }}
          </Button>
          <Button
            v-if="polishVisible"
            type="primary"
            ghost
            :loading="polishing"
            :disabled="(busy && !polishing) || !note.trim()"
            @click="handlePolish"
          >
            按意见重写
          </Button>
          <Button
            :loading="saving"
            :disabled="busy && !saving"
            @click="handleSave"
          >
            保存剧本
          </Button>
          <Button
            type="primary"
            :loading="analyzing"
            :disabled="(busy && !analyzing) || !formData.content.trim()"
            @click="handleAnalyze"
          >
            保存并分析资产
          </Button>
        </div>
      </div>
    </Form>
  </Card>

  <!-- 版本历史：生成、打磨都会新增版本，新的在前；点击只读查看 -->
  <Drawer v-model:open="historyVisible" title="版本历史" :width="360">
    <Timeline>
      <TimelineItem
        v-for="item in versions"
        :key="item.id"
        :color="item.id === detail.script?.id ? 'blue' : 'gray'"
      >
        <div class="text-muted-foreground mb-1 text-xs">
          {{ formatDateTime(item.createTime) }}
        </div>
        <a class="break-all" @click="openVersion(item)">
          {{ item.id === detail.script?.id ? '当前版本' : item.title || '剧本版本' }}
        </a>
        <div
          v-if="item.revisionNote"
          class="text-muted-foreground mt-1 break-all text-xs"
        >
          打磨：{{ item.revisionNote }}
        </div>
      </TimelineItem>
    </Timeline>
  </Drawer>

  <!-- 剧本版本：只读查看 -->
  <Modal
    v-model:open="versionVisible"
    :title="`剧本版本 · ${formatDateTime(version?.createTime)}${version?.id === detail.script?.id ? '（当前）' : ''}`"
    :width="760"
    :footer="null"
  >
    <Descriptions v-if="version" :column="2" bordered size="small">
      <DescriptionsItem label="剧名">{{ version.title }}</DescriptionsItem>
      <DescriptionsItem label="叙事基调">{{ version.tone }}</DescriptionsItem>
      <DescriptionsItem label="修订要求" :span="2">
        {{ version.revisionNote }}
      </DescriptionsItem>
      <DescriptionsItem label="剧情大纲" :span="2">
        <div class="whitespace-pre-wrap">{{ version.outline }}</div>
      </DescriptionsItem>
      <DescriptionsItem label="世界观" :span="2">
        <div class="whitespace-pre-wrap">{{ version.worldbuilding }}</div>
      </DescriptionsItem>
      <DescriptionsItem label="剧本正文" :span="2">
        <div class="max-h-[400px] overflow-auto whitespace-pre-wrap">
          {{ version.content }}
        </div>
      </DescriptionsItem>
    </Descriptions>
    <!-- 该版本的镜头：只读；角色、场景、道具等资产为项目级，不随版本保存 -->
    <div class="mb-2 mt-4 font-medium">
      镜头（{{ versionStoryboards.length }}）
    </div>
    <Table
      :columns="storyboardColumns"
      :data-source="versionStoryboards"
      :loading="versionStoryboardLoading"
      :pagination="false"
      :scroll="{ y: 320 }"
      row-key="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'video'">
          <a v-if="record.videoUrl" :href="record.videoUrl" target="_blank">
            播放
          </a>
          <DictTag
            v-else-if="record.videoStatus"
            :type="DICT_TYPE.AI_DRAMA_STATUS"
            :value="record.videoStatus"
          />
          <span v-else>未生成</span>
        </template>
      </template>
    </Table>
  </Modal>
</template>
