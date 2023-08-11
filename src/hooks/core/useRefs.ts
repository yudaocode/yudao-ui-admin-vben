import type { Ref } from 'vue'
import { onBeforeUpdate, ref } from 'vue'

function useRefs<T = HTMLElement>(): { refs: Ref<T[]>; setRefs: (index: number) => (el: T) => void } {
  const refs = ref([]) as Ref<T[]>

  onBeforeUpdate(() => {
    refs.value = []
  })

  const setRefs = (index: number) => (el: T) => {
    refs.value[index] = el
  }

  return {
    refs,
    setRefs,
  }
}
export { useRefs }
