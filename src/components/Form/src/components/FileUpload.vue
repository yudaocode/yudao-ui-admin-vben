<script lang="ts" setup>
import { Upload } from 'ant-design-vue'
import { computed, reactive, ref, unref, watch } from 'vue'
import { Icon } from '@/components/Icon'
import { getAccessToken, getTenantId } from '@/utils/auth'
import { propTypes } from '@/utils/propTypes'
import { useMessage } from '@/hooks/web/useMessage'
import { createImgPreview } from '@/components/Preview/index'
import { useAttrs } from '@/hooks/core/useAttrs'
import { useDesign } from '@/hooks/web/useDesign'
import { useGlobSetting } from '@/hooks/setting'

defineOptions({ name: 'FileUpload' })

const props = defineProps({
  value: propTypes.oneOfType([propTypes.string, propTypes.array]),
  text: propTypes.string.def('上传'),
  fileType: propTypes.oneOf(['all', 'image', 'file']).def('all'),

  uploadUrl: propTypes.string.def(useGlobSetting().uploadUrl),
  /* 这个属性用于控制文件上传的业务路径 */
  bizPath: propTypes.string.def('temp'),
  /**
   * 是否返回url，
   * true：仅返回url
   * false：返回fileName filePath fileSize
   */
  returnUrl: propTypes.bool.def(true),
  // 最大上传数量
  maxCount: propTypes.number.def(0),
  buttonOpen: propTypes.bool.def(true),
  multiple: propTypes.bool.def(true),
  // 是否显示左右移动按钮
  mover: propTypes.bool.def(true),
  // 是否显示下载按钮
  download: propTypes.bool.def(true),
  // 删除时是否显示确认框
  removeConfirm: propTypes.bool.def(false),
  beforeUpload: propTypes.func,
  disabled: propTypes.bool.def(false),
})
const emit = defineEmits(['change', 'update:value'])
const { createMessage, createConfirm } = useMessage()
const { prefixCls } = useDesign('upload')
const attrs = useAttrs()
const headers = reactive({
  'Authorization': `Bearer ${getAccessToken()}`,
  'tenant-id': getTenantId(),
})
const fileList = ref<any[]>([])
const uploadGoOn = ref<boolean>(true)
// refs
const containerRef = ref()
// 是否达到了最大上传数量
const isMaxCount = computed(() => props.maxCount > 0 && fileList.value.length >= props.maxCount)
// 当前是否是上传图片模式
const isImageMode = computed(() => props.fileType === 'image')
// 合并 props 和 attrs
const bindProps = computed(() => {
  // update-begin-author:liusq date:20220411 for: [issue/455]上传组件传入accept限制上传文件类型无效
  const bind: any = Object.assign({}, props, unref(attrs))
  // update-end-author:liusq date:20220411 for: [issue/455]上传组件传入accept限制上传文件类型无效

  bind.name = 'file'
  bind.listType = isImageMode.value ? 'picture-card' : 'text'
  bind.class = [bind.class, { 'upload-disabled': props.disabled }]
  bind.data = { biz: props.bizPath, ...bind.data }
  // update-begin-author:taoyan date:20220407 for: 自定义beforeUpload return false，并不能中断上传过程
  if (!bind.beforeUpload)
    bind.beforeUpload = onBeforeUpload

  // update-end-author:taoyan date:20220407 for: 自定义beforeUpload return false，并不能中断上传过程
  // 如果当前是图片上传模式，就只能上传图片
  if (isImageMode.value && !bind.accept)
    bind.accept = 'image/*'

  return bind
})

watch(
  () => props.value,
  (val) => {
    if (Array.isArray(val)) {
      if (props.returnUrl)
        parsePathsValue(val.join(','))
      else
        parseArrayValue(val)
    }
    else {
      parsePathsValue(val)
    }
  },
  { immediate: true },
)

// 解析数据库存储的逗号分割
function parsePathsValue(paths) {
  if (!paths || paths.length === 0) {
    fileList.value = []
    return
  }
  const list: any[] = []
  for (const item of paths.split(',')) {
    list.push({
      uid: uidGenerator(),
      name: getFileName(item),
      status: 'done',
      url: item,
      response: { status: 'history', message: item },
    })
  }
  fileList.value = list
}

// 解析数组值
function parseArrayValue(array) {
  if (!array || array.length === 0) {
    fileList.value = []
    return
  }
  const list: any[] = []
  for (const item of array) {
    list.push({
      uid: uidGenerator(),
      name: item.fileName,
      url: item.filePath,
      status: 'done',
      response: { status: 'history', message: item.filePath },
    })
  }
  fileList.value = list
}

// 文件上传之前的操作
function onBeforeUpload(file) {
  uploadGoOn.value = true
  if (isImageMode.value) {
    if (!file.type.includes('image')) {
      createMessage.warning('请上传图片')
      uploadGoOn.value = false
      return false
    }
  }
  // 扩展 beforeUpload 验证
  if (typeof props.beforeUpload === 'function')
    return props.beforeUpload(file)

  return true
}

