<script lang="ts" setup>
import type { Reply } from './types';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Col, Modal, Row } from 'ant-design-vue';

import { WxMaterialSelect } from '#/views/mp/modules/wx-material-select';
import { WxNews } from '#/views/mp/modules/wx-news';

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
    <Row>
      <div
        class="mx-auto mb-[10px] w-[280px] border border-[#eaeaea] p-[10px]"
        v-if="reply.articles && reply.articles.length > 0"
      >
        <WxNews :articles="reply.articles" />
        <Col class="pt-[10px] text-center">
          <Button type="primary" danger shape="circle" @click="onDelete">
            <IconifyIcon icon="ep:delete" />
          </Button>
        </Col>
      </div>
      <!-- 选择素材 -->
      <Col :span="24" v-if="!reply.content">
        <Row class="text-center" align="middle">
          <Col :span="24">
            <Button type="primary" @click="showDialog = true">
              {{
                newsType === NewsType.Published
                  ? '选择已发布图文'
                  : '选择草稿箱图文'
              }}
              <IconifyIcon icon="ep:circle-check" />
            </Button>
          </Col>
        </Row>
      </Col>
      <Modal
        title="选择图文"
        v-model:open="showDialog"
        width="90%"
        destroy-on-close
      >
        <WxMaterialSelect
          type="news"
          :account-id="reply.accountId"
          :news-type="newsType"
          @select-material="selectMaterial"
        />
      </Modal>
    </Row>
  </div>
</template>

<style lang="scss" scoped></style>
