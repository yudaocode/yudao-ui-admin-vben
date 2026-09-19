<script lang="ts" setup>
import type { UploadUserFile } from 'element-plus';

import type { OaMailMessageApi } from '#/api/oa/mail/message';

import { computed, ref } from 'vue';

import { alert, confirm } from '@vben/common-ui';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElUpload,
} from 'element-plus';

import {
  deleteMailMessage,
  getMailMessageCompose,
  saveMailMessageDraft,
  sendMailMessage,
} from '#/api/oa/mail/message';
import { Tinymce } from '#/components/tinymce';
import MailAddressSelect from '#/views/oa/mail/account/components/address-select.vue';

/** 写信表单 */
defineOptions({ name: 'OaMailMessageForm' });

const props = defineProps<{ data: OaMailMessageApi.MailMessage }>();
const emit = defineEmits(['success', 'close']);
const formLoading = ref(false); // 表单提交中
const fileList = ref<UploadUserFile[]>([]); // 本次新增附件
const formData = ref<OaMailMessageApi.MailMessage>({ ...props.data }); // 表单数据

// 正文字数（不计空白字符）
const wordCount = computed(() => {
  const element = document.createElement('div');
  element.innerHTML = formData.value.content || '';
  return Array.from((element.textContent || '').replace(/\s/g, '')).length;
});

/** 移除草稿或转发邮件中不再保留的附件 */
function removeAttachment(part: string) {
  formData.value.attachments = formData.value.attachments?.filter(
    (item) => item.part !== part,
  );
  formData.value.attachmentParts =
    formData.value.attachments?.map((item) => item.part) || [];
}

/** 正文与本次选择的文件一起提交，不预先上传到公共附件库 */
function buildFormData() {
  const data = new FormData();
  data.append(
    'data',
    new Blob([JSON.stringify(formData.value)], { type: 'application/json' }),
  );
  for (const file of fileList.value) {
    if (file.raw) {
      data.append('files', file.raw, file.name);
    }
  }
  return data;
}

/** 发送邮件 */
async function submitForm() {
  if (!formData.value.recipients?.length) {
    ElMessage.warning('请填写收件人');
    return;
  }
  // 发送的二次确认
  await confirm('确认发送这封邮件？');
  // 提交请求
  formLoading.value = true;
  try {
    const result = await sendMailMessage(buildFormData());
    await alert(result);
    // 发送操作成功的事件
    emit('success');
  } finally {
    formLoading.value = false;
  }
}

/** 保存草稿，保留返回编号供后续修改 */
async function handleSaveDraft() {
  // 提交草稿并保留编号，后续保存更新同一封草稿
  formLoading.value = true;
  try {
    const draftId = await saveMailMessageDraft(buildFormData());
    formData.value.draftId = draftId;
    // 重新获取远端附件路径，避免重复上传。
    fileList.value = [];
    formData.value.attachmentParts = undefined;
    formData.value = await getMailMessageCompose(draftId, 'draft');
    ElMessage.success('保存成功');
  } finally {
    formLoading.value = false;
  }
}

/** 删除草稿 */
async function handleDelete() {
  if (!formData.value.draftId) return;
  // 删除的二次确认
  await confirm('确认将这封草稿移至已删除？');
  formLoading.value = true;
  try {
    await deleteMailMessage(formData.value.draftId);
    ElMessage.success('删除成功');
    emit('success');
  } finally {
    formLoading.value = false;
  }
}

/** 关闭前确认，避免丢失未保存内容 */
async function handleClose() {
  await confirm('确认关闭写信？未保存的内容将丢失。');
  emit('close');
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- 写信操作 -->
    <div class="flex items-center justify-between border-b border-border p-4">
      <span class="text-lg font-bold">
        {{ formData.draftId ? '编辑草稿' : '写信' }}
      </span>
      <div class="flex gap-2 [&>.el-button]:!ml-0">
        <ElButton type="primary" :loading="formLoading" @click="submitForm">
          发送
        </ElButton>
        <ElButton :disabled="formLoading" @click="handleSaveDraft">
          存草稿
        </ElButton>
        <ElButton
          v-if="formData.draftId"
          type="danger"
          plain
          :disabled="formLoading"
          @click="handleDelete"
        >
          删除
        </ElButton>
        <ElButton :disabled="formLoading" @click="handleClose">关闭</ElButton>
      </div>
    </div>
    <!-- 写信表单 -->
    <ElForm label-width="80px" class="overflow-auto p-4">
      <ElFormItem label="收件人">
        <MailAddressSelect v-model="formData.recipients" />
      </ElFormItem>
      <ElFormItem label="抄送人">
        <MailAddressSelect v-model="formData.ccs" />
      </ElFormItem>
      <ElFormItem label="主题">
        <ElInput
          v-model="formData.subject"
          placeholder="请输入主题"
          :maxlength="65_535"
        />
      </ElFormItem>
      <ElFormItem label="附件">
        <div class="w-full">
          <div
            v-for="attachment in formData.attachments"
            :key="attachment.part"
            class="mb-2 flex items-center gap-2"
          >
            <span>{{ attachment.name }}</span>
            <ElButton
              link
              type="danger"
              :disabled="formLoading"
              @click="removeAttachment(attachment.part)"
            >
              移除
            </ElButton>
          </div>
          <ElUpload
            v-model:file-list="fileList"
            :auto-upload="false"
            :disabled="formLoading"
            multiple
          >
            <ElButton :disabled="formLoading">添加附件</ElButton>
          </ElUpload>
          <div class="text-muted-foreground mt-1 text-xs">
            单个文件不超过 16 MB，总请求不超过 32 MB
          </div>
        </div>
      </ElFormItem>
      <ElFormItem label="正文">
        <div class="w-full">
          <div class="text-muted-foreground mb-2 text-right text-xs">
            {{ wordCount }} 字
          </div>
          <Tinymce v-model="formData.content" :height="360" />
        </div>
      </ElFormItem>
    </ElForm>
  </div>
</template>
