<script lang="ts" setup>
// DONE @hw：名字可以缩写成 editor.vue，文件名
import { computed, nextTick, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Col,
  Input,
  message,
  Modal,
  Row,
  Select,
} from 'ant-design-vue';

import { MaterialSelect, News, ReplySelect } from '#/views/mp/components';

import { menuOptions } from './types';

const props = defineProps<{
  accountId: number;
  isParent: boolean;
  modelValue: any;
}>();

const emit = defineEmits<{
  (e: 'delete', v: void): void;
  (e: 'update:modelValue', v: any): void;
}>();

const menu = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});
const showNewsDialog = ref(false);
const hackResetReplySelect = ref(false);
const isLeave = computed<boolean>(() => !(menu.value.children?.length > 0));

watch(menu, () => {
  hackResetReplySelect.value = false; // 销毁组件
  nextTick(() => {
    hackResetReplySelect.value = true; // 重建组件
  });
});

// ======================== 菜单编辑（素材选择） ========================
/** 选择素材 */
function selectMaterial(item: any) {
  const articleId = item.articleId;
  const articles = item.content.newsItem;
  // 提示，针对多图文
  if (articles.length > 1) {
    message.warning('您选择的是多图文，将默认跳转第一篇');
  }
  showNewsDialog.value = false;

  // 设置菜单的回复
  menu.value.articleId = articleId;
  menu.value.replyArticles = [];
  articles.forEach((article: any) => {
    menu.value.replyArticles.push({
      title: article.title,
      description: article.digest,
      picUrl: article.picUrl,
      url: article.url,
    });
  });
}

/** 删除素材 */
function deleteMaterial() {
  delete menu.value.articleId;
  delete menu.value.replyArticles;
}
</script>

<template>
  <div>
    <!-- DONE @hw：尽量使用 tindwind 替代。ps：如果多个组件复用，那就不用调整 -->
    <div>
      <div class="mb-[15px] text-right">
        <Button type="primary" danger @click="emit('delete')">
          <IconifyIcon icon="lucide:trash-2" />
          删除当前菜单
        </Button>
      </div>
      <div>
        <span>菜单名称：</span>
        <Input
          class="mr-[2%] w-[240px]"
          v-model:value="menu.name"
          placeholder="请输入菜单名称"
          :maxlength="isParent ? 4 : 7"
          allow-clear
        />
      </div>
      <div v-if="isLeave">
        <div class="mt-5">
          <span>菜单标识：</span>
          <Input
            class="mr-[2%] w-[240px]"
            v-model:value="menu.menuKey"
            placeholder="请输入菜单 KEY"
            allow-clear
          />
        </div>
        <div class="mt-5">
          <span>菜单内容：</span>
          <Select
            v-model:value="menu.type"
            placeholder="请选择"
            class="mr-[2%] w-[240px]"
            allow-clear
          >
            <Select.Option
              v-for="item in menuOptions"
              :label="item.label"
              :value="item.value"
              :key="item.value"
            >
              {{ item.label }}
            </Select.Option>
          </Select>
        </div>
        <div
          class="mt-5 rounded-[5px] bg-white p-[20px_10px]"
          v-if="menu.type === 'view'"
        >
          <span>跳转链接：</span>
          <Input
            class="mr-[2%] w-[240px]"
            v-model:value="menu.url"
            placeholder="请输入链接"
            allow-clear
          />
        </div>
        <!-- DONE @hw：1）左侧 filed 宽度，看看要不要统一；2）右侧的 input 宽度也处理下； -->
        <div
          class="mt-5 rounded-[5px] bg-white p-[20px_10px]"
          v-if="menu.type === 'miniprogram'"
        >
          <div class="mb-5 flex items-center">
            <div class="w-[20%]">小程序的 appid ：</div>
            <Input
              class="mr-[2%] flex-1"
              v-model:value="menu.miniProgramAppId"
              placeholder="请输入小程序的appid"
              allow-clear
            />
          </div>
          <div class="mb-5 flex items-center">
            <div class="w-[20%]">小程序的页面路径：</div>
            <Input
              class="mr-[2%] flex-1"
              v-model:value="menu.miniProgramPagePath"
              placeholder="请输入小程序的页面路径，如：pages/index"
              allow-clear
            />
          </div>
          <div class="mb-5 flex items-center">
            <div class="w-[20%]">小程序的备用网页：</div>
            <Input
              class="mr-[2%] flex-1"
              v-model:value="menu.url"
              placeholder="不支持小程序的老版本客户端将打开本网页"
              allow-clear
            />
          </div>
          <p class="mt-[10px] text-[#29b6f6]">
            tips:需要和公众号进行关联才可以把小程序绑定带微信菜单上哟！
          </p>
        </div>
        <div
          class="mt-5 rounded-[5px] bg-white p-[20px_10px]"
          v-if="menu.type === 'article_view_limited'"
        >
          <Row>
            <div
              class="mx-auto mb-[10px] w-[280px] border border-[#eaeaea] p-[10px]"
              v-if="menu && menu.replyArticles"
            >
              <News :articles="menu.replyArticles" />
              <Row
                class="pt-[10px] text-center"
                justify="center"
                align="middle"
              >
                <Button
                  type="primary"
                  danger
                  shape="circle"
                  @click="deleteMaterial"
                >
                  <IconifyIcon icon="lucide:trash-2" />
                </Button>
              </Row>
            </div>
            <div v-else>
              <Row justify="center">
                <!-- DONE @hw：html 标签里的 style 要用 tindwind 替代下； -->
                <Col :span="24" class="text-center">
                  <Button type="primary" @click="showNewsDialog = true">
                    素材库选择
                    <IconifyIcon icon="lucide:circle-check" />
                  </Button>
                </Col>
              </Row>
            </div>
            <Modal
              title="选择图文"
              v-model:open="showNewsDialog"
              width="80%"
              destroy-on-close
            >
              <MaterialSelect
                type="news"
                :account-id="props.accountId"
                @select-material="selectMaterial"
              />
            </Modal>
          </Row>
        </div>
        <!-- TODO @hw：貌似这个组件出不来 -->
        <!--TODO @hw 这个组件显示逻辑是要有两个菜单才会显示，之前的代码逻辑我这边也不是很清楚，待沟通 -->
        <div
          class="configur-content mt-5"
          v-if="menu.type === 'click' || menu.type === 'scancode_waitmsg'"
        >
          <ReplySelect v-model="menu.reply" />
        </div>
        <!-- TODO @hw：扫码回复，这个帮忙看看，是不是有点问题。= = 好像 vue3 + element-plus 就有点问题； -->
      </div>
    </div>
  </div>
</template>
