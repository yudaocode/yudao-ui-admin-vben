<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { FmsVoucherApi } from '#/api/fms/voucher';

import { nextTick, reactive, ref } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInputNumber,
  ElMessage,
  ElRadio,
  ElRadioGroup,
} from 'element-plus';

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
const formRules = reactive<FormRules>({
  paperType: [
    { required: true, message: '请选择打印类型', trigger: 'change' },
    {
      validator: (_rule, _value, callback) => {
        if (
          formData.value.paperType !== 'CUSTOM' ||
          (formData.value.width && formData.value.height)
        ) {
          callback();
          return;
        }
        callback(new Error('请输入自定义纸张的宽度和长度'));
      },
      trigger: 'change',
    },
  ],
});
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
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
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
    ElMessage.warning('浏览器阻止了新窗口，请允许弹出窗口后重试');
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
  <ElDialog
    v-model="dialogVisible"
    class="[&_.el-form-item]:!mb-3 [&_.el-form-item__label]:!pb-0.5"
    title="凭证打印"
    width="500px"
    destroy-on-close
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
    >
      <ElFormItem label="打印类型" prop="paperType">
        <ElRadioGroup v-model="formData.paperType">
          <ElRadio value="A4">A4</ElRadio>
          <ElRadio value="B5">B5</ElRadio>
          <ElRadio value="CUSTOM">自定义纸张</ElRadio>
        </ElRadioGroup>
        <div
          v-if="formData.paperType === 'CUSTOM'"
          class="mt-2.5 flex items-center gap-5"
        >
          <div class="flex items-center gap-2 [&_.el-input-number]:!w-[72px]">
            <span>宽度</span>
            <ElInputNumber v-model="formData.width" :controls="false" :min="1" />
            <span>毫米</span>
          </div>
          <div class="flex items-center gap-2 [&_.el-input-number]:!w-[72px]">
            <span>长度</span>
            <ElInputNumber
              v-model="formData.height"
              :controls="false"
              :min="1"
            />
            <span>毫米</span>
          </div>
        </div>
      </ElFormItem>
      <ElFormItem label="图像方向">
        <ElRadioGroup v-model="formData.orientation">
          <ElRadio value="portrait">纵向</ElRadio>
          <ElRadio value="landscape">横向</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="边框调整">
        <div class="flex items-center gap-5">
          <div class="flex items-center gap-2 [&_.el-input-number]:!w-[72px]">
            <span>左</span>
            <ElInputNumber
              v-model="formData.marginLeft"
              :controls="false"
              :min="0"
            />
            <span>毫米</span>
          </div>
          <div class="flex items-center gap-2 [&_.el-input-number]:!w-[72px]">
            <span>上</span>
            <ElInputNumber
              v-model="formData.marginTop"
              :controls="false"
              :min="0"
            />
            <span>毫米</span>
          </div>
        </div>
      </ElFormItem>
      <ElFormItem label="字体大小">
        <div class="flex items-center gap-2 [&_.el-input-number]:!w-[72px]">
          <ElInputNumber
            v-model="formData.fontSize"
            :controls="false"
            :max="24"
            :min="12"
          />
          <span>像素</span>
        </div>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton type="primary" @click="submitForm">保存并打印</ElButton>
      <ElButton @click="dialogVisible = false">取 消</ElButton>
    </template>
  </ElDialog>
  <!-- 系统打印使用的隐藏 iframe -->
  <iframe
    ref="printIframeRef"
    class="pointer-events-none fixed -left-[9999px] top-0 h-px w-px border-0 opacity-0"
    title="凭证打印"
  ></iframe>
</template>
