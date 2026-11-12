<script lang="ts" setup>
import type { FormInstance, FormRules, UploadFile } from 'element-plus';

import type { AiModelModelApi } from '#/api/ai/model/model';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  AiModelTypeEnum,
  AiPptFileTypes,
  AiPptImagePlatforms,
  AiPptLanguageEnum,
  AiPptModeEnum,
  AiPptSourceEnum,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { formatFileSize, getFileIcon } from '@vben/utils';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElTabPane,
  ElTabs,
  ElUpload,
} from 'element-plus';

import { getModelSimpleList } from '#/api/ai/model/model';
import { generatePpt } from '#/api/ai/ppt';
import { useUpload } from '#/components/upload/use-upload';

/** AI PPT：左侧创建表单 */
defineOptions({ name: 'AiPptCreatePanel' });

const emit = defineEmits<{
  submitted: []; // 提交成功，用于刷新列表
}>();

/** 格式选项 */
const MODE_OPTIONS = [
  {
    label: '详细演示文稿',
    value: AiPptModeEnum.DETAILED,
    description: '一整套包含全文和详情的演示文稿，适合邮件发送或单独阅读。',
  },
  {
    label: '演示用幻灯片',
    value: AiPptModeEnum.SLIDES,
    description: '简洁直观的幻灯片，附带要点，为演讲提供支持。',
  },
];
/** 语言选项 */
const LANGUAGE_OPTIONS = [
  { label: '中文', value: AiPptLanguageEnum.ZH_CN },
  { label: 'English', value: AiPptLanguageEnum.EN },
];
const DURATION_PAGE_COUNTS = { short: 6, default: 10 }; // 时长对应的页数
const CONTENT_MAX_LENGTH = 25_000; // 大纲最大长度，与后端一致
const FILE_ACCEPT = AiPptFileTypes.map((type) => `.${type}`).join(','); // 上传可选的文件类型
const FILE_MAX_SIZE_MB = 10; // 材料最大大小

type Duration = keyof typeof DURATION_PAGE_COUNTS;

const formRef = ref<FormInstance>(); // 表单 Ref
const formData = reactive({
  mode: AiPptModeEnum.DETAILED,
  language: AiPptLanguageEnum.ZH_CN,
  pageCount: DURATION_PAGE_COUNTS.default,
  imageModelId: undefined as number | undefined,
  source: AiPptSourceEnum.PASTE,
  content: '',
  fileUrl: '',
  prompt: '',
});
const duration = ref<Duration | undefined>('default'); // 时长；页数不是 6 / 10 时为空

/** 表单规则：只校验当前来源的素材 */
const formRules = computed<FormRules>(() => ({
  imageModelId: [
    { required: true, message: '请选择绘图模型', trigger: 'change' },
  ],
  content:
    formData.source === AiPptSourceEnum.PASTE
      ? [
          {
            required: true,
            whitespace: true,
            message: '请输入大纲内容',
            trigger: 'blur',
          },
        ]
      : [],
  fileUrl:
    formData.source === AiPptSourceEnum.UPLOAD
      ? [{ required: true, message: '请上传材料文件', trigger: 'change' }]
      : [],
}));

/** 时长：只是把页数设为 6 / 10，不提交后端 */
function handleDurationChange() {
  if (duration.value) {
    formData.pageCount = DURATION_PAGE_COUNTS[duration.value];
  }
}

/** 页数变化：与时长对应时，同步选中时长 */
function handlePageCountChange(value?: number) {
  duration.value = (Object.keys(DURATION_PAGE_COUNTS) as Duration[]).find(
    (key) => DURATION_PAGE_COUNTS[key] === value,
  );
}

// ========== 绘图模型 ==========

const imageModels = ref<AiModelModelApi.Model[]>([]); // 可用的绘图模型：只列出支持整页文生图的平台
const imageModelsLoaded = ref(false); // 是否已加载：加载完仍为空时提示去配置

/** 加载绘图模型：默认选中第一个 */
async function loadImageModels() {
  const list = await getModelSimpleList(AiModelTypeEnum.IMAGE);
  imageModels.value = list.filter((item) =>
    AiPptImagePlatforms.includes(item.platform),
  );
  imageModelsLoaded.value = true;
  if (!formData.imageModelId && imageModels.value.length > 0) {
    formData.imageModelId = imageModels.value[0]!.id;
  }
}

