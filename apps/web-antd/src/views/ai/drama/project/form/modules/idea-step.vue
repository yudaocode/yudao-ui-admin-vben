<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { AiDramaProjectApi } from '#/api/ai/drama/project';
import type { AiModelModelApi } from '#/api/ai/model/model';
import type { AiSkillApi } from '#/api/ai/skill';

import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

import { confirm } from '@vben/common-ui';
import {
  AiDramaStepEnum,
  AiDramaStyleEnum,
  AiModelTypeEnum,
  DICT_TYPE,
} from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  Alert,
  Button,
  Card,
  Collapse,
  CollapsePanel,
  Divider,
  Form,
  FormItem,
  Input,
  message,
  RadioButton,
  RadioGroup,
  Select,
  Tag,
  Textarea,
} from 'ant-design-vue';

import {
  createDramaProject,
  updateDramaProjectMy,
} from '#/api/ai/drama/project';
import { generateDramaScript } from '#/api/ai/drama/script';
import { getModelSimpleList } from '#/api/ai/model/model';
import { getSkillSimpleList } from '#/api/ai/skill';
import { DRAMA_ASPECT_RATIOS } from '#/views/ai/utils/drama';

import { readJsonField, useScriptCreate } from './use-script-create';

/** AI 短剧：故事想法；没有项目时为新建 */
defineOptions({ name: 'AiDramaIdeaStep' });

const props = defineProps<{
  detail?: AiDramaProjectApi.ProjectDetail;
}>();
const emit = defineEmits<{
  created: [id: number];
  next: [step: number];
  refresh: [];
}>();

const formRef = ref(); // 表单 Ref
const project = props.detail?.project;
const formData = ref<{
  aestheticSkillId?: number;
  composeAspectRatio: string;
  description?: string;
  directorSkillId?: number;
  idea?: string;
  name: string;
  storyboardSkillIds: number[];
  style: number;
}>({
  name: project?.name || '',
  description: project?.description,
  idea: project?.idea,
  style: project?.style ?? AiDramaStyleEnum.SCRIPT_TONE,
  aestheticSkillId: project?.aestheticSkillId,
  directorSkillId: project?.directorSkillId,
  storyboardSkillIds: project?.storyboardSkillIds || [],
  composeAspectRatio: project?.composeAspectRatio || '9:16',
});
const formRules: Record<string, Rule[]> = reactive({
  // 新建：生成草稿剧本时名称选填，保存想法时必填（见 save）
  name: [
    { required: !!project, message: '项目名称不能为空', trigger: 'blur' },
  ],
  idea: [{ required: true, message: '故事想法不能为空', trigger: 'blur' }],
});
// 新建：回到新建页时，恢复生成中、生成失败的表单
const {
  job: createJob,
  running: createRunning,
  start: startCreate,
  clear: clearCreate,
  watchJob,
} = useScriptCreate();
// 首创生成中：只影响新建页；已有项目只看自身的生成状态，不因其它首创禁用保存、显示加载
const creating = computed(() => !project && createRunning.value);
const skillList = ref<AiSkillApi.Skill[]>([]); // 启用的技能
const chatModelList = ref<AiModelModelApi.Model[]>([]); // 对话模型：高级设置的标题显示所选模型的名称
const chatModelId = ref<number>();
if (!project && createJob.value) {
  const { modelId, ...form } = createJob.value.form;
  Object.assign(formData.value, form);
  chatModelId.value = modelId;
}
const saving = ref(false);
const generating = ref(false);

/** 高级设置：默认折叠，标题显示当前取值 */
const advancedActive = ref<string[]>([]);
const styleOptions = computed(() =>
  getDictOptions(DICT_TYPE.AI_DRAMA_STYLE, 'number'),
);
const skillOptions = computed(() =>
  skillList.value.map((item) => ({ label: item.name, value: item.id })),
);
const modelOptions = computed(() =>
  chatModelList.value.map((item) => ({ label: item.name, value: item.id })),
);
const advancedSummary = computed(() => {
  const model = chatModelList.value.find(
    (item) => item.id === chatModelId.value,
  );
  const style = styleOptions.value.find(
    (item) => item.value === formData.value.style,
  );
  const skillCount =
    (formData.value.aestheticSkillId ? 1 : 0) +
    (formData.value.directorSkillId ? 1 : 0) +
    (formData.value.storyboardSkillIds?.length || 0);
  return [
    model?.name || '默认对话模型',
    style?.label,
    formData.value.composeAspectRatio,
    skillCount ? `技能：${skillCount} 个` : '技能：不使用',
  ]
    .filter(Boolean)
    .join(' · ');
});

let createdId: number | undefined; // 新建页已创建的项目编号：进入该项目前再次保存时，修改它，不再重复创建

