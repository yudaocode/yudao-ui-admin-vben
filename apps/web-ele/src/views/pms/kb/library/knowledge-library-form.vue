<script lang="ts" setup>
import type { PmsKnowledgeLibraryApi } from '#/api/pms/kb/library';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import { ElButton, ElImage, ElMessage, ElScrollbar } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createKnowledgeLibrary,
  getKnowledgeLibrary,
  getKnowledgeLibraryTemplateList,
  updateKnowledgeLibrary,
} from '#/api/pms/kb/library';

import { useLibraryFormSchema } from './data';
import KnowledgeMemberForm from './knowledge-member-form.vue';

defineOptions({ name: 'PmsKnowledgeLibraryForm' });

// TODO @AI：模板选择步可以自定义；名称/封面/可见范围/初始成员对齐 system user，用 useVbenForm + schema。v-loading 换成 modalApi.lock。「定义 success 事件」这类注释删掉。
// TODO DONE @AI：基础信息表单已改为 useVbenForm + useLibraryFormSchema（见 data.ts），模板选择步保留为自定义区块；详情加载和提交改用 modalApi.lock，模板列表加载保留自定义区块内的 v-loading；低价值注释已删除。
const emit = defineEmits(['success']);

const formType = ref<'create' | 'update'>('create'); // 表单类型：create - 新增；update - 修改
const templateSelecting = ref(false); // 是否正在选择知识库模板
const templateLoading = ref(false); // 模板加载中
const templateList = ref<PmsKnowledgeLibraryApi.KnowledgeLibraryTemplate[]>([]); // 知识库模板列表
const selectedTemplateId = ref(0); // 0 表示空白知识库
const formData =
  ref<PmsKnowledgeLibraryApi.KnowledgeLibrary>(getDefaultFormData()); // 表单数据
const currentUserId = useUserStore().userInfo?.id; // 创建人用户编号，不能重复加入初始成员
const dialogTitle = ref(''); // 弹窗标题
const selectedTemplate = computed(() =>
  templateList.value.find(
    (template) => template.id === selectedTemplateId.value,
  ),
); // 当前选中的知识库模板

