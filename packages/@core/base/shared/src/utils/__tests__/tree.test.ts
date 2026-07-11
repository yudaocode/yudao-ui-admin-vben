import { describe, expect, it } from 'vitest';

import {
  filterTree,
  getTreeCheckedValues,
  getTreeValuesWithAncestors,
  mapTree,
  traverseTreeValues,
} from '../tree';

describe('traverseTreeValues', () => {
  interface Node {
    children?: Node[];
    name: string;
  }

  type NodeValue = string;

  const sampleTree: Node[] = [
    {
      name: 'A',
      children: [
        { name: 'B' },
        {
          name: 'C',
          children: [{ name: 'D' }, { name: 'E' }],
        },
      ],
    },
    {
      name: 'F',
      children: [
        { name: 'G' },
        {
          name: 'H',
          children: [{ name: 'I' }],
        },
      ],
    },
  ];

  it('traverses tree and returns all node values', () => {
    const values = traverseTreeValues<Node, NodeValue>(
      sampleTree,
      (node) => node.name,
      {
        childProps: 'children',
      },
    );
    expect(values).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
  });

  it('handles empty tree', () => {
    const values = traverseTreeValues<Node, NodeValue>([], (node) => node.name);
    expect(values).toEqual([]);
  });

  it('handles tree with only root node', () => {
    const rootNode = { name: 'A' };
    const values = traverseTreeValues<Node, NodeValue>(
      [rootNode],
      (node) => node.name,
    );
    expect(values).toEqual(['A']);
  });

  it('handles tree with only leaf nodes', () => {
    const leafNodes = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
    const values = traverseTreeValues<Node, NodeValue>(
      leafNodes,
      (node) => node.name,
    );
    expect(values).toEqual(['A', 'B', 'C']);
  });
});

describe('getTreeValuesWithAncestors', () => {
  const tree = [
    {
      id: 1,
      children: [
        { id: 2 },
        {
          id: 3,
          children: [{ id: 4 }, { id: 5 }],
        },
      ],
    },
    { id: 6 },
  ];

  it('handles empty trees and selections', () => {
    expect(getTreeValuesWithAncestors(tree, [], (node) => node.id)).toEqual([]);
    expect(
      getTreeValuesWithAncestors<{ id: number }, number>(
        [],
        [1],
        (node) => node.id,
      ),
    ).toEqual([1]);
  });

  it('includes every ancestor of a selected node', () => {
    expect(getTreeValuesWithAncestors(tree, [4], (node) => node.id)).toEqual([
      4, 1, 3,
    ]);
  });

  it('deduplicates selected values and shared ancestors', () => {
    expect(
      getTreeValuesWithAncestors(tree, [4, 5, 4], (node) => node.id),
    ).toEqual([4, 5, 1, 3]);
  });

  it('keeps ancestor-complete selections unchanged', () => {
    const values = [1, 2, 3, 4, 5];
    expect(getTreeValuesWithAncestors(tree, values, (node) => node.id)).toEqual(
      values,
    );
  });

  it('does not add descendants when only a parent is selected', () => {
    expect(getTreeValuesWithAncestors(tree, [3], (node) => node.id)).toEqual([
      3, 1,
    ]);
  });

  it('preserves falsy and unknown selected values', () => {
    const treeWithZeroId = [{ id: 0, children: [{ id: 1 }] }];
    expect(
      getTreeValuesWithAncestors(treeWithZeroId, [1, 999], (node) => node.id),
    ).toEqual([1, 999, 0]);
  });

  it('does not mutate the tree or selected values', () => {
    const values = [4];
    const treeSnapshot = structuredClone(tree);
    getTreeValuesWithAncestors(tree, values, (node) => node.id);
    expect(values).toEqual([4]);
    expect(tree).toEqual(treeSnapshot);
  });

  it('supports a custom children property', () => {
    const customTree = [
      {
        key: 'root',
        items: [{ key: 'leaf' }],
      },
    ];
    expect(
      getTreeValuesWithAncestors(customTree, ['leaf'], (node) => node.key, {
        childProps: 'items',
      }),
    ).toEqual(['leaf', 'root']);
  });
});