// ========== 上传材料 ==========

const { httpRequest } = useUpload('ai/ppt');
const uploadFile = ref<{ raw: File; uploading: boolean }>(); // 已选的材料

/** 选择材料：校验后立即上传到文件服务，成功后记录 fileUrl */
async function handleFileChange(file: UploadFile) {
  const raw = file.raw;
  if (!raw) {
    return;
  }
  const extension = raw.name.split('.').pop()?.toLowerCase() || '';
  if (!AiPptFileTypes.includes(extension)) {
    ElMessage.error(`仅支持 ${AiPptFileTypes.join(' / ')} 格式的文件`);
    return;
  }
  if (raw.size > FILE_MAX_SIZE_MB * 1024 * 1024) {
    ElMessage.error(`材料文件不能超过 ${FILE_MAX_SIZE_MB} MB`);
    return;
  }
  uploadFile.value = { raw, uploading: true };
  formData.fileUrl = '';
  try {
    // 前端直传时返回 { url }，后端上传时直接返回地址
    const res: any = await httpRequest(raw);
    if (uploadFile.value?.raw !== raw) {
      return; // 上传期间已移除
    }
    uploadFile.value.uploading = false;
    formData.fileUrl = res?.url || res?.data || res;
    formRef.value?.clearValidate('fileUrl');
  } catch {
    if (uploadFile.value?.raw === raw) {
      uploadFile.value = undefined;
      ElMessage.error('材料上传失败，请重新上传');
    }
  }
}

/** 移除材料 */
function handleFileRemove() {
  uploadFile.value = undefined;
  formData.fileUrl = '';
}

// ========== 提交 ==========

const submitting = ref(false); // 提交中

/** 提交生成：上传材料时，文件已先上传到文件服务，只提交地址 */
async function handleSubmit() {
  if (
    formData.source === AiPptSourceEnum.UPLOAD &&
    uploadFile.value?.uploading
  ) {
    ElMessage.warning('材料上传中，请稍候');
    return;
  }
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  submitting.value = true;
  try {
    await generatePpt(formData);
    ElMessage.success('任务已提交，正在生成分镜');
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  loadImageModels();
});
</script>