const [KnowledgeMemberFormModal, knowledgeMemberFormModalApi] = useVbenModal({
  connectedComponent: KnowledgeMemberForm,
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useLibraryFormSchema(currentUserId),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

/** 查询知识库模板 */
async function getTemplateList() {
  templateLoading.value = true;
  try {
    templateList.value = await getKnowledgeLibraryTemplateList();
  } finally {
    templateLoading.value = false;
  }
}

/** 进入知识库基本信息表单 */
async function handleTemplateNext() {
  templateSelecting.value = false;
  dialogTitle.value = '新建知识库';
  await formApi.setValues(
    selectedTemplate.value
      ? {
          ...getDefaultFormData(),
          name: selectedTemplate.value.name,
          description: selectedTemplate.value.description,
          coverUrl: selectedTemplate.value.coverUrl,
          templateId: selectedTemplateId.value,
        }
      : getDefaultFormData(),
  );
}

/** 返回知识库模板选择 */
function handleTemplateBack() {
  templateSelecting.value = true;
  dialogTitle.value = '选择知识库模板';
}

/** 校验初始管理员和普通成员不能重复 */
function validateInitialMembers(
  adminUserIds: number[] = [],
  memberUserIds: number[] = [],
) {
  const memberUserIdSet = new Set(memberUserIds);
  return !adminUserIds.some((userId) => memberUserIdSet.has(userId));
}

/** 打开知识库成员表单 */
function openMemberForm() {
  if (!formData.value.id) {
    return;
  }
  knowledgeMemberFormModalApi.setData({ id: formData.value.id }).open();
}

/** 处理知识库成员更新成功 */
function handleMemberSuccess() {
  emit('success');
}

/** 获得默认表单数据 */
function getDefaultFormData(): PmsKnowledgeLibraryApi.KnowledgeLibrary {
  return {
    id: undefined as unknown as number,
    name: '',
    description: '',
    openStatus: false,
    coverUrl: undefined,
    adminUserIds: [],
    memberUserIds: [],
    templateId: undefined,
  };
}

const [Modal, modalApi] = useVbenModal({
  class: 'w-[680px]',
  footer: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as {
      formType: 'create' | 'update';
      id?: number;
    };
    formType.value = data.formType;
    templateSelecting.value = data.formType === 'create';
    dialogTitle.value =
      data.formType === 'create' && templateSelecting.value
        ? '选择知识库模板'
        : '修改';
    selectedTemplateId.value = 0;
    // 重置表单数据；新增时表单在模板选择后才挂载，由 handleTemplateNext 设置默认值
    formData.value = getDefaultFormData();
    if (data.formType === 'create') {
      await getTemplateList();
    } else if (data.id) {
      modalApi.lock();
      try {
        formData.value = {
          ...(await getKnowledgeLibrary(data.id)),
          adminUserIds: [],
          memberUserIds: [],
          templateId: undefined,
        };
        await formApi.reset();
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
    }
  },
});

/** 提交表单 */
async function submitForm() {
  // 校验表单
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  const values = await formApi.getValues();
  if (
    formType.value === 'create' &&
    !validateInitialMembers(values.adminUserIds, values.memberUserIds)
  ) {
    ElMessage.warning('同一用户不能同时设置为初始管理员和普通成员');
    return;
  }
  // 提交请求
  modalApi.lock();
  try {
    const data = {
      ...formData.value,
      ...values,
    };
    if (formType.value === 'create') {
      await createKnowledgeLibrary(data);
      ElMessage.success('创建成功');
    } else {
      await updateKnowledgeLibrary(data);
      ElMessage.success('更新成功');
    }
    await modalApi.close();
    // 发送操作成功的事件
    emit('success');
  } finally {
    modalApi.unlock();
  }
}
</script>

<template>
  <Modal :title="dialogTitle">
    <!-- 知识库模板选择 -->
    <div
      v-if="formType === 'create' && templateSelecting"
      v-loading="templateLoading"
      class="grid min-h-[420px] grid-cols-2 gap-4"
    >
      <div class="max-h-[440px] overflow-y-auto pr-2">
        <button
          class="mb-1.5 flex w-full cursor-pointer items-center gap-3 rounded-[var(--el-border-radius-base)] border border-solid border-transparent bg-transparent p-2.5 text-inherit transition-colors hover:!border-[var(--el-color-primary-light-5)] hover:!bg-[var(--el-fill-color-light)]"
          :class="[
            selectedTemplateId === 0
              ? '!border-[var(--el-color-primary)] !bg-[var(--el-color-primary-light-9)]'
              : '',
          ]"
          type="button"
          @click="selectedTemplateId = 0"
        >
          <div
            class="flex h-12 w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-[var(--el-border-radius-base)] border border-dashed border-[var(--el-border-color)] text-[22px] text-[var(--el-color-primary)]"
          >
            <IconifyIcon icon="ep:plus" />
          </div>
          <div class="min-w-0 text-left">
            <div class="truncate text-[15px] font-semibold">空白知识库</div>
            <div
              class="mt-1 truncate text-xs text-[var(--el-text-color-secondary)]"
            >
              邀请团队成员一起创作和交流知识
            </div>
          </div>
        </button>
        <button
          v-for="template in templateList"
          :key="template.id"
          class="mb-1.5 flex w-full cursor-pointer items-center gap-3 rounded-[var(--el-border-radius-base)] border border-solid border-transparent bg-transparent p-2.5 text-inherit transition-colors hover:!border-[var(--el-color-primary-light-5)] hover:!bg-[var(--el-fill-color-light)]"
          :class="[
            selectedTemplateId === template.id
              ? '!border-[var(--el-color-primary)] !bg-[var(--el-color-primary-light-9)]'
              : '',
          ]"
          type="button"
          @click="selectedTemplateId = template.id"
        >
          <ElImage
            v-if="template.coverUrl"
            class="h-12 w-[54px] shrink-0 overflow-hidden rounded-[var(--el-border-radius-base)]"
            fit="cover"
            :src="template.coverUrl"
          />
          <div
            v-else
            class="flex h-12 w-[54px] shrink-0 items-center justify-center rounded-[var(--el-border-radius-base)] bg-[var(--el-color-primary-light-9)] text-[22px] text-[var(--el-color-primary)]"
          >
            <IconifyIcon icon="ep:notebook" />
          </div>
          <div class="min-w-0 text-left">
            <div class="truncate text-[15px] font-semibold">
              {{ template.name }}
            </div>
            <div
              class="mt-1 truncate text-xs text-[var(--el-text-color-secondary)]"
            >
              {{ template.description }}
            </div>
          </div>
        </button>
      </div>
      <div
        class="rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-lighter)] p-4"
      >
        <template v-if="selectedTemplate">
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-[var(--el-border-radius-base)] bg-[var(--el-color-primary-light-9)] text-[22px] text-[var(--el-color-primary)]"
            >
              <ElImage
                v-if="selectedTemplate.coverUrl"
                class="h-full w-full"
                fit="cover"
                :src="selectedTemplate.coverUrl"
              />
              <IconifyIcon v-else icon="ep:notebook" />
            </div>
            <div class="min-w-0">
              <div class="truncate text-[15px] font-semibold">
                {{ selectedTemplate.name }}
              </div>
              <div
                class="mt-1 truncate text-xs text-[var(--el-text-color-secondary)]"
              >
                {{ selectedTemplate.description }}
              </div>
            </div>
          </div>
          <ElScrollbar class="mt-5" height="320px">
            <div
              v-for="document in selectedTemplate.documents ?? []"
              :key="document.title"
              class="mb-4 flex items-center gap-3 text-[var(--el-text-color-regular)]"
            >
              <IconifyIcon icon="ep:document" />
              <span>{{ document.title }}</span>
            </div>
          </ElScrollbar>
        </template>
        <div
          v-else
          class="flex h-full flex-col items-center justify-center text-[var(--el-text-color-regular)]"
        >
          <IconifyIcon class="text-[46px]" icon="ep:notebook" />
          <div class="mt-3">从空白知识库开始</div>
          <div class="mt-1.5 text-[13px] text-[var(--el-text-color-secondary)]">
            创建后可自由添加目录和文档
          </div>
        </div>
      </div>
    </div>

    <!-- 知识库基础信息 -->
    <Form v-else class="mx-4" />

    <!-- 底部操作 -->
    <div class="mt-4 flex items-center justify-between">
      <ElButton
        v-if="formType === 'update'"
        v-access:code="['pms:kb:library:update']"
        @click="openMemberForm"
      >
        成员管理
      </ElButton>
      <span v-else></span>
      <div class="flex gap-2">
        <ElButton
          v-if="formType === 'create' && templateSelecting"
          :disabled="templateLoading"
          type="primary"
          @click="handleTemplateNext"
        >
          下一步
        </ElButton>
        <template v-else>
          <ElButton v-if="formType === 'create'" @click="handleTemplateBack">
            上一步
          </ElButton>
          <ElButton type="primary" @click="submitForm">确 定</ElButton>
        </template>
        <ElButton @click="modalApi.close()">取 消</ElButton>
      </div>
    </div>

    <!-- 知识库成员管理 -->
    <KnowledgeMemberFormModal @success="handleMemberSuccess" />
  </Modal>
</template>
