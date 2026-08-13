<script lang="ts" setup>
import type { FmsVoucherApi } from '#/api/fms/voucher';

import { ref } from 'vue';

import { useAccess } from '@vben/access';

import { Button, Empty, message, Modal } from 'antdv-next';

import { updateVoucherAttachments } from '#/api/fms/voucher';
import { FileUpload } from '#/components/upload';
import { useFmsStore } from '#/views/fms/store/fms';
import {
  FMS_VOUCHER_ATTACHMENT_FILE_TYPES,
  FMS_VOUCHER_STATUS,
} from '#/views/fms/utils/constants';

defineOptions({ name: 'FmsVoucherAttachmentForm' });

const emit = defineEmits<{ success: [] }>();

const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS 状态

const dialogVisible = ref(false); // 弹窗的是否展示
const formLoading = ref(false); // 表单的提交中
const accountSetId = ref(0); // 账套编号
const voucherId = ref(0); // 凭证编号
const attachmentUrls = ref<string[]>([]); // 附件地址列表
const editable = ref(false); // 附件的是否可编辑

/** 打开凭证附件弹窗 */
function open(currentAccountSetId: number, voucher: FmsVoucherApi.Voucher) {
  // 回显凭证附件，并按凭证状态和权限判断是否可编辑
  accountSetId.value = currentAccountSetId;
  voucherId.value = voucher.id;
  attachmentUrls.value = [...voucher.attachmentUrls];
  editable.value =
    fmsStore.isAccountSetWritable &&
    voucher.status === FMS_VOUCHER_STATUS.PENDING_REVIEW &&
    !voucher.closingGenerated &&
    hasAccessByCodes(['fms:voucher:update']);
  dialogVisible.value = true;
}
defineExpose({ open });

/** 提交凭证附件 */
async function submitForm() {
  // 提交附件保存
  formLoading.value = true;
  try {
    await updateVoucherAttachments({
      id: voucherId.value,
      accountSetId: accountSetId.value,
      attachmentUrls: attachmentUrls.value,
    });
    message.success('附件保存成功');
    dialogVisible.value = false;
    // 发送操作成功的事件
    emit('success');
  } finally {
    formLoading.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="dialogVisible"
    title="凭证附件"
    width="570px"
    destroy-on-close
  >
    <FileUpload
      v-if="editable || attachmentUrls.length"
      v-model="attachmentUrls"
      :accept="FMS_VOUCHER_ATTACHMENT_FILE_TYPES"
      :disabled="!editable"
      :max-number="100"
      multiple
    />
    <Empty v-else description="暂无附件" />
    <template #footer>
      <template v-if="editable">
        <Button @click="dialogVisible = false">取 消</Button>
        <Button :loading="formLoading" type="primary" @click="submitForm">
          保 存
        </Button>
      </template>
      <Button v-else type="primary" @click="dialogVisible = false">
        确 定
      </Button>
    </template>
  </Modal>
</template>
