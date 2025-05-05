<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { h, reactive } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { getVxePopupContainer } from '@vben/utils';

import { CheckOutlined, CloseOutlined } from '@ant-design/icons-vue';
import { Button, Popconfirm, Space, Switch } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import * as PayApi from '#/api/pay/app';
import { DocAlert } from '#/components/doc-alert';
import { PayChannelEnum } from '#/utils/constants';

import { columns, querySchema } from './data';
import appFrom from './modules/app-form.vue';
import aliPayFrom from './modules/channel/alipay-channel-form.vue';
import mockFrom from './modules/channel/mock-channel-form.vue';
import walletFrom from './modules/channel/wallet-channel-form.vue';
import weixinFrom from './modules/channel/weixin-channel-form.vue';

const formOptions: VbenFormProps = {
  commonConfig: {
    labelWidth: 100,
    componentProps: {
      allowClear: true,
    },
  },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  // 处理区间选择器RangePicker时间格式 将一个字段映射为两个字段 搜索/导出会用到
  // 不需要直接删除
  // fieldMappingTime: [
  //  [
  //    'createTime',
  //    ['params[beginTime]', 'params[endTime]'],
  //    ['YYYY-MM-DD 00:00:00', 'YYYY-MM-DD 23:59:59'],
  //  ],
  // ],
};

