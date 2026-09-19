<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { formatDate } from '@vben/utils';

import { ElButton, ElEmpty, ElInput, ElMessage } from 'element-plus';

import { createNote, getMyNotePage } from '#/api/oa/note';
import { OA_NOTE_TYPE, OA_PRIORITY } from '#/views/oa/utils/constants';

import OaHomePanel from './panel.vue';

defineOptions({ name: 'OaHomeNote' });

type Note = Awaited<ReturnType<typeof getMyNotePage>>['list'][number];

const { hasAccessByCodes } = useAccess();
const { push } = useRouter();
const loading = ref(false); // 区块加载中
const loadError = ref(false); // 区块加载失败
const list = ref<Note[]>([]); // 笔记列表
const quickNote = ref(''); // 快捷笔记内容
const saving = ref(false); // 笔记保存中

/** 查询当前区块数据 */
async function getList() {
  if (loading.value) return;
  loading.value = true;
  loadError.value = false;
  try {
    list.value = (await getMyNotePage({ pageNo: 1, pageSize: 5 })).list;
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

/** 新增快捷笔记 */
async function createQuickNote() {
  if (saving.value) return;
  const content = quickNote.value.trim();
  if (!content) {
    ElMessage.warning('请输入笔记内容');
    return;
  }
  if (content.length < 10) {
    ElMessage.warning('笔记内容不能少于 10 个字');
    return;
  }
  saving.value = true;
  try {
    await createNote({
      type: OA_NOTE_TYPE.MINE,
      priority: OA_PRIORITY.NORMAL,
      title: content,
      content,
      fileUrls: [],
    });
    ElMessage.success('笔记添加成功');
    quickNote.value = '';
    await getList();
  } finally {
    saving.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getList();
});
</script>

<template>
  <OaHomePanel v-loading="loading" title="我的笔记">
    <template #actions>
      <ElButton link type="primary" @click="push('/oa/note')">更多</ElButton>
    </template>
    <div v-if="loadError" class="mb-3 text-[13px] text-destructive">
      加载失败，
      <ElButton link type="primary" @click="getList">重新加载</ElButton>
    </div>
    <ElEmpty
      v-if="list.length === 0"
      :image-size="56"
      description="暂无笔记"
    />
    <div
      v-for="item in list"
      v-else
      :key="item.id"
      class="border-border flex min-h-[50px] items-center gap-3 border-b py-2"
    >
      <div class="min-w-0 flex-1">
        <div class="truncate font-medium">{{ item.title }}</div>
        <div class="text-muted-foreground mt-1 truncate text-xs">
          {{ item.content || '暂无内容' }}
        </div>
      </div>
      <span class="text-muted-foreground text-xs">
        {{ formatDate(item.createTime, 'MM-DD') }}
      </span>
    </div>
    <div
      v-if="hasAccessByCodes(['oa:note:create'])"
      class="mt-3.5 flex gap-2"
    >
      <ElInput
        v-model="quickNote"
        maxlength="255"
        placeholder="输入笔记内容"
        @keyup.enter="createQuickNote"
      />
      <ElButton :loading="saving" type="primary" @click="createQuickNote">
        添加
      </ElButton>
    </div>
  </OaHomePanel>
</template>
