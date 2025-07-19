<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PayAppApi } from '#/api/pay/app/index';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { changeAppStatus, deleteApp, getAppPage } from '#/api/pay/app/index';
import { $t } from '#/locales';
import { CommonStatusEnum, PayChannelEnum } from '#/utils';

import { useGridColumns, useGridFormSchema } from './data';
import appFrom from './modules/app-form.vue';
import channelFrom from './modules/channel-form.vue';

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

const [AppFormModal, appFormModalApi] = useVbenModal({
  connectedComponent: appFrom,
  destroyOnClose: true,
});

const [ChannelFormModal, channelFormModalApi] = useVbenModal({
  connectedComponent: channelFrom,
  destroyOnClose: true,
});

function handleCreate() {
  appFormModalApi.setData(null).open();
}

function handleEdit(row: Required<PayAppApi.App>) {
  appFormModalApi.setData({ id: row.id }).open();
}

async function handleDelete(row: Required<PayAppApi.App>) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteApp(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 更新状态 */
async function handleStatusChange(
  newStatus: number,
  row: PayAppApi.App,
): Promise<boolean | undefined> {
  return new Promise((resolve, reject) => {
    const text = newStatus === CommonStatusEnum.ENABLE ? '启用' : '停用';
    confirm({
      content: `确认要${text + row.name}应用吗?`,
    })
      .then(async () => {
        // 更新状态
        const res = await changeAppStatus({
          id: row.id as number,
          status: newStatus,
        });
        if (res) {
          // 提示并返回成功
          ElMessage.success(`${text}成功`);
          resolve(true);
        } else {
          reject(new Error('更新失败'));
        }
      })
      .catch(() => {
        reject(new Error('取消操作'));
      });
  });
}

/**
 * 根据渠道编码判断渠道列表中是否存在
 *
 * @param channels 渠道列表
 * @param channelCode 渠道编码
 */
function isChannelExists(channels: string[], channelCode: string) {
  if (!channels) {
    return false;
  }
  return channels.includes(channelCode);
}

async function openChannelForm(row: PayAppApi.App, payCode: string) {
  channelFormModalApi.setData({ id: row.id, payCode }).open();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(handleStatusChange),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getAppPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<PayAppApi.App>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="支付功能开启" url="https://doc.iocoder.cn/pay/build/" />
    </template>

    <AppFormModal @success="onRefresh" />
    <ChannelFormModal @success="onRefresh" />

    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['应用']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['pay:app:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              link: true,
              type: 'primary',
              icon: ACTION_ICON.EDIT,
              auth: ['pay:app:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              link: true,
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              auth: ['pay:app:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
      <template #alipayAppConfig="{ row }">
        <TableAction
          :actions="[
            {
              size: 'small',
              icon: isChannelExists(
                row.channelCodes,
                PayChannelEnum.ALIPAY_APP.code,
              )
                ? 'lucide:check'
                : 'lucide:x',
              type: !isChannelExists(
                row.channelCodes,
                PayChannelEnum.ALIPAY_APP.code,
              )
                ? 'danger'
                : 'primary',
              circle: true,
              onClick: openChannelForm.bind(
                null,
                row,
                PayChannelEnum.ALIPAY_APP.code,
              ),
            },
          ]"
        />
      </template>
      <template #alipayPCConfig="{ row }">
        <TableAction
          :actions="[
            {
              size: 'small',
              icon: isChannelExists(
                row.channelCodes,
                PayChannelEnum.ALIPAY_PC.code,
              )
                ? 'lucide:check'
                : 'lucide:x',
              type: !isChannelExists(
                row.channelCodes,
                PayChannelEnum.ALIPAY_APP.code,
              )
                ? 'danger'
                : 'primary',
              circle: true,
              onClick: openChannelForm.bind(
                null,
                row,
                PayChannelEnum.ALIPAY_PC.code,
              ),
            },
          ]"
        />
      </template>
      <template #alipayWAPConfig="{ row }">
        <TableAction
          :actions="[
            {
              size: 'small',
              icon: isChannelExists(
                row.channelCodes,
                PayChannelEnum.ALIPAY_WAP.code,
              )
                ? 'lucide:check'
                : 'lucide:x',
              type: !isChannelExists(
                row.channelCodes,
                PayChannelEnum.ALIPAY_APP.code,
              )
                ? 'danger'
                : 'primary',
              circle: true,
              onClick: openChannelForm.bind(
                null,
                row,
                PayChannelEnum.ALIPAY_WAP.code,
              ),
            },
          ]"
        />
      </template>
      <template #alipayQrConfig="{ row }">
        <TableAction
          :actions="[
            {
              size: 'small',
              icon: isChannelExists(
                row.channelCodes,
                PayChannelEnum.ALIPAY_QR.code,
              )
                ? 'lucide:check'
                : 'lucide:x',
              type: !isChannelExists(
                row.channelCodes,
                PayChannelEnum.ALIPAY_APP.code,
              )
                ? 'danger'
                : 'primary',
              circle: true,
              onClick: openChannelForm.bind(
                null,
                row,
                PayChannelEnum.ALIPAY_QR.code,
              ),
            },
          ]"
        />
      </template>
      <template #alipayBarConfig="{ row }">
        <TableAction
          :actions="[
            {
              size: 'small',
              icon: isChannelExists(
                row.channelCodes,
                PayChannelEnum.ALIPAY_BAR.code,
              )
                ? 'lucide:check'
                : 'lucide:x',
              type: !isChannelExists(
                row.channelCodes,
                PayChannelEnum.ALIPAY_APP.code,
              )
                ? 'danger'
                : 'primary',
              circle: true,
              onClick: openChannelForm.bind(
                null,
                row,
                PayChannelEnum.ALIPAY_BAR.code,
              ),
            },
          ]"
        />
      </template>
      <template #wxLiteConfig="{ row }">
        <TableAction
          :actions="[
            {
              size: 'small',
              icon: isChannelExists(
                row.channelCodes,
                PayChannelEnum.WX_LITE.code,
              )
                ? 'lucide:check'
                : 'lucide:x',
              type: !isChannelExists(
                row.channelCodes,
                PayChannelEnum.WX_LITE.code,
              )
                ? 'danger'
                : 'primary',
              circle: true,
              onClick: openChannelForm.bind(
                null,
                row,
                PayChannelEnum.WX_LITE.code,
              ),
            },
          ]"
        />
      </template>
      <template #wxPubConfig="{ row }">
        <TableAction
          :actions="[
            {
              size: 'small',
              icon: isChannelExists(
                row.channelCodes,
                PayChannelEnum.WX_PUB.code,
              )
                ? 'lucide:check'
                : 'lucide:x',
              type: !isChannelExists(
                row.channelCodes,
                PayChannelEnum.WX_PUB.code,
              )
                ? 'danger'
                : 'primary',
              circle: true,
              onClick: openChannelForm.bind(
                null,
                row,
                PayChannelEnum.WX_PUB.code,
              ),
            },
          ]"
        />
      </template>
      <template #wxAppConfig="{ row }">
        <TableAction
          :actions="[
            {
              size: 'small',
              icon: isChannelExists(
                row.channelCodes,
                PayChannelEnum.WX_APP.code,
              )
                ? 'lucide:check'
                : 'lucide:x',
              type: !isChannelExists(
                row.channelCodes,
                PayChannelEnum.WX_APP.code,
              )
                ? 'danger'
                : 'primary',
              circle: true,
              onClick: openChannelForm.bind(
                null,
                row,
                PayChannelEnum.WX_APP.code,
              ),
            },
          ]"
        />
      </template>
      <template #wxNativeConfig="{ row }">
        <TableAction
          :actions="[
            {
              size: 'small',
              icon: isChannelExists(
                row.channelCodes,
                PayChannelEnum.WX_NATIVE.code,
              )
                ? 'lucide:check'
                : 'lucide:x',
              type: !isChannelExists(
                row.channelCodes,
                PayChannelEnum.WX_NATIVE.code,
              )
                ? 'danger'
                : 'primary',
              circle: true,
              onClick: openChannelForm.bind(
                null,
                row,
                PayChannelEnum.WX_NATIVE.code,
              ),
            },
          ]"
        />
      </template>
      <template #wxWapConfig="{ row }">
        <TableAction
          :actions="[
            {
              size: 'small',
              icon: isChannelExists(
                row.channelCodes,
                PayChannelEnum.WX_WAP.code,
              )
                ? 'lucide:check'
                : 'lucide:x',
              type: !isChannelExists(
                row.channelCodes,
                PayChannelEnum.WX_WAP.code,
              )
                ? 'danger'
                : 'primary',
              circle: true,
              onClick: openChannelForm.bind(
                null,
                row,
                PayChannelEnum.WX_WAP.code,
              ),
            },
          ]"
        />
      </template>
      <template #wxBarConfig="{ row }">
        <TableAction
          :actions="[
            {
              size: 'small',
              icon: isChannelExists(
                row.channelCodes,
                PayChannelEnum.WX_BAR.code,
              )
                ? 'lucide:check'
                : 'lucide:x',
              type: !isChannelExists(
                row.channelCodes,
                PayChannelEnum.WX_BAR.code,
              )
                ? 'danger'
                : 'primary',
              circle: true,
              onClick: openChannelForm.bind(
                null,
                row,
                PayChannelEnum.WX_BAR.code,
              ),
            },
          ]"
        />
      </template>
      <template #walletConfig="{ row }">
        <TableAction
          :actions="[
            {
              size: 'small',
              icon: isChannelExists(
                row.channelCodes,
                PayChannelEnum.WALLET.code,
              )
                ? 'lucide:check'
                : 'lucide:x',
              type: !isChannelExists(
                row.channelCodes,
                PayChannelEnum.WALLET.code,
              )
                ? 'danger'
                : 'primary',
              circle: true,
              onClick: openChannelForm.bind(
                null,
                row,
                PayChannelEnum.WALLET.code,
              ),
            },
          ]"
        />
      </template>
      <template #mockConfig="{ row }">
        <TableAction
          :actions="[
            {
              size: 'small',
              icon: isChannelExists(row.channelCodes, PayChannelEnum.MOCK.code)
                ? 'lucide:check'
                : 'lucide:x',
              type: !isChannelExists(row.channelCodes, PayChannelEnum.MOCK.code)
                ? 'danger'
                : 'primary',
              circle: true,
              onClick: openChannelForm.bind(
                null,
                row,
                PayChannelEnum.MOCK.code,
              ),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