describe('getTreeCheckedValues', () => {
  const tree = [
    {
      id: 1,
      children: [
        { id: 2 },
        {
          id: 3,
          children: [{ id: 4 }, { id: 5 }],
        },
      ],
    },
  ];

  it('removes half-selected ancestors', () => {
    expect(getTreeCheckedValues(tree, [1, 2], (node) => node.id)).toEqual([2]);
  });

  it('keeps a fully selected branch under a half-selected ancestor', () => {
    expect(getTreeCheckedValues(tree, [1, 3, 4, 5], (node) => node.id)).toEqual(
      [3, 4, 5],
    );
  });

  it('keeps an ancestor-complete selection unchanged', () => {
    const values = [1, 2, 3, 4, 5];
    expect(getTreeCheckedValues(tree, values, (node) => node.id)).toEqual(
      values,
    );
  });

  it('keeps an explicitly selected parent without selected descendants', () => {
    expect(getTreeCheckedValues(tree, [1], (node) => node.id)).toEqual([1]);
  });

  it('restores missing parents when all descendants are selected', () => {
    expect(getTreeCheckedValues(tree, [2, 4, 5], (node) => node.id)).toEqual([
      2, 4, 5, 3, 1,
    ]);
  });

  it('round-trips persisted checked and half-selected values', () => {
    const persistedValues = [1, 3, 4, 5];
    const checkedValues = getTreeCheckedValues(
      tree,
      persistedValues,
      (node) => node.id,
    );
    const submittedValues = getTreeValuesWithAncestors(
      tree,
      checkedValues,
      (node) => node.id,
    );
    expect(new Set(submittedValues)).toEqual(new Set(persistedValues));
  });

  it('drops unknown values and supports falsy node values', () => {
    const treeWithZeroId = [{ id: 0, children: [{ id: 1 }, { id: 2 }] }];
    expect(
      getTreeCheckedValues(treeWithZeroId, [0, 1, 999], (node) => node.id),
    ).toEqual([1]);
  });

  it('supports a custom children property', () => {
    const customTree = [
      {
        key: 'root',
        items: [{ key: 'leaf' }],
      },
    ];
    expect(
      getTreeCheckedValues(customTree, ['root', 'leaf'], (node) => node.key, {
        childProps: 'items',
      }),
    ).toEqual(['root', 'leaf']);
  });

  it('does not mutate the tree or selected values', () => {
    const values = [1, 2];
    const treeSnapshot = structuredClone(tree);
    getTreeCheckedValues(tree, values, (node) => node.id);
    expect(values).toEqual([1, 2]);
    expect(tree).toEqual(treeSnapshot);
  });
});

describe('filterTree', () => {
  const tree = [
    {
      id: 1,
      children: [
        { id: 2 },
        { id: 3, children: [{ id: 4 }, { id: 5 }, { id: 6 }] },
        { id: 7 },
      ],
    },
    { id: 8, children: [{ id: 9 }, { id: 10 }] },
    { id: 11 },
  ];

  it('should return all nodes when condition is always true', () => {
    const result = filterTree(tree, () => true, { childProps: 'children' });
    expect(result).toEqual(tree);
  });

  it('should return only root nodes when condition is always false', () => {
    const result = filterTree(tree, () => false);
    expect(result).toEqual([]);
  });

  it('should return nodes with even id values', () => {
    const result = filterTree(tree, (node) => node.id % 2 === 0);
    expect(result).toEqual([{ id: 8, children: [{ id: 10 }] }]);
  });

  it('should return nodes with odd id values and their ancestors', () => {
    const result = filterTree(tree, (node) => node.id % 2 === 1);
    expect(result).toEqual([
      {
        id: 1,
        children: [{ id: 3, children: [{ id: 5 }] }, { id: 7 }],
      },
      { id: 11 },
    ]);
  });

  it('should return nodes with "leaf" in their name', () => {
    const tree = [
      {
        name: 'root',
        children: [
          { name: 'leaf 1' },
          {
            name: 'branch',
            children: [{ name: 'leaf 2' }, { name: 'leaf 3' }],
          },
          { name: 'leaf 4' },
        ],
      },
    ];
    const result = filterTree(
      tree,
      (node) => node.name.includes('leaf') || node.name === 'root',
    );
    expect(result).toEqual([
      {
        name: 'root',
        children: [{ name: 'leaf 1' }, { name: 'leaf 4' }],
      },
    ]);
  });
});

describe('mapTree', () => {
  it('map infinite depth tree using mapTree', () => {
    const tree = [
      {
        id: 1,
        name: 'node1',
        children: [
          { id: 2, name: 'node2' },
          { id: 3, name: 'node3' },
          {
            id: 4,
            name: 'node4',
            children: [
              {
                id: 5,
                name: 'node5',
                children: [
                  { id: 6, name: 'node6' },
                  { id: 7, name: 'node7' },
                ],
              },
              { id: 8, name: 'node8' },
            ],
          },
        ],
      },
    ];
    const newTree = mapTree(tree, (node) => ({
      ...node,
      name: `${node.name}-new`,
    }));

    expect(newTree).toEqual([
      {
        id: 1,
        name: 'node1-new',
        children: [
          { id: 2, name: 'node2-new' },
          { id: 3, name: 'node3-new' },
          {
            id: 4,
            name: 'node4-new',
            children: [
              {
                id: 5,
                name: 'node5-new',
                children: [
                  { id: 6, name: 'node6-new' },
                  { id: 7, name: 'node7-new' },
                ],
              },
              { id: 8, name: 'node8-new' },
            ],
          },
        ],
      },
    ]);
  });
});
