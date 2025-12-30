<script setup lang="ts">
import type { GoodsApi } from '#/api/mpr/goods';
import type { PriceReferenceApi } from '#/api/mpr/priceReference';

import { ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';

import { PlusOutlined } from '@ant-design/icons-vue';
import { message, Tag } from 'ant-design-vue';

import { getGoods } from '#/api/mpr/goods';
import {
  deletePriceReference,
  getPriceReferenceList,
} from '#/api/mpr/priceReference';
import { useDescription } from '#/components/description';
import { $t } from '#/locales';
import PriceReferenceDetail from '#/views/mpr/priceReference/modules/detail.vue';
import Form from '#/views/mpr/priceReference/modules/form.vue';

import { useDetailSchema } from '../data';

const detailData = ref<GoodsApi.Goods>();
const priceReferences = ref<PriceReferenceApi.PriceReference>([]);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const [PriceReferenceDetailModal, priceReferenceDetailModalApi] = useVbenModal({
  connectedComponent: PriceReferenceDetail,
  destroyOnClose: true,
});

const [Description] = useDescription({
  componentProps: {
    bordered: false,
    column: 1,
    class: 'mx-4',
    labelStyle: {
      fontWeight: 'bold',
    },
  },
  schema: useDetailSchema(),
});
/** 创建价格参考 */
function newPriceReference() {
  formModalApi
    .setData({
      goodsId: detailData.value?.goodsId,
      currency: detailData.value?.details?.pricing?.currency,
    })
    .open();
}

/** 查看价格参考详情 */
function handlePriceReferenceDetail(row: PriceReferenceApi.PriceReference) {
  priceReferenceDetailModalApi.setData(row).open();
}

/** 编辑价格参考 */
// eslint-disable-next-line no-unused-vars
function _handleEdit(row: PriceReferenceApi.PriceReference) {
  formModalApi.setData(row).open();
}

async function getGoodsData() {
  modalApi.lock();
  try {
    detailData.value = await getGoods(detailData.value.id);
  } finally {
    modalApi.unlock();
  }
}
const [Modal, modalApi] = useVbenModal({
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      detailData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<GoodsApi.Goods>();
    if (!data || !data.id) {
      return;
    }
    detailData.value = { id: data.id };
    await getGoodsData();
    await getPriceReferences();
  },
});

async function getPriceReferences() {
  // 获取价格参考
  try {
    priceReferences.value = await getPriceReferenceList(
      detailData.value?.goodsId,
    );
  } finally {
    modalApi.unlock();
  }
}
/** 删除价格参考 */
async function handleDelete(row: PriceReferenceApi.PriceReference) {
  try {
    await confirm(`确定要删除参考价格<${row.formattedAmount}>吗？`);
    const hideLoading = message.loading({
      content: $t('ui.actionMessage.deleting', [row.id]),
      key: 'action_key_msg',
    });
    try {
      await deletePriceReference(row.id as number);
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.id]),
        key: 'action_key_msg',
      });
      await getPriceReferences();
    } finally {
      hideLoading();
    }
  } catch (error) {
    console.error('确认失败:', error);
  }
}
</script>
<template>
  <Modal
    draggable
    title="商品详情"
    class="w-2/3"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <FormModal @success="getPriceReferences" />
    <PriceReferenceDetailModal @refresh="getPriceReferences" />
    <a-row>
      <a-col :span="16">
        <a-carousel arrows dots-class="slick-dots slick-thumb">
          <template #customPaging="props">
            <a>
              <img :src="detailData?.details?.images[props.i]" />
            </a>
          </template>
          <div
            v-for="(value, key, index) in detailData?.details?.images"
            :key="key"
          >
            <img :src="value" :title="index" />
          </div>
        </a-carousel>
      </a-col>
      <a-col :span="8">
        <Description :data="detailData">
          <template #field-priceReference="{ value }">
            <div class="text-base">
              <span class="font-bold text-red-500">
                {{ value }}
              </span>
              <Tag
                v-for="item in priceReferences"
                :key="item.id"
                closable
                @click="handlePriceReferenceDetail(item)"
                @close.prevent="handleDelete(item)"
              >
                {{ item.formattedAmount }}
              </Tag>
              <Tag
                class="vben-link"
                style="background: #fff; border-style: dashed"
                @click="newPriceReference"
              >
                <PlusOutlined />
                新建
              </Tag>
            </div>
          </template>
        </Description>
      </a-col>
    </a-row>
  </Modal>
</template>

<style scoped>
/* For demo */
:deep(.slick-dots) {
  position: relative;
  height: auto;
}

:deep(.slick-slide img) {
  display: block;
  max-width: 80%;
  margin: auto;
  border: 5px solid #fff;
}

:deep(.slick-arrow) {
  display: block !important;
}

:deep(.slick-thumb) {
  bottom: 0;
}

:deep(.slick-thumb li) {
  width: 60px;
  height: 45px;
}

:deep(.slick-thumb li img) {
  display: block;
  width: 100%;
  height: 100%;
  filter: grayscale(100%);
}

:deep .slick-thumb li.slick-active img {
  filter: grayscale(0%);
}
</style>
