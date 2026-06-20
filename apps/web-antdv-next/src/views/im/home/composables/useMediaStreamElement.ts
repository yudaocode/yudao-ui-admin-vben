import { ref, type VNodeRef, watch } from 'vue'

/**
 * 把响应式 MediaStream 挂到 `<video>` / `<audio>` 元素的 srcObject 上；
 * stream 为空时清掉 srcObject，避免设备关闭后画面卡在最后一帧
 */
export function useMediaStreamElement<T extends HTMLMediaElement>(
  streamSource: () => MediaStream | null | undefined
): VNodeRef {
  const elRef = ref<T>()
  const syncStream = (stream = streamSource()) => {
    if (elRef.value) {
      elRef.value.srcObject = stream || null
    }
  }
  watch(
    streamSource,
    (stream) => {
      syncStream(stream)
    },
    { flush: 'post', immediate: true }
  )
  return (el) => {
    elRef.value = el instanceof HTMLMediaElement ? (el as T) : undefined
    syncStream()
  }
}