/** 保存：没有项目时新建，返回项目编号 */
async function save(): Promise<number> {
  await formRef.value.validate();
  if (!formData.value.name?.trim()) {
    message.warning('项目名称不能为空');
    throw new Error('项目名称不能为空');
  }
  const id = project?.id ?? createdId;
  if (id) {
    await updateDramaProjectMy({ id, ...formData.value });
    return id;
  }
  createdId = await createDramaProject(formData.value);
  return createdId;
}

/** 保存想法：只保存项目与想法，不调用模型；已有项目不改动剧本 */
async function handleSave() {
  saving.value = true;
  try {
    const id = await save();
    if (project) {
      message.success('保存成功');
      emit('refresh');
    } else {
      message.success('创建成功');
      emit('created', id);
    }
  } catch {
    // 校验失败、请求错误已提示
  } finally {
    saving.value = false;
  }
}

/** 新建：生成状态 */
const now = ref(Date.now());
const createText = computed(() => createJob.value?.text || '');
const createContent = computed(
  () => readJsonField(createText.value, 'content') || '',
);
const createTitle = computed(() => readJsonField(createText.value, 'title'));
const createTone = computed(() => readJsonField(createText.value, 'tone'));
const createOutline = computed(() =>
  readJsonField(createText.value, 'outline'),
);
const createElapsed = computed(() =>
  createJob.value
    ? Math.max(0, Math.floor((now.value - createJob.value.startTime) / 1000))
    : 0,
);
const createIdle = computed(() =>
  createJob.value?.lastTime
    ? Math.max(0, Math.floor((now.value - createJob.value.lastTime) / 1000))
    : 0,
);

