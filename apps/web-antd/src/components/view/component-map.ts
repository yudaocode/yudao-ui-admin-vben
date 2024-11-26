import type { Component } from 'vue';

import { toPascalCase } from '#/util/tool';

const componentMap = new Map<string, Component>();
// import.meta.glob() 直接引入所有的模块 Vite 独有的功能
const modules = import.meta.glob('./components/**/*.vue', { eager: true });
// 加入到路由集合中
Object.keys(modules).forEach((key) => {
  if (!key.includes('-ignore')) {
    const mod = (modules as any)[key].default || {};
    // ./components/ApiDict.vue
    // 获取ApiDict
    const compName = key.replace('./components/', '').replace('.vue', '');
    componentMap.set(toPascalCase(compName), mod);
  }
});

export function add(compName: string, component: Component) {
  componentMap.set(compName, component);
}

export function del(compName: string) {
  componentMap.delete(compName);
}

export { componentMap };
