import { tryOnUnmounted } from '@vueuse/core'
import type { Component } from 'vue'
import type { ComponentType } from '../types'
import { add, del } from '../componentMap'

export function useComponentRegister(compName: ComponentType, comp: Component) {
  add(compName, comp)
  tryOnUnmounted(() => {
    del(compName)
  })
}
