<!-- 图片选择 -->
<script lang="ts" setup>
import message from 'ant-design-vue';

import * as FileApi from '#/api/infra/file';
import Picture from '#/views/mall/promotion/kefu/asserts/picture.svg';

defineOptions({ name: 'PictureSelectUpload' });

/** 选择并上传文件 */
const emits = defineEmits<{
  (e: 'sendPicture', v: string): void;
}>();
const selectAndUpload = async () => {
  const files: any = await getFiles();
  message.success('图片发送中请稍等。。。');
  const res = await FileApi.updateFile({ file: files[0].file });
  emits('sendPicture', res.data);
};

/**
 * 唤起文件选择窗口，并获取选择的文件
 *
 * @param {object} options - 配置选项
 * @param {boolean} [options.multiple] - 是否支持多选
 * @param {string} [options.accept] - 文件上传格式限制
 * @param {number} [options.limit] - 单次上传最大文件数
 * @param {number} [options.fileSize] - 单个文件大小限制（单位：MB）
 * @returns {Promise<Array>} 选择的文件列表，每个文件带有一个uid
 */
async function getFiles(options = {}) {
  const { multiple, accept, limit, fileSize } = {
    multiple: true,
    accept: 'image/jpeg, image/png, image/gif', // 默认选择图片
    limit: 1,
    fileSize: 500,
    ...options,
  };

  // 创建文件选择元素
  const input = document.createElement('input');
  input.type = 'file';
  input.style.display = 'none';
  if (multiple) input.multiple = true;
  if (accept) input.accept = accept;

  // 将文件选择元素添加到文档中
  document.body.append(input);

  // 触发文件选择元素的点击事件
  input.click();

  // 等待文件选择元素的 change 事件
  // 移除不必要的 try/catch 包装，直接返回 Promise
  return await new Promise((resolve, reject) => {
    input.addEventListener('change', (event: any) => {
      const filesArray = [...(event?.target?.files || [])];

      // 从文档中移除文件选择元素
      input.remove();

      // 判断是否超出上传数量限制
      if (filesArray.length > limit) {
        // 使用 Error 对象作为 reject 的原因
        reject(new Error(`超出上传数量限制，最多允许 ${limit} 个文件`));
        return;
      }

      // 判断是否超出上传文件大小限制
      const overSizedFiles = filesArray.filter(
        (file: File) => file.size / 1024 ** 2 > fileSize,
      );
      if (overSizedFiles.length > 0) {
        // 使用 Error 对象作为 reject 的原因
        reject(new Error(`文件大小超出限制，单个文件最大允许 ${fileSize}MB`));
        return;
      }

      // 生成文件列表，并添加 uid
      const fileList = filesArray.map((file, index) => ({
        file,
        uid: Date.now() + index,
      }));
      resolve(fileList);
    });
  });
}
</script>

<template>
  <div>
    <img :src="Picture" class="h-[35px] w-[35px]" @click="selectAndUpload" />
  </div>
</template>

<style lang="scss" scoped></style>
