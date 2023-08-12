<script lang="ts" setup>
import { ref, unref } from 'vue'
import { Card, Tabs } from 'ant-design-vue'
import { useClipboard } from '@vueuse/core'
import { BasicTree } from '@/components/Tree'
import { BasicModal, useModalInner } from '@/components/Modal'
import { CodeEditor, MODE } from '@/components/CodeEditor'
import { previewCodegen } from '@/api/infra/codegen'
import type { CodegenPreviewVO } from '@/api/infra/codegen/types'
import { handleTree2 } from '@/utils/tree'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'InfraPreviewModal' })

const { createMessage } = useMessage()

const fileTree = ref([])
const activeKey = ref('')
const modeValue = ref(MODE.JS)
const previewCodes = ref<CodegenPreviewVO[]>()

const [registerModal, { setModalProps }] = useModalInner(async (data) => {
  setModalProps({ confirmLoading: false })

  const res = await previewCodegen(data.record.id)
  const file = handleFiles(res)
  previewCodes.value = res
  activeKey.value = res[0].filePath
  fileTree.value = handleTree2(file, 'id', 'parentId', 'children', '/')
})

function handleSelect(keys) {
  activeKey.value = keys[0]
}

/** 生成 files 目录 **/
interface filesType {
  id: string
  label: string
  parentId: string
}

function handleFiles(datas) {
  const exists = {} // key：file 的 id；value：true
  const files: filesType[] = []
  // 遍历每个元素
  for (const data of datas) {
    let paths = data.filePath.split('/')
    let fullPath = '' // 从头开始的路径，用于生成 id
    // 特殊处理 java 文件
    if (paths[paths.length - 1].includes('.java')) {
      const newPaths: string[] = []
      for (let i = 0; i < paths.length; i++) {
        let path = paths[i]
        if (path !== 'java') {
          newPaths.push(path)
          continue
        }
        newPaths.push(path)
        // 特殊处理中间的 package，进行合并
        let tmp = ''
        while (i < paths.length) {
          path = paths[i + 1]
          if (
            path === 'controller'
            || path === 'convert'
            || path === 'dal'
            || path === 'enums'
            || path === 'service'
            || path === 'vo' // 下面三个，主要是兜底。可能考虑到有人改了包结构
            || path === 'mysql'
            || path === 'dataobject'
          )
            break

          tmp = tmp ? `${tmp}.${path}` : path
          i++
        }
        if (tmp)
          newPaths.push(tmp)
      }
      paths = newPaths
    }
    // 遍历每个 path， 拼接成树
    for (let i = 0; i < paths.length; i++) {
      // 已经添加到 files 中，则跳过
      const oldFullPath = fullPath
      // 下面的 replaceAll 的原因，是因为上面包处理了，导致和 tabs 不匹配，所以 replaceAll 下
      fullPath = fullPath.length === 0 ? paths[i] : `${fullPath.replaceAll('.', '/')}/${paths[i]}`
      if (exists[fullPath])
        continue

      // 添加到 files 中
      exists[fullPath] = true
      files.push({
        id: fullPath,
        label: paths[i],
        parentId: oldFullPath || '/', // "/" 为根节点
      })
    }
  }
  return files
}

/** 复制 **/
async function copy(text: string) {
  const { copy, copied, isSupported } = useClipboard({ source: text })
  if (!isSupported) {
    createMessage.error('复制失败')
  }
  else {
    await copy()
    if (unref(copied))
      createMessage.success('复制成功')
  }
}
</script>

<template>
  <BasicModal v-bind="$attrs" :default-fullscreen="true" title="预览代码" @register="registerModal">
    <div class="flex">
      <Card class="w-1/4 min-w-130">
        <BasicTree
          title="文件夹列表" toolbar :default-expand-all="true" tree-wrapper-class-name="h-[800px] overflow-auto"
          :click-row-to-expand="false" :tree-data="fileTree" :field-names="{ key: 'id', title: 'label' }"
          @select="handleSelect"
        />
      </Card>
      <Card class="w-3/4">
        <Tabs v-model:activeKey="activeKey">
          <Tabs.TabPane
            v-for="item in previewCodes" :key="item.filePath"
            :tab="item.filePath.substring(item.filePath.lastIndexOf('/') + 1)"
          >
            <a-button type="link" style="float: right; padding: 4px 60px;" @click="copy(item.code)">
              复制
            </a-button>
            <CodeEditor class="max-h-200" :value="item.code" :mode="modeValue" :readonly="true" />
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  </BasicModal>
</template>
