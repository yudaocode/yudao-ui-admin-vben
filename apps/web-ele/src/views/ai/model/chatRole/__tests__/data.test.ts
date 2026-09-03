import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useFormSchema } from '../data';

describe('web-ele chat role form schema', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('uses Element Plus multiple props for collection selectors', () => {
    const schema = useFormSchema();
    const fields = ['knowledgeIds', 'toolIds', 'mcpClientNames'];

    for (const fieldName of fields) {
      const field = schema.find((item) => item.fieldName === fieldName);
      expect(field?.componentProps).toMatchObject({ multiple: true });
      expect(field?.componentProps).not.toHaveProperty('mode');
    }
  });
});
