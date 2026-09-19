<script lang="ts" setup>
import type { OaMailAccountApi } from '#/api/oa/mail/account';
import type { OaMailFolderApi } from '#/api/oa/mail/folder';

import { Button } from 'ant-design-vue';

import MailAccountSelect from '../../account/components/select.vue';

/** 邮箱文件夹侧栏 */
defineOptions({ name: 'OaMailFolderList' });

defineProps<{
  accounts: OaMailAccountApi.MailAccount[];
  composing: boolean;
  folderKey: string;
  folders: OaMailFolderApi.MailFolder[];
  operating: boolean;
  syncing: boolean;
}>();
const emit = defineEmits<{
  accountChange: [];
  compose: [];
  folderChange: [key: string];
  settings: [];
  sync: [];
}>();
const accountId = defineModel<number>('accountId'); // 当前账号

</script>

<template>
  <aside class="flex w-[220px] shrink-0 flex-col border-r border-border p-3">
    <MailAccountSelect
      v-model="accountId"
      :accounts="accounts"
      :disabled="syncing || composing"
      @change="emit('accountChange')"
    />
    <Button
      type="primary"
      class="mt-2 w-full"
      :disabled="!accountId || composing"
      @click="emit('compose')"
    >
      写信
    </Button>
    <nav class="mt-3 min-h-0 flex-1 overflow-auto">
      <button
        v-for="folder in folders"
        :key="folder.key"
        type="button"
        class="mb-1 flex h-9 w-full shrink-0 cursor-pointer items-center justify-between gap-2 rounded border-0 px-3 py-0 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        :class="
          folderKey === folder.key
            ? 'bg-accent font-bold text-primary'
            : 'bg-transparent'
        "
        :disabled="composing || operating"
        @click="emit('folderChange', folder.key)"
      >
        <span class="truncate" :title="folder.name">{{ folder.name }}</span>
        <span
          v-if="folder.unreadCount > 0"
          class="shrink-0 text-xs text-primary"
          :title="`${folder.unreadCount} 封未读邮件`"
          :aria-label="`${folder.unreadCount} 封未读邮件`"
        >
          {{ folder.unreadCount }}
        </span>
      </button>
    </nav>
    <div class="mt-auto grid grid-cols-2 gap-2 pt-4 [&>button]:!ml-0 [&>button]:w-full">
      <Button :loading="syncing" :disabled="!accountId || composing" @click="emit('sync')">
        同步
      </Button>
      <Button @click="emit('settings')">账号设置</Button>
    </div>
  </aside>
</template>
