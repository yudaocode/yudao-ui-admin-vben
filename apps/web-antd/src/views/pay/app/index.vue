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
import aliPayFrom from './modules/channel/AlipayChannelForm.vue';

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
  id: 'system-notifyMessage-index',
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
  }
  // if (payCode.indexOf('wx_') === 0) {
  //   weixinFormRef.value.open(row.id, payCode);
  //   return;
  // }
  // if (payCode.indexOf('mock') === 0) {
  //   mockFormRef.value.open(row.id, payCode);
  // }
  // if (payCode.indexOf('wallet') === 0) {
  //   mockFormRef.value.open(row.id, payCode);
  // }
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
        <a-button
          v-access:code="['pay:app:update']"
          type="link"
          @click.stop="handleEdit(row)"
        >
          {{ $t('ui.actionTitle.edit') }}
        </a-button>
        <Popconfirm
          :get-popup-container="getVxePopupContainer"
          placement="left"
          v-access:code="['pay:app:delete']"
          title="确认删除？"
          @confirm="handleDelete(row)"
        >
          <a-button type="link" danger>
            {{ $t('ui.actionTitle.delete') }}
          </a-button>
        </Popconfirm>
      </template>
      <template #status="{ row }">
        <Switch
          v-model:checked="row.status"
          :checked-value="0"
          :un-checked-value="1"
        />
      </template>
      <template #alipayAppConfig="{ row }">
        <Button
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
          type="primary"
          danger
          :icon="h(CloseOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.ALIPAY_APP.code)"
        />
      </template>
      <template #alipayPCConfig="{ row }">
        <Button
          v-if="
            isChannelExists(row.channelCodes, PayChannelEnum.ALIPAY_PC.code)
          "
          type="primary"
          :icon="h(CheckOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.ALIPAY_PC.code)"
        />
        <Button
          v-else
          type="primary"
          danger
          :icon="h(CloseOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.ALIPAY_PC.code)"
        />
      </template>
      <template #alipayWAPConfig="{ row }">
        <Button
          v-if="
            isChannelExists(row.channelCodes, PayChannelEnum.ALIPAY_WAP.code)
          "
          type="primary"
          :icon="h(CheckOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.ALIPAY_WAP.code)"
        />
        <Button
          v-else
          type="primary"
          danger
          :icon="h(CloseOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.ALIPAY_WAP.code)"
        />
      </template>
      <template #alipayQrConfig="{ row }">
        <Button
          v-if="
            isChannelExists(row.channelCodes, PayChannelEnum.ALIPAY_QR.code)
          "
          type="primary"
          :icon="h(CheckOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.ALIPAY_QR.code)"
        />
        <Button
          v-else
          type="primary"
          danger
          :icon="h(CloseOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.ALIPAY_QR.code)"
        />
      </template>
      <template #alipayBarConfig="{ row }">
        <Button
          v-if="
            isChannelExists(row.channelCodes, PayChannelEnum.ALIPAY_BAR.code)
          "
          type="primary"
          :icon="h(CheckOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.ALIPAY_BAR.code)"
        />
        <Button
          v-else
          type="primary"
          danger
          :icon="h(CloseOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.ALIPAY_BAR.code)"
        />
      </template>
      <template #wxLiteConfig="{ row }">
        <Button
          v-if="isChannelExists(row.channelCodes, PayChannelEnum.WX_LITE.code)"
          type="primary"
          :icon="h(CheckOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.WX_LITE.code)"
        />
        <Button
          v-else
          type="primary"
          danger
          :icon="h(CloseOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.WX_LITE.code)"
        />
      </template>
      <template #wxPubConfig="{ row }">
        <Button
          v-if="isChannelExists(row.channelCodes, PayChannelEnum.WX_PUB.code)"
          type="primary"
          :icon="h(CheckOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.WX_PUB.code)"
        />
        <Button
          v-else
          type="primary"
          danger
          :icon="h(CloseOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.WX_PUB.code)"
        />
      </template>
      <template #wxAppConfig="{ row }">
        <Button
          v-if="isChannelExists(row.channelCodes, PayChannelEnum.WX_APP.code)"
          type="primary"
          :icon="h(CheckOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.WX_APP.code)"
        />
        <Button
          v-else
          type="primary"
          danger
          :icon="h(CloseOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.WX_APP.code)"
        />
      </template>
      <template #wxNativeConfig="{ row }">
        <Button
          v-if="
            isChannelExists(row.channelCodes, PayChannelEnum.WX_NATIVE.code)
          "
          type="primary"
          :icon="h(CheckOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.WX_NATIVE.code)"
        />
        <Button
          v-else
          type="primary"
          danger
          :icon="h(CloseOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.WX_NATIVE.code)"
        />
      </template>
      <template #wxWapConfig="{ row }">
        <Button
          v-if="isChannelExists(row.channelCodes, PayChannelEnum.WX_WAP.code)"
          type="primary"
          :icon="h(CheckOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.WX_WAP.code)"
        />
        <Button
          v-else
          type="primary"
          danger
          :icon="h(CloseOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.WX_WAP.code)"
        />
      </template>
      <template #wxBarConfig="{ row }">
        <Button
          v-if="isChannelExists(row.channelCodes, PayChannelEnum.WX_BAR.code)"
          type="primary"
          :icon="h(CheckOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.WX_BAR.code)"
        />
        <Button
          v-else
          type="primary"
          danger
          :icon="h(CloseOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.WX_BAR.code)"
        />
      </template>
      <template #walletConfig="{ row }">
        <Button
          v-if="isChannelExists(row.channelCodes, PayChannelEnum.WALLET.code)"
          type="primary"
          :icon="h(CheckOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.WALLET.code)"
        />
        <Button
          v-else
          type="primary"
          danger
          :icon="h(CloseOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.WALLET.code)"
        />
      </template>
      <template #mockConfig="{ row }">
        <Button
          v-if="isChannelExists(row.channelCodes, PayChannelEnum.MOCK.code)"
          type="primary"
          :icon="h(CheckOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.MOCK.code)"
        />
        <Button
          v-else
          type="primary"
          danger
          :icon="h(CloseOutlined)"
          shape="circle"
          @click="openChannelForm(row, PayChannelEnum.MOCK.code)"
        />
      </template>
    </BasicTable>
    <AppModal @reload="tableApi.query()" />
    <AliPayModal @reload="tableApi.query()" />
  </Page>
</template>