// 删除处理事件
function onRemove() {
  if (props.removeConfirm) {
    return new Promise((resolve) => {
      createConfirm({
        title: '删除',
        content: `确定要删除这${isImageMode.value ? '张图片' : '个文件'}吗？`,
        iconType: 'warning',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
  }
  return true
}

// upload组件change事件
function onFileChange(info) {
  if (!info.file.status && uploadGoOn.value === false)
    info.fileList.pop()

  let fileListTemp = info.fileList
  // 限制最大上传数
  if (props.maxCount > 0) {
    const count = fileListTemp.length
    if (count >= props.maxCount) {
      const diffNum = props.maxCount - fileListTemp.length
      if (diffNum >= 0)
        fileListTemp = fileListTemp.slice(-props.maxCount)
      else
        return
    }
  }
  if (info.file.status === 'done') {
    let successFileList = []
    if (info.file.response.success) {
      successFileList = fileListTemp.map((file) => {
        if (file.response) {
          const reUrl = file.response.message
          file.url = reUrl
        }
        return file
      })
    }
    else {
      successFileList = fileListTemp.filter((item) => {
        return item.uid !== info.file.uid
      })
      createMessage.error(`${info.file.name} 上传失败.`)
    }
    fileListTemp = successFileList
  }
  else if (info.file.status === 'error') {
    createMessage.error(`${info.file.name} 上传失败.`)
  }
  fileList.value = fileListTemp
  if (info.file.status === 'done' || info.file.status === 'removed') {
    // returnUrl为true时仅返回文件路径
    if (props.returnUrl) {
      handlePathChange()
    }
    else {
      // returnUrl为false时返回文件名称、文件路径及文件大小
      const newFileList: any[] = []
      for (const item of fileListTemp) {
        if (item.status === 'done') {
          const fileJson = {
            fileName: item.name,
            filePath: item.response.message,
            fileSize: item.size,
          }
          newFileList.push(fileJson)
        }
        else {
          return
        }
      }
      emitValue(newFileList)
    }
  }
}

function handlePathChange() {
  const uploadFiles = fileList.value
  let path = ''
  if (!uploadFiles || uploadFiles.length === 0)
    path = ''

  const pathList: string[] = []
  for (const item of uploadFiles) {
    if (item.status === 'done')
      pathList.push(item.response.data)
    else
      return
  }
  if (pathList.length > 0)
    path = pathList.join(',')

  emitValue(path)
}

// 预览文件、图片
function onFilePreview(file) {
  if (isImageMode.value)
    createImgPreview({ imageList: [file.url], maskClosable: true })
  else
    window.open(file.url)
}

function emitValue(value) {
  emit('change', value)
  emit('update:value', value)
}

function uidGenerator() {
  return `-${Number.parseInt((Math.random() * 10000 + 1, 10).toString())}`
}

function getFileName(path) {
  if (path.lastIndexOf('\\') >= 0) {
    const reg = /\\/g
    path = path.replace(reg, '/')
  }
  return path.substring(path.lastIndexOf('/') + 1)
}
</script>

<template>
  <div ref="containerRef" :class="`${prefixCls}-container`">
    <Upload
      :headers="headers"
      :multiple="multiple"
      :action="uploadUrl as any"
      :file-list="fileList"
      :disabled="disabled"
      v-bind="bindProps"
      @remove="onRemove as any"
      @change="onFileChange"
      @preview="onFilePreview"
    >
      <template v-if="isImageMode">
        <div v-if="!isMaxCount">
          <Icon icon="ant-design:plus-outlined" />
          <div class="ant-upload-text">
            {{ text }}
          </div>
        </div>
      </template>
      <a-button v-else-if="buttonOpen" :disabled="isMaxCount || disabled">
        <Icon icon="ant-design:upload-outlined" />
        <span>{{ text }}</span>
      </a-button>
    </Upload>
  </div>
</template>

<style lang="less">
//noinspection LessUnresolvedVariable
@prefix-cls: ~'@{namespace}-upload';

.@{prefix-cls} {
  &-container {
    position: relative;

    .upload-disabled {
      .ant-upload-list-item {
        .anticon-close {
          display: none;
        }

        .anticon-delete {
          display: none;
        }
      }

      /* update-begin-author:taoyan date:2022-5-24 for:VUEN-1093详情界面 图片下载按钮显示不全 */
      .upload-download-handler {
        right: 6px !important;
      }

      /* update-end-author:taoyan date:2022-5-24 for:VUEN-1093详情界面 图片下载按钮显示不全 */
    }

    .ant-upload-list-item {
      .upload-actions-container {
        position: absolute;
        top: -31px;
        left: -18px;
        z-index: 11;
        width: 84px;
        height: 84px;
        line-height: 28px;
        text-align: center;
        pointer-events: none;

        a {
          margin: 0 5px;
          cursor: pointer;
          opacity: 0.9;
          transition: opacity 0.3s;

          .anticon {
            font-size: 16px;
            color: #fff;
          }

          &:hover {
            opacity: 1;
          }
        }

        .upload-mover-handler,
        .upload-download-handler {
          position: absolute;
          pointer-events: auto;
        }

        .upload-mover-handler {
          bottom: 0;
          width: 100%;
        }

        .upload-download-handler {
          top: -4px;
          right: -4px;
        }
      }
    }
  }
}
</style>
