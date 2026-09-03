<script lang="ts" setup>
import type { Rule } from 'antdv-next';

import type { PmsKnowledgeLibraryApi } from '#/api/pms/kb/library';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import {
  Button,
  Form,
  FormItem,
  Image,
  Input,
  message,
  RadioGroup,
  TextArea,
} from 'antdv-next';

import {
  createKnowledgeLibrary,
  getKnowledgeLibrary,
  getKnowledgeLibraryTemplateList,
  updateKnowledgeLibrary,
} from '#/api/pms/kb/library';
import { ImageUpload } from '#/components/upload';
import { UserSelect } from '#/views/system/user/components';

import KnowledgeMemberForm from './knowledge-member-form.vue';

defineOptions({ name: 'PmsKnowledgeLibraryForm' });

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const formLoading = ref(false); // 表单提交中
const formType = ref<'create' | 'update'>('create'); // 表单类型：create - 新增；update - 修改
const templateSelecting = ref(false); // 是否正在选择知识库模板
const templateLoading = ref(false); // 模板加载中
const templateList = ref<PmsKnowledgeLibraryApi.KnowledgeLibraryTemplate[]>([]); // 知识库模板列表
const selectedTemplateId = ref(0); // 0 表示空白知识库
const formData =
  ref<PmsKnowledgeLibraryApi.KnowledgeLibrary>(getDefaultFormData()); // 表单数据
const currentUserId = useUserStore().userInfo?.id; // 创建人用户编号，不能重复加入初始成员
const initialAdminUserIds = ref<number[]>([]); // 创建时的初始管理员
const initialMemberUserIds = ref<number[]>([]); // 创建时的普通成员
const formRules: Record<string, Rule[]> = {
  name: [{ required: true, message: '请输入知识库名称' }],
  openStatus: [{ required: true, message: '请选择可见范围' }],
}; // 表单校验规则
const formRef = ref(); // 表单 Ref
const dialogTitle = ref(''); // 弹窗标题
const selectedTemplate = computed(() =>
  templateList.value.find(
    (template) => template.id === selectedTemplateId.value,
  ),
); // 当前选中的知识库模板

