import { describe, expect, it } from 'vitest';

import routes from '../modules/dashboard';

describe('web-ele dashboard routes', () => {
  it('仅暴露分析页，不显示示例工作台入口', () => {
    const dashboard = routes.find((route) => route.name === 'Dashboard');
    const childNames = dashboard?.children?.map((child) => child.name) ?? [];

    expect(childNames).toEqual(['Analytics']);
    expect(childNames).not.toContain('Workspace');
  });
});
