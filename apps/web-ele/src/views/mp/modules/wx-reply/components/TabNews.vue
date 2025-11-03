<script lang="ts" setup>
import type { Reply } from './types';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { ElButton, ElCol, ElDialog, ElRow } from 'element-plus';

import WxMaterialSelect from '#/views/mp/modules/wx-material-select';
import WxNews from '#/views/mp/modules/wx-news';

import { NewsType } from './types';

const props = defineProps<{
  modelValue: Reply;
  newsType: NewsType;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: Reply): void;
}>();
const reply = computed<Reply>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const showDialog = ref(false);

/** 选择素材 */
function selectMaterial(item: any) {
  showDialog.value = false;
  reply.value.articles = item.content.newsItem;
}

/** 删除图文 */
function onDelete() {
  reply.value.articles = [];
}
</script>

<template>
  <div>
    <ElRow>
      <div
        class="select-item"
        v-if="reply.articles && reply.articles.length > 0"
      >
        <WxNews :articles="reply.articles" />
        <ElCol class="ope-row">
          <ElButton type="danger" circle @click="onDelete">
            <IconifyIcon icon="ep:delete" />
          </ElButton>
        </ElCol>
      </div>
      <!-- 选择素材 -->
      <ElCol :span="24" v-if="!reply.content">
        <ElRow style="text-align: center" align="middle">
          <ElCol :span="24">
            <ElButton type="success" @click="showDialog = true">
              {{
                newsType === NewsType.Published
                  ? '选择已发布图文'
                  : '选择草稿箱图文'
              }}
              <IconifyIcon icon="ep:circle-check" />
            </ElButton>
          </ElCol>
        </ElRow>
      </ElCol>
      <ElDialog
        title="选择图文"
        v-model="showDialog"
        width="90%"
        append-to-body
        destroy-on-close
      >
        <WxMaterialSelect
          type="news"
          :account-id="reply.accountId"
          :news-type="newsType"
          @select-material="selectMaterial"
        />
      </ElDialog>
    </ElRow>
  </div>
</template>

<style lang="scss" scoped>
.select-item {
  width: 280px;
  padding: 10px;
  margin: 0 auto 10px;
  border: 1px solid #eaeaea;

  .ope-row {
    padding-top: 10px;
    text-align: center;
  }
}
</style>