const [KnowledgeMemberFormModal, knowledgeMemberFormModalApi] = useVbenModal({
  connectedComponent: KnowledgeMemberForm,
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
function handleTemplateNext() {
  formData.value = selectedTemplate.value
    ? {
        ...getDefaultFormData(),
        name: selectedTemplate.value.name,
        description: selectedTemplate.value.description,
        coverUrl: selectedTemplate.value.coverUrl,
        templateId: selectedTemplateId.value,
      }
    : getDefaultFormData();
  resetInitialMembers();
  templateSelecting.value = false;
  dialogTitle.value = '新建知识库';
  nextTick(() => formRef.value?.clearValidate());
}

/** 返回知识库模板选择 */
function handleTemplateBack() {
  templateSelecting.value = true;
  dialogTitle.value = '选择知识库模板';
}

/** 重置创建时的初始成员 */
function resetInitialMembers() {
  initialAdminUserIds.value = [];
  initialMemberUserIds.value = [];
}

/** 校验初始管理员和普通成员不能重复 */
function validateInitialMembers() {
  const memberUserIdSet = new Set(initialMemberUserIds.value);
  return !initialAdminUserIds.value.some((userId) =>
    memberUserIdSet.has(userId),
  );
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

/** 重置表单 */
function resetForm() {
  formData.value = getDefaultFormData();
  resetInitialMembers();
  formRef.value?.resetFields();
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
    resetForm();
    if (data.formType === 'create') {
      await getTemplateList();
    } else if (data.id) {
      formLoading.value = true;
      try {
        formData.value = {
          ...(await getKnowledgeLibrary(data.id)),
          adminUserIds: [],
          memberUserIds: [],
          templateId: undefined,
        };
      } finally {
        formLoading.value = false;
      }
    }
  },
});

/** 提交表单 */
async function submitForm() {
  // 校验表单
  if (!formRef.value || !(await formRef.value.validate().catch(() => false))) {
    return;
  }
  if (formType.value === 'create' && !validateInitialMembers()) {
    message.warning('同一用户不能同时设置为初始管理员和普通成员');
    return;
  }
  // 提交请求
  formLoading.value = true;
  try {
    if (formType.value === 'create') {
      await createKnowledgeLibrary({
        ...formData.value,
        adminUserIds: [...initialAdminUserIds.value],
        memberUserIds: [...initialMemberUserIds.value],
      });
      message.success('创建成功');
    } else {
      await updateKnowledgeLibrary(formData.value);
      message.success('更新成功');
    }
    await modalApi.close();
    // 发送操作成功的事件
    emit('success');
  } finally {
    formLoading.value = false;
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
          class="mb-1.5 flex w-full cursor-pointer items-center gap-3 rounded border border-solid border-transparent bg-transparent p-2.5 text-inherit transition-colors hover:!border-blue-300 hover:!bg-accent"
          :class="[
            selectedTemplateId === 0 ? '!border-blue-500 !bg-primary/10' : '',
          ]"
          type="button"
          @click="selectedTemplateId = 0"
        >
          <div
            class="flex h-12 w-[54px] shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-border text-[22px] text-primary"
          >
            <IconifyIcon icon="lucide:plus" />
          </div>
          <div class="min-w-0 text-left">
            <div class="truncate text-[15px] font-semibold">空白知识库</div>
            <div class="mt-1 truncate text-xs text-muted-foreground">
              邀请团队成员一起创作和交流知识
            </div>
          </div>
        </button>
        <button
          v-for="template in templateList"
          :key="template.id"
          class="mb-1.5 flex w-full cursor-pointer items-center gap-3 rounded border border-solid border-transparent bg-transparent p-2.5 text-inherit transition-colors hover:!border-blue-300 hover:!bg-accent"
          :class="[
            selectedTemplateId === template.id
              ? '!border-blue-500 !bg-primary/10'
              : '',
          ]"
          type="button"
          @click="selectedTemplateId = template.id"
        >
          <Image
            v-if="template.coverUrl"
            class="h-12 w-[54px] shrink-0 overflow-hidden rounded object-cover"
            :src="template.coverUrl"
            :preview="false"
          />
          <div
            v-else
            class="flex h-12 w-[54px] shrink-0 items-center justify-center rounded bg-primary/10 text-[22px] text-primary"
          >
            <IconifyIcon icon="lucide:notebook" />
          </div>
          <div class="min-w-0 text-left">
            <div class="truncate text-[15px] font-semibold">
              {{ template.name }}
            </div>
            <div class="mt-1 truncate text-xs text-muted-foreground">
              {{ template.description }}
            </div>
          </div>
        </button>
      </div>
      <div class="rounded bg-accent p-4">
        <template v-if="selectedTemplate">
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-[54px] shrink-0 items-center justify-center overflow-hidden rounded bg-primary/10 text-[22px] text-primary"
            >
              <Image
                v-if="selectedTemplate.coverUrl"
                class="h-full w-full object-cover"
                :src="selectedTemplate.coverUrl"
                :preview="false"
              />
              <IconifyIcon v-else icon="lucide:notebook" />
            </div>
            <div class="min-w-0">
              <div class="truncate text-[15px] font-semibold">
                {{ selectedTemplate.name }}
              </div>
              <div class="mt-1 truncate text-xs text-muted-foreground">
                {{ selectedTemplate.description }}
              </div>
            </div>
          </div>
          <div class="mt-5 max-h-[320px] overflow-y-auto">
            <div
              v-for="document in selectedTemplate.documents ?? []"
              :key="document.title"
              class="mb-4 flex items-center gap-3 text-foreground"
            >
              <IconifyIcon icon="lucide:file-text" />
              <span>{{ document.title }}</span>
            </div>
          </div>
        </template>
        <div
          v-else
          class="flex h-full flex-col items-center justify-center text-foreground"
        >
          <IconifyIcon class="text-[46px]" icon="lucide:notebook" />
          <div class="mt-3">从空白知识库开始</div>
          <div class="mt-1.5 text-[13px] text-muted-foreground">
            创建后可自由添加目录和文档
          </div>
        </div>
      </div>
    </div>

    <!-- 知识库基础信息 -->
    <Form
      v-else
      ref="formRef"
      v-loading="formLoading"
      :label-col="{ style: { width: '100px' } }"
      :model="formData"
      :rules="formRules"
    >
      <FormItem label="知识库名称" name="name">
        <Input
          v-model:value="formData.name"
          :maxlength="50"
          placeholder="请输入知识库名称"
          show-count
        />
      </FormItem>
      <FormItem label="知识库封面" name="coverUrl">
        <ImageUpload v-model="formData.coverUrl" :max-number="1" />
      </FormItem>
      <FormItem label="知识库简介" name="description">
        <TextArea
          v-model:value="formData.description"
          :maxlength="300"
          :rows="4"
          placeholder="请输入知识库简介"
          show-count
        />
      </FormItem>
      <FormItem label="可见范围" name="openStatus">
        <RadioGroup
          v-model:value="formData.openStatus"
          :disabled="
            formType === 'update' && formData.creatorUserId !== currentUserId
          "
          :options="[
            { label: '私有：只有知识库成员可以查看', value: false },
            { label: '公开：所有人可以查看，成员可以协作', value: true },
          ]"
        />
      </FormItem>
      <FormItem v-if="formType === 'create'" label="初始管理员">
        <UserSelect
          v-model="initialAdminUserIds"
          :disabled-ids="currentUserId === undefined ? [] : [currentUserId]"
          :multiple="true"
          placeholder="请选择初始管理员"
        />
        <div class="mt-1 text-xs text-muted-foreground">
          可管理知识库信息和成员；创建人由系统自动加入
        </div>
      </FormItem>
      <FormItem v-if="formType === 'create'" label="普通成员">
        <UserSelect
          v-model="initialMemberUserIds"
          :disabled-ids="currentUserId === undefined ? [] : [currentUserId]"
          :multiple="true"
          placeholder="请选择普通成员"
        />
        <div class="mt-1 text-xs text-muted-foreground">
          可参与内容协作，具体能力受文档权限控制
        </div>
      </FormItem>
    </Form>

    <!-- 底部操作 -->
    <div class="mt-4 flex items-center justify-between">
      <Button
        v-if="formType === 'update'"
        v-access:code="['pms:kb:library:update']"
        @click="openMemberForm"
      >
        成员管理
      </Button>
      <span v-else></span>
      <div class="flex gap-2">
        <Button
          v-if="formType === 'create' && templateSelecting"
          :disabled="templateLoading"
          type="primary"
          @click="handleTemplateNext"
        >
          下一步
        </Button>
        <template v-else>
          <Button
            v-if="formType === 'create'"
            :disabled="formLoading"
            @click="handleTemplateBack"
          >
            上一步
          </Button>
          <Button :disabled="formLoading" type="primary" @click="submitForm">
            确 定
          </Button>
        </template>
        <Button @click="modalApi.close()">取 消</Button>
      </div>
    </div>

    <!-- 知识库成员管理 -->
    <KnowledgeMemberFormModal @success="handleMemberSuccess" />
  </Modal>
</template>
