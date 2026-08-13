<script lang="ts" setup>
import type { FormInstance, FormProps } from 'ant-design-vue';

import type { FmsVoucherApi } from '#/api/fms/voucher';

import { nextTick, ref } from 'vue';

import {
  Button,
  Form,
  FormItem,
  InputNumber,
  message,
  Modal,
  Radio,
} from 'ant-design-vue';

import {
  buildVoucherPrintHtml,
  DEFAULT_VOUCHER_PRINT_SETTING,
  type VoucherPrintSetting,
} from './print';

defineOptions({ name: 'FmsVoucherPrintForm' });

const dialogVisible = ref(false); // 弹窗的是否展示
const accountSetId = ref(0); // 账套编号
const companyName = ref(''); // 公司名称
const vouchers = ref<FmsVoucherApi.Voucher[]>([]); // 待打印凭证列表
const formData = ref<VoucherPrintSetting>({
  ...DEFAULT_VOUCHER_PRINT_SETTING,
}); // 打印设置
const formRules: FormProps['rules'] = {
  paperType: [
    { required: true, message: '请选择打印类型', trigger: 'change' },
    {
      validator: (_rule, _value, callback: (error?: string) => void) => {
        if (
          formData.value.paperType !== 'CUSTOM' ||
          (formData.value.width && formData.value.height)
        ) {
          callback();
          return;
        }
        callback('请输入自定义纸张的宽度和长度');
      },
      trigger: 'change',
    },
  ],
};
const formRef = ref<FormInstance>(); // 表单 Ref
const printIframeRef = ref<HTMLIFrameElement>(); // 打印 iframe Ref

/** 打开凭证打印弹窗 */
function open(
  accountId: number,
  accountCompanyName: string,
  voucherList: FmsVoucherApi.Voucher[],
) {
  // 初始化待打印凭证和打印设置
  accountSetId.value = accountId;
  companyName.value = accountCompanyName;
  vouchers.value = voucherList;
  formData.value = {
    ...DEFAULT_VOUCHER_PRINT_SETTING,
    ...loadPrintSetting(accountId),
  };
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

/** 提交凭证打印 */
async function submitForm() {
  // 校验打印设置
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  // 保存当前账套的打印设置并调用系统打印
  savePrintSetting(accountSetId.value, formData.value);
  await printHtml(
    buildVoucherPrintHtml(companyName.value, vouchers.value, formData.value),
  );
  dialogVisible.value = false;
}

/** 直接打印 HTML */
async function printHtml(html: string) {
  // 将完整打印文档写入隐藏 iframe
  const printDocument = printIframeRef.value?.contentDocument;
  const printWindow = printIframeRef.value?.contentWindow;
  if (!printDocument || !printWindow) return;
  printDocument.open();
  printDocument.write(html);
  printDocument.close();
  // 等待字体完成加载，避免系统打印预览中的文字错位
  await printDocument.fonts?.ready;
  printWindow.focus();
  printWindow.print();
}

/** 在新窗口打开凭证列表预览，供不带版式设置的列表打印使用 */
function previewHtml(html: string) {
  const previewWindow = window.open('', '_blank');
  if (!previewWindow) {
    message.warning('浏览器阻止了新窗口，请允许弹出窗口后重试');
    return;
  }
  previewWindow.document.open();
  previewWindow.document.write(html);
  previewWindow.document.close();
  previewWindow.focus();
}

/** 读取当前账套的打印设置缓存 */
function loadPrintSetting(accountId: number): Partial<VoucherPrintSetting> {
  try {
    const cached = localStorage.getItem(getStorageKey(accountId));
    return cached ? (JSON.parse(cached) as Partial<VoucherPrintSetting>) : {};
  } catch {
    return {};
  }
}

/** 写入当前账套的打印设置缓存 */
function savePrintSetting(accountId: number, setting: VoucherPrintSetting) {
  localStorage.setItem(getStorageKey(accountId), JSON.stringify(setting));
}

/** 获得凭证打印设置缓存键 */
function getStorageKey(accountId: number) {
  return `fmsVoucherPrintSetting:${accountId}`;
}

defineExpose({ open, printHtml, previewHtml });
</script>

<template>
  <!-- 凭证打印设置 -->
  <Modal
    v-model:open="dialogVisible"
    class="[&_.ant-form-item]:!mb-3"
    title="凭证打印"
    width="500px"
    destroy-on-close
  >
    <Form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
      <FormItem label="打印类型" name="paperType">
        <Radio.Group v-model:value="formData.paperType">
          <Radio value="A4">A4</Radio>
          <Radio value="B5">B5</Radio>
          <Radio value="CUSTOM">自定义纸张</Radio>
        </Radio.Group>
        <div
          v-if="formData.paperType === 'CUSTOM'"
          class="mt-2.5 flex items-center gap-5"
        >
          <div class="flex items-center gap-2 [&_.ant-input-number]:!w-[72px]">
            <span>宽度</span>
            <InputNumber v-model:value="formData.width" :min="1" />
            <span>毫米</span>
          </div>
          <div class="flex items-center gap-2 [&_.ant-input-number]:!w-[72px]">
            <span>长度</span>
            <InputNumber v-model:value="formData.height" :min="1" />
            <span>毫米</span>
          </div>
        </div>
      </FormItem>
      <FormItem label="图像方向">
        <Radio.Group v-model:value="formData.orientation">
          <Radio value="portrait">纵向</Radio>
          <Radio value="landscape">横向</Radio>
        </Radio.Group>
      </FormItem>
      <FormItem label="边框调整">
        <div class="flex items-center gap-5">
          <div class="flex items-center gap-2 [&_.ant-input-number]:!w-[72px]">
            <span>左</span>
            <InputNumber v-model:value="formData.marginLeft" :min="0" />
            <span>毫米</span>
          </div>
          <div class="flex items-center gap-2 [&_.ant-input-number]:!w-[72px]">
            <span>上</span>
            <InputNumber v-model:value="formData.marginTop" :min="0" />
            <span>毫米</span>
          </div>
        </div>
      </FormItem>
      <FormItem label="字体大小">
        <div class="flex items-center gap-2 [&_.ant-input-number]:!w-[72px]">
          <InputNumber
            v-model:value="formData.fontSize"
            :max="24"
            :min="12"
          />
          <span>像素</span>
        </div>
      </FormItem>
    </Form>
    <template #footer>
      <Button type="primary" @click="submitForm">保存并打印</Button>
      <Button @click="dialogVisible = false">取 消</Button>
    </template>
  </Modal>
  <!-- 系统打印使用的隐藏 iframe -->
  <iframe
    ref="printIframeRef"
    class="pointer-events-none fixed -left-[9999px] top-0 h-px w-px border-0 opacity-0"
    title="凭证打印"
  ></iframe>
</template>
