<script lang="ts" setup>
// TODO @xingyu：这个有可能 3 端复用么？想着是把 layouts 下的 components 没有这个目录哈；
import { useVbenModal, VbenButton, VbenButtonGroup } from '@vben/common-ui';
import { openWindow } from '@vben/utils';

import { Image, Tag } from 'ant-design-vue';

import { $t } from '#/locales';

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  overlayBlur: 5,
  footer: false,
  onCancel() {
    modalApi.close();
  },
});
</script>
<template>
  <Modal class="w-[40%]" :title="$t('ui.widgets.qa')">
    <div class="mt-2 flex flex-col">
      <div class="mt-2 flex flex-row">
        <VbenButtonGroup class="basis-1/3" :gap="2" border size="large">
          <p class="p-2">项目地址:</p>
          <VbenButton
            variant="link"
            @click="
              openWindow('https://gitee.com/yudaocode/yudao-ui-admin-vben')
            "
          >
            Gitee
          </VbenButton>
          <VbenButton
            variant="link"
            @click="
              openWindow('https://github.com/yudaocode/yudao-ui-admin-vben')
            "
          >
            Github
          </VbenButton>
        </VbenButtonGroup>

        <VbenButtonGroup class="basis-1/3" :gap="2" border size="large">
          <p class="p-2">issues:</p>
          <VbenButton
            variant="link"
            @click="
              openWindow(
                'https://gitee.com/yudaocode/yudao-ui-admin-vben/issues',
              )
            "
          >
            Gitee
          </VbenButton>
          <VbenButton
            variant="link"
            @click="
              openWindow(
                'https://github.com/yudaocode/yudao-ui-admin-vben/issues',
              )
            "
          >
            Github
          </VbenButton>
        </VbenButtonGroup>

        <VbenButtonGroup class="basis-1/3" :gap="2" border size="large">
          <p class="p-2">开发文档:</p>
          <VbenButton
            variant="link"
            @click="openWindow('https://doc.iocoder.cn/quick-start/')"
          >
            项目文档
          </VbenButton>
          <VbenButton variant="link" @click="openWindow('https://antdv.com/')">
            antdv 文档
          </VbenButton>
        </VbenButtonGroup>
      </div>
      <p class="mt-2 flex justify-center">
        <span>
          <Image src="/wx-xingyu.png" alt="数舵科技" />
        </span>
      </p>
      <p class="mt-2 flex justify-center pt-4 text-sm italic">
        本项目采用<Tag color="blue">MIT</Tag>开源协议，个人与企业可100%
        免费使用。
      </p>
    </div>
  </Modal>
</template>