/** 秒数显示为「1 分 12 秒」 */
function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes} 分 ${seconds % 60} 秒` : `${seconds} 秒`;
}
let clock: ReturnType<typeof setInterval> | undefined;
if (!project) {
  watchJob();
  onMounted(() => (clock = setInterval(() => (now.value = Date.now()), 1000)));
  onBeforeUnmount(() => clock && clearInterval(clock));
  // 生成成功：进入新项目的剧本审阅；离开新建页时只提示，不跳转（见 use-script-create）
  watch(
    () => createJob.value?.status,
    (status) => {
      const id = createJob.value?.projectId;
      if (status === 'success' && id) {
        clearCreate();
        message.success('初版剧本已生成');
        emit('created', id);
      }
    },
  );
}

/** 新建：流式生成初版剧本，成功后才创建项目；项目名称选填 */
async function handleCreate() {
  await formRef.value.validateFields(['idea']);
  startCreate({
    ...formData.value,
    idea: formData.value.idea!,
    modelId: chatModelId.value,
  });
}

/** 生成剧本：已有项目先保存想法，再同步调用对话模型新增剧本版本，可能需要数十秒 */
async function handleGenerate() {
  if (!project) {
    try {
      await handleCreate();
    } catch {
      // 校验失败已在表单提示
    }
    return;
  }
  if (props.detail?.script?.content) {
    try {
      await confirm('重新生成会新增剧本版本并作为当前剧本，是否继续？');
    } catch {
      return;
    }
  }
  generating.value = true;
  try {
    const id = await save();
    await generateDramaScript(id, chatModelId.value);
    message.success('剧本已生成');
    emit('next', AiDramaStepEnum.SCRIPT);
  } catch {
    // 错误已由请求统一提示
  } finally {
    generating.value = false;
  }
}

/** 初始化 */
onMounted(async () => {
  const [skills, models] = await Promise.all([
    getSkillSimpleList(),
    getModelSimpleList(AiModelTypeEnum.CHAT),
  ]);
  skillList.value = skills;
  chatModelList.value = models;
});
</script>

<template>
  <!-- 新建：首次生成中，主区显示进度与实时正文；成功后进入剧本审阅，失败时回到表单，保留输入 -->
  <Card v-if="creating && createJob">
    <div class="mb-2 flex items-center gap-2">
      <span class="text-base font-medium">正在生成剧本</span>
      <Tag color="processing">生成中</Tag>
    </div>
    <div class="text-muted-foreground mb-2 text-xs">
      已用时 {{ formatSeconds(createElapsed) }} · 已接收
      {{ createContent.length }} 字<template v-if="createJob.lastTime">
        · 最近输出 {{ createIdle }} 秒前
</template>
      · 模型正在撰写正文，完成后创建项目并打开剧本审阅
    </div>
    <Alert
      v-if="createIdle >= 30 || (!createJob.lastTime && createElapsed >= 30)"
      type="info"
      show-icon
      message="仍在等待模型输出"
      class="mb-2"
    />
    <div class="text-sm leading-6">
      <div v-if="createTitle">
        <span class="font-medium">剧名：</span>{{ createTitle }}
      </div>
      <div v-if="createTone">
        <span class="font-medium">叙事基调：</span>{{ createTone }}
      </div>
      <div v-if="createOutline" class="whitespace-pre-wrap break-all">
        <span class="font-medium">剧情大纲：</span>{{ createOutline }}
      </div>
      <Divider v-if="createContent" orientation="left">
        剧本正文 · 实时追加
      </Divider>
      <div class="max-h-[560px] overflow-auto whitespace-pre-wrap break-all">
        {{ createContent || (createTitle ? '' : '正在生成剧名、叙事基调与大纲…') }}
      </div>
    </div>
  </Card>

  <Card v-else>
    <!-- 新建：生成失败；连接中断时结果不确定，不断言项目未创建 -->
    <Alert
      v-if="!project && createJob?.status === 'fail'"
      type="error"
      show-icon
      :message="
        createJob.interrupted ? '连接已中断' : `生成失败：${createJob.error}`
      "
      :description="
        createJob.interrupted
          ? createJob.error
          : '没有创建项目，已保留填写的内容，可修改后重新生成'
      "
      class="mb-4"
    />
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="{ span: 3 }"
      :wrapper-col="{ span: 20 }"
    >
      <FormItem label="项目名称" name="name">
        <Input
          v-model:value="formData.name"
          :maxlength="64"
          show-count
          :placeholder="
            project ? '' : '生成时选填，留空使用生成的剧名；保存想法时必填'
          "
        />
      </FormItem>
      <FormItem label="故事想法" name="idea">
        <Textarea
          v-model:value="formData.idea"
          :rows="10"
          placeholder="一句话或一段话描述故事：人物、冲突、结局"
          :maxlength="5000"
          show-count
        />
      </FormItem>
      <!-- 高级设置：默认折叠，标题显示当前取值 -->
      <Collapse v-model:active-key="advancedActive" class="mb-4">
        <CollapsePanel key="advanced">
          <template #header>
            <span class="font-medium">高级设置</span>
            <span class="text-muted-foreground ml-3 truncate text-xs">
              {{ advancedSummary }}
            </span>
          </template>
          <FormItem label="对话模型">
            <Select
              v-model:value="chatModelId"
              :options="modelOptions"
              placeholder="默认对话模型"
              allow-clear
              class="w-full"
            />
          </FormItem>
          <FormItem label="项目简介" name="description">
            <Input
              v-model:value="formData.description"
              :maxlength="500"
              show-count
            />
          </FormItem>
          <FormItem label="画风" name="style">
            <RadioGroup v-model:value="formData.style" button-style="solid">
              <RadioButton
                v-for="dict in styleOptions"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </RadioButton>
            </RadioGroup>
          </FormItem>
          <FormItem label="画幅" name="composeAspectRatio">
            <RadioGroup
              v-model:value="formData.composeAspectRatio"
              button-style="solid"
            >
              <RadioButton
                v-for="item in DRAMA_ASPECT_RATIOS"
                :key="item"
                :value="item"
              >
                {{ item }}
              </RadioButton>
            </RadioGroup>
          </FormItem>
          <FormItem label="美学技能" name="aestheticSkillId">
            <Select
              v-model:value="formData.aestheticSkillId"
              :options="skillOptions"
              placeholder="不使用"
              allow-clear
              class="w-full"
            />
          </FormItem>
          <FormItem label="导演技能" name="directorSkillId">
            <Select
              v-model:value="formData.directorSkillId"
              :options="skillOptions"
              placeholder="不使用"
              allow-clear
              class="w-full"
            />
          </FormItem>
          <FormItem label="分镜技能" name="storyboardSkillIds">
            <Select
              v-model:value="formData.storyboardSkillIds"
              :options="skillOptions"
              placeholder="不使用；按选择的顺序生效"
              mode="multiple"
              class="w-full"
            />
          </FormItem>
        </CollapsePanel>
      </Collapse>
      <div class="flex items-center justify-end gap-3">
        <span class="text-muted-foreground text-xs">
          {{
            !project
              ? '生成成功后保存项目和剧本'
              : detail?.script?.content
                ? '重新生成会新增剧本版本，先保存这里的修改'
                : '先保存这里的修改，再生成剧本'
          }}
        </span>
        <!-- 保存、生成互斥：新建时两者都会创建项目，避免重复创建 -->
        <Button
          :loading="saving"
          :disabled="generating || creating"
          @click="handleSave"
        >
          保存想法
        </Button>
        <Button
          type="primary"
          :loading="generating || creating"
          :disabled="saving"
          @click="handleGenerate"
        >
          {{
            !project
              ? '生成草稿剧本'
              : detail?.script?.content
                ? '重新生成剧本'
                : '生成剧本'
          }}
        </Button>
      </div>
    </Form>
  </Card>
</template>