const gridOptions: VxeGridProps = {
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    // 点击行选中
    // trigger: 'row',
  },
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        return await PayApi.getAppPage({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  // 表格全局唯一表示 保存列配置需要用到
  id: 'pay-app-index',
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

const [AppModal, modalApi] = useVbenModal({
  connectedComponent: appFrom,
});

const [AliPayModal, modalAliPayApi] = useVbenModal({
  connectedComponent: aliPayFrom,
});

const [MockModal, modalMockApi] = useVbenModal({
  connectedComponent: mockFrom,
});

const [WalletModal, modalWalletApi] = useVbenModal({
  connectedComponent: walletFrom,
});

const [WeixinModal, modalWeixinApi] = useVbenModal({
  connectedComponent: weixinFrom,
});

const handleAdd = () => {
  modalApi.setData({});
  modalApi.open();
};

const handleEdit = (row: Required<PayApi.PayAppApi.App>) => {
  modalApi.setData({ id: row.id });
  modalApi.open();
};

const handleDelete = async (row: Required<PayApi.PayAppApi.App>) => {
  await PayApi.deleteApp(row.id);
  tableApi.query();
};

/**
 * 根据渠道编码判断渠道列表中是否存在
 *
 * @param channels 渠道列表
 * @param channelCode 渠道编码
 */
const isChannelExists = (channels: string[], channelCode: string) => {
  if (!channels) {
    return false;
  }
  return channels.includes(channelCode);
};

const channelParam = reactive({
  appId: 0, // 应用 ID
  payCode: '', // 渠道编码
});

const openChannelForm = async (row: PayApi.PayAppApi.App, payCode: string) => {
  channelParam.appId = row.id || 0;
  channelParam.payCode = payCode;
  if (payCode.indexOf('alipay_') === 0) {
    modalAliPayApi.setData({ id: row.id, payCode });
    modalAliPayApi.open();
    return;
  }
  if (payCode.indexOf('wx_') === 0) {
    modalWeixinApi.setData({ id: row.id, payCode });
    modalWeixinApi.open();
    return;
  }
  if (payCode.indexOf('mock') === 0) {
    modalMockApi.setData({ id: row.id, payCode });
    modalMockApi.open();
    return;
  }
  if (payCode.indexOf('wallet') === 0) {
    modalWalletApi.setData({ id: row.id, payCode });
    modalWalletApi.open();
  }
};
</script>

<template>
  <Page :auto-content-height="true">
    <DocAlert title="支付功能开启" url="https://doc.iocoder.cn/pay/build/" />
    <BasicTable>
      <template #toolbar-tools>
        <Space>
          <a-button
            type="primary"
            v-access:code="['pay:app:create']"
            @click="handleAdd"
          >
            {{ $t('ui.actionTitle.create', ['应用']) }}
          </a-button>
        </Space>
      </template>
      <template #action="{ row }">
        <Space>
          <Button
            v-access:code="['pay:app:update']"
            type="link"
            @click.stop="handleEdit(row)"
          >
            {{ $t('ui.actionTitle.edit') }}
          </Button>
          <Popconfirm
            :get-popup-container="getVxePopupContainer"
            placement="left"
            v-access:code="['pay:app:delete']"
            title="确认删除？"
            @confirm="handleDelete(row)"
          >
            <Button type="link" danger>
              {{ $t('ui.actionTitle.delete') }}
            </Button>
          </Popconfirm>
        </Space>
      </template>
      <template #status="{ row }">
        <Switch
          v-model:checked="row.status"
          :checked-value="0"
          :un-checked-value="1"
        />
      </template>
      <template #alipayAppConfig="{ row }">
        <div>
          <Button
            size="small"
            v-if="
              isChannelExists(row.channelCodes, PayChannelEnum.ALIPAY_APP.code)
            "
            type="primary"
            :icon="h(CheckOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.ALIPAY_APP.code)"
          />
          <Button
            v-else
            size="small"
            type="primary"
            danger
            :icon="h(CloseOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.ALIPAY_APP.code)"
          />
        </div>
      </template>
      <template #alipayPCConfig="{ row }">
        <div>
          <Button
            size="small"
            v-if="
              isChannelExists(row.channelCodes, PayChannelEnum.ALIPAY_PC.code)
            "
            type="primary"
            :icon="h(CheckOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.ALIPAY_PC.code)"
          />
          <Button
            size="small"
            v-else
            type="primary"
            danger
            :icon="h(CloseOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.ALIPAY_PC.code)"
          />
        </div>
      </template>
      <template #alipayWAPConfig="{ row }">
        <div>
          <Button
            size="small"
            v-if="
              isChannelExists(row.channelCodes, PayChannelEnum.ALIPAY_WAP.code)
            "
            type="primary"
            :icon="h(CheckOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.ALIPAY_WAP.code)"
          />
          <Button
            size="small"
            v-else
            type="primary"
            danger
            :icon="h(CloseOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.ALIPAY_WAP.code)"
          />
        </div>
      </template>
      <template #alipayQrConfig="{ row }">
        <div>
          <Button
            size="small"
            v-if="
              isChannelExists(row.channelCodes, PayChannelEnum.ALIPAY_QR.code)
            "
            type="primary"
            :icon="h(CheckOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.ALIPAY_QR.code)"
          />
          <Button
            size="small"
            v-else
            type="primary"
            danger
            :icon="h(CloseOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.ALIPAY_QR.code)"
          />
        </div>
      </template>
      <template #alipayBarConfig="{ row }">
        <div>
          <Button
            size="small"
            v-if="
              isChannelExists(row.channelCodes, PayChannelEnum.ALIPAY_BAR.code)
            "
            type="primary"
            :icon="h(CheckOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.ALIPAY_BAR.code)"
          />
          <Button
            size="small"
            v-else
            type="primary"
            danger
            :icon="h(CloseOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.ALIPAY_BAR.code)"
          />
        </div>
      </template>
      <template #wxLiteConfig="{ row }">
        <div>
          <Button
            size="small"
            v-if="
              isChannelExists(row.channelCodes, PayChannelEnum.WX_LITE.code)
            "
            type="primary"
            :icon="h(CheckOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.WX_LITE.code)"
          />
          <Button
            size="small"
            v-else
            type="primary"
            danger
            :icon="h(CloseOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.WX_LITE.code)"
          />
        </div>
      </template>
      <template #wxPubConfig="{ row }">
        <div>
          <Button
            size="small"
            v-if="isChannelExists(row.channelCodes, PayChannelEnum.WX_PUB.code)"
            type="primary"
            :icon="h(CheckOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.WX_PUB.code)"
          />
          <Button
            size="small"
            v-else
            type="primary"
            danger
            :icon="h(CloseOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.WX_PUB.code)"
          />
        </div>
      </template>
      <template #wxAppConfig="{ row }">
        <div>
          <Button
            size="small"
            v-if="isChannelExists(row.channelCodes, PayChannelEnum.WX_APP.code)"
            type="primary"
            :icon="h(CheckOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.WX_APP.code)"
          />
          <Button
            size="small"
            v-else
            type="primary"
            danger
            :icon="h(CloseOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.WX_APP.code)"
          />
        </div>
      </template>
      <template #wxNativeConfig="{ row }">
        <div>
          <Button
            size="small"
            v-if="
              isChannelExists(row.channelCodes, PayChannelEnum.WX_NATIVE.code)
            "
            type="primary"
            :icon="h(CheckOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.WX_NATIVE.code)"
          />
          <Button
            size="small"
            v-else
            type="primary"
            danger
            :icon="h(CloseOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.WX_NATIVE.code)"
          />
        </div>
      </template>
      <template #wxWapConfig="{ row }">
        <div>
          <Button
            size="small"
            v-if="isChannelExists(row.channelCodes, PayChannelEnum.WX_WAP.code)"
            type="primary"
            :icon="h(CheckOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.WX_WAP.code)"
          />
          <Button
            size="small"
            v-else
            type="primary"
            danger
            :icon="h(CloseOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.WX_WAP.code)"
          />
        </div>
      </template>
      <template #wxBarConfig="{ row }">
        <div>
          <Button
            size="small"
            v-if="isChannelExists(row.channelCodes, PayChannelEnum.WX_BAR.code)"
            type="primary"
            :icon="h(CheckOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.WX_BAR.code)"
          />
          <Button
            size="small"
            v-else
            type="primary"
            danger
            :icon="h(CloseOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.WX_BAR.code)"
          />
        </div>
      </template>
      <template #walletConfig="{ row }">
        <div>
          <Button
            size="small"
            v-if="isChannelExists(row.channelCodes, PayChannelEnum.WALLET.code)"
            type="primary"
            :icon="h(CheckOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.WALLET.code)"
          />
          <Button
            size="small"
            v-else
            type="primary"
            danger
            :icon="h(CloseOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.WALLET.code)"
          />
        </div>
      </template>
      <template #mockConfig="{ row }">
        <div>
          <Button
            size="small"
            v-if="isChannelExists(row.channelCodes, PayChannelEnum.MOCK.code)"
            type="primary"
            :icon="h(CheckOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.MOCK.code)"
          />
          <Button
            size="small"
            v-else
            type="primary"
            danger
            :icon="h(CloseOutlined)"
            shape="circle"
            @click="openChannelForm(row, PayChannelEnum.MOCK.code)"
          />
        </div>
      </template>
    </BasicTable>
    <AppModal @reload="tableApi.query()" />
    <AliPayModal @reload="tableApi.query()" />
    <MockModal @reload="tableApi.query()" />
    <WalletModal @reload="tableApi.query()" />
    <WeixinModal @reload="tableApi.query()" />
  </Page>
</template>
