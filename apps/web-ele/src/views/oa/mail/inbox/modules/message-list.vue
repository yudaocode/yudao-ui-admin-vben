<script lang="ts" setup>
import type { OaMailMessageApi } from '#/api/oa/mail/message';

import { formatDate } from '@vben/utils';

import {
  ElAlert,
  ElButton,
  ElEmpty,
  ElInput,
  ElPagination,
  ElRadioButton,
  ElRadioGroup,
} from 'element-plus';

/** 邮件列表 */
defineOptions({ name: 'OaMailMessageList' });

defineProps<{
  disabled: boolean;
  emptyText: string;
  list: OaMailMessageApi.MailMessage[];
  listError: string;
  loading: boolean;
  selectedId?: number;
  total: number;
}>();

const emit = defineEmits<{
  pageChange: [];
  query: [];
  select: [mail: OaMailMessageApi.MailMessage];
}>();
const keyword = defineModel<string>('keyword', { required: true }); // 搜索关键字
const filter = defineModel<string>('filter', { required: true }); // 邮件筛选
const pageSize = defineModel<number>('pageSize', { required: true }); // 每页条数
const pageNo = defineModel<number>('pageNo', { required: true }); // 当前页码
</script>

<template>
  <section class="flex w-[340px] shrink-0 flex-col border-r border-border">
    <div class="flex flex-col gap-3 border-b border-border p-4">
      <ElInput
        v-model="keyword"
        placeholder="搜索主题/发件人"
        clearable
        @keyup.enter="emit('query')"
        @clear="emit('query')"
      >
        <template #append>
          <ElButton @click="emit('query')">搜索</ElButton>
        </template>
      </ElInput>
      <ElRadioGroup
        v-model="filter"
        class="!grid w-full grid-cols-3 [&>label]:text-center [&>label>span]:w-full"
        size="small"
        @change="emit('query')"
      >
        <ElRadioButton value="all">全部</ElRadioButton>
        <ElRadioButton value="unread">未读</ElRadioButton>
        <ElRadioButton value="attach">有附件</ElRadioButton>
      </ElRadioGroup>
    </div>
    <div v-loading="loading" class="min-h-0 flex-1 overflow-auto">
      <ElAlert
        v-if="listError"
        :title="listError"
        type="error"
        :closable="false"
      />
      <ElEmpty
        v-if="!list.length && !loading"
        :description="emptyText"
        class="mt-10"
      />
      <button
        v-for="mail in list"
        :key="mail.id"
        type="button"
        class="block w-full cursor-pointer border-0 border-b border-border px-3 py-2 text-left hover:bg-accent"
        :class="selectedId === mail.id ? 'bg-accent' : 'bg-transparent'"
        :disabled="disabled"
        @click="emit('select', mail)"
      >
        <div class="flex items-center gap-2">
          <span
            v-if="!mail.readStatus"
            class="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
            title="未读"
            aria-label="未读"
          >
          </span>
          <span
            class="min-w-0 flex-1 truncate"
            :class="{ 'font-bold': !mail.readStatus }"
          >
            {{ mail.subject || '（无主题）' }}
          </span>
          <span class="shrink-0 text-xs text-muted-foreground">
            {{ formatDate(mail.receiveTime, 'MM-DD HH:mm') }}
          </span>
        </div>
        <div class="mt-1.5 truncate text-xs text-muted-foreground">
          {{ mail.sender }}
        </div>
        <div v-if="mail.hasAttach" class="mt-1 text-xs text-muted-foreground">
          有附件
        </div>
      </button>
    </div>
    <div class="border-t border-border p-3">
      <ElPagination
        v-model:current-page="pageNo"
        v-model:page-size="pageSize"
        :total="total"
        :pager-count="5"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        small
        @size-change="emit('pageChange')"
        @current-change="emit('pageChange')"
      />
    </div>
  </section>
</template>