<template>
  <div class="size-full overflow-y-auto rounded-lg bg-card p-4">
    <div class="mb-4">
      <div class="text-base font-bold">创建 PPT</div>
      <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
        粘贴你的大纲，或上传材料一键生成分镜和配图
      </div>
    </div>
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
    >
      <!-- 格式 -->
      <ElFormItem label="格式" prop="mode">
        <div class="grid w-full grid-cols-2 gap-2">
          <div
            v-for="item in MODE_OPTIONS"
            :key="item.value"
            class="flex cursor-pointer flex-col gap-1 rounded-md border border-solid p-2.5 leading-[18px]"
            :class="
              formData.mode === item.value
                ? 'border-[var(--el-color-primary)] bg-[var(--el-color-primary-light-9)]'
                : 'border-[var(--el-border-color)] hover:border-[var(--el-border-color-darker)]'
            "
            @click="formData.mode = item.value"
          >
            <span class="font-bold">{{ item.label }}</span>
            <span class="text-xs text-[var(--el-text-color-secondary)]">
              {{ item.description }}
            </span>
          </div>
        </div>
      </ElFormItem>
      <!-- 语言 -->
      <ElFormItem label="选择语言" prop="language">
        <ElSelect v-model="formData.language" class="!w-full">
          <ElOption
            v-for="item in LANGUAGE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
      <!-- 时长、页数：时长只是页数的快捷设置 -->
      <div class="flex gap-4">
        <ElFormItem label="时长">
          <ElRadioGroup v-model="duration" @change="handleDurationChange">
            <ElRadioButton value="short">短</ElRadioButton>
            <ElRadioButton value="default">默认</ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="PPT 页数" prop="pageCount" class="flex-1">
          <ElInputNumber
            v-model="formData.pageCount"
            :min="3"
            :max="30"
            :precision="0"
            controls-position="right"
            class="!w-full"
            @change="handlePageCountChange"
          />
        </ElFormItem>
      </div>
      <!-- 绘图模型：只列出支持整页文生图的平台 -->
      <ElFormItem label="绘图模型" prop="imageModelId">
        <ElSelect
          v-model="formData.imageModelId"
          placeholder="请选择绘图模型"
          filterable
          class="!w-full"
        >
          <ElOption
            v-for="item in imageModels"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
            <span>{{ item.name }}</span>
            <span
              class="float-right text-xs text-[var(--el-text-color-secondary)]"
            >
              {{ item.platform }}
            </span>
          </ElOption>
        </ElSelect>
        <div
          v-if="imageModelsLoaded && imageModels.length === 0"
          class="text-xs text-[var(--el-color-warning)]"
        >
          没有可用的绘图模型，请先在「模型配置」启用 OpenAI、硅基流动或通义千问平台的绘图模型
        </div>
      </ElFormItem>
      <!-- 素材：粘贴大纲、上传材料二选一；表单项按来源 v-if，只校验当前的素材 -->
      <ElTabs v-model="formData.source">
        <ElTabPane label="粘贴大纲" :name="AiPptSourceEnum.PASTE" />
        <ElTabPane label="上传材料" :name="AiPptSourceEnum.UPLOAD" />
      </ElTabs>
      <ElFormItem
        v-if="formData.source === AiPptSourceEnum.PASTE"
        label="把你的大纲或者内容粘贴在这里"
        prop="content"
      >
        <ElInput
          v-model="formData.content"
          type="textarea"
          :rows="8"
          :maxlength="CONTENT_MAX_LENGTH"
          show-word-limit
          placeholder="添加一份概略提纲，或指定受众、风格和重点，例如：为新手用户创建一套演示文稿，采用大胆活泼的风格，注重分步说明。"
        />
      </ElFormItem>
      <ElFormItem
        v-else
        label="上传 PPT 材料（支持 PDF/Word/TXT/Markdown 格式）"
        prop="fileUrl"
      >
        <ElUpload
          v-if="!uploadFile"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :accept="FILE_ACCEPT"
          :on-change="handleFileChange"
          class="w-full [&_.el-upload]:w-full"
        >
          <IconifyIcon
            icon="ep:upload-filled"
            class="size-8 text-[var(--el-text-color-placeholder)]"
          />
          <div class="text-sm">
            拖拽或<em class="text-[var(--el-color-primary)]">点击上传</em>
          </div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">
            {{ AiPptFileTypes.join(' / ') }}，≤ {{ FILE_MAX_SIZE_MB }} MB
          </div>
        </ElUpload>
        <div
          v-else
          class="flex w-full items-center gap-2 rounded-md bg-[var(--el-fill-color-light)] px-2.5 py-1.5"
        >
          <IconifyIcon
            :icon="getFileIcon(uploadFile.raw.name)"
            class="flex-shrink-0 text-[var(--el-color-primary)]"
          />
          <span class="min-w-0 flex-1 truncate" :title="uploadFile.raw.name">
            {{ uploadFile.raw.name }}
          </span>
          <span class="text-xs text-[var(--el-text-color-secondary)]">
            {{
              uploadFile.uploading
                ? '上传中...'
                : formatFileSize(uploadFile.raw.size)
            }}
          </span>
          <ElButton link type="danger" @click="handleFileRemove">
            移除
          </ElButton>
        </div>
      </ElFormItem>
      <!-- 风格与设计要求 -->
      <ElFormItem label="风格与设计要求（可选）" prop="prompt">
        <ElInput
          v-model="formData.prompt"
          type="textarea"
          :rows="3"
          :maxlength="1024"
          show-word-limit
          placeholder="例如：极简商务风、卡通手绘风"
        />
      </ElFormItem>
      <ElButton
        type="primary"
        class="!w-full"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '任务创建中...' : '生成' }}
      </ElButton>
    </ElForm>
    <div
      class="mt-4 text-xs leading-5 text-[var(--el-text-color-secondary)]"
    >
      <div>小提示：</div>
      <ul class="m-0 list-disc pl-[18px]">
        <li>建议使用分层级的大纲（如 Markdown 标题）让分镜更加清晰</li>
        <li>页数会在生成分镜时作为约束，保证故事线完整</li>
        <li>
          每页是一张整页图，标题和要点由绘图模型画在图里；导出的 PPTX、PDF
          每页也是一张图
        </li>
      </ul>
    </div>
  </div>
</template>
