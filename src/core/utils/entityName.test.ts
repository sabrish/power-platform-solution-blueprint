import { describe, expect, it } from 'vitest';
import { createEntityNameResolver, extractPublisherPrefix, resolveEntityName } from './entityName.js';

describe('resolveEntityName', () => {
  it.each([null, undefined, '', '   ', 'none', 'NONE', ' None '])('returns null for %p', (value) => {
    expect(resolveEntityName(value)).toBeNull();
  });

  it('returns the trimmed name otherwise', () => {
    expect(resolveEntityName('  account ')).toBe('account');
  });
});

describe('extractPublisherPrefix', () => {
  it('returns the prefix before the first underscore', () => {
    expect(extractPublisherPrefix('new_Account')).toBe('new');
  });

  it('returns an empty string when there is no prefix', () => {
    expect(extractPublisherPrefix('account')).toBe('');
  });
});

describe('createEntityNameResolver', () => {
  const entities = [
    { LogicalName: 'account', EntitySetName: 'accounts' },
    { LogicalName: 'contact', EntitySetName: 'contacts' },
    { LogicalName: 'cr123_Project', EntitySetName: 'cr123_projects' },
  ];

  describe('resolve', () => {
    const resolver = createEntityNameResolver(entities);

    it('maps an entity set name to its logical name', () => {
      expect(resolver.resolve('accounts')).toBe('account');
    });

    it('is case-insensitive and trims whitespace', () => {
      expect(resolver.resolve(' CR123_Projects ')).toBe('cr123_project');
      expect(resolver.resolve('ACCOUNT')).toBe('account');
    });

    it('returns an in-scope logical name unchanged', () => {
      expect(resolver.resolve('contact')).toBe('contact');
    });

    it('returns unknown names lower-cased without guessing', () => {
      expect(resolver.resolve('Widgets')).toBe('widgets');
    });

    it('lets the logical name win when a set name collides with another logical name', () => {
      const colliding = createEntityNameResolver([
        { LogicalName: 'cr_task', EntitySetName: 'cr_tasks' },
        { LogicalName: 'cr_tasks', EntitySetName: 'cr_taskses' },
      ]);
      expect(colliding.resolve('cr_tasks')).toBe('cr_tasks');
      expect(colliding.resolve('cr_taskses')).toBe('cr_tasks');
    });

    it('ignores missing or empty set names', () => {
      const partial = createEntityNameResolver([
        { LogicalName: 'a' },
        { LogicalName: 'b', EntitySetName: null },
        { LogicalName: 'c', EntitySetName: '  ' },
      ]);
      expect(partial.resolve('a')).toBe('a');
      expect(partial.resolve('')).toBe('');
    });

    it('does not mutate the input entities', () => {
      const input = [{ LogicalName: 'Account', EntitySetName: 'Accounts' }];
      const snapshot = JSON.stringify(input);
      createEntityNameResolver(input).resolve('accounts');
      expect(JSON.stringify(input)).toBe(snapshot);
    });
  });

  describe('isSameEntity', () => {
    const resolver = createEntityNameResolver(entities);

    it('treats an entity set name as equal to its logical name', () => {
      expect(resolver.isSameEntity('account', 'accounts')).toBe(true);
      expect(resolver.isSameEntity('cr123_project', 'CR123_Projects')).toBe(true);
    });

    it('treats identical logical names as equal', () => {
      expect(resolver.isSameEntity('account', 'Account')).toBe(true);
    });

    it('treats different in-scope entities as different', () => {
      expect(resolver.isSameEntity('account', 'contacts')).toBe(false);
    });

    it('never matches empty names', () => {
      expect(resolver.isSameEntity('', '')).toBe(false);
      expect(resolver.isSameEntity('account', ' ')).toBe(false);
    });

    describe('pluralisation heuristic (both sides out of scope)', () => {
      it.each([
        ['cr9_widget', 'cr9_widgets'],
        ['cr9_category', 'cr9_categories'],
        ['cr9_address', 'cr9_addresses'],
        ['cr9_box', 'cr9_boxes'],
        ['cr9_batch', 'cr9_batches'],
        ['cr9_key', 'cr9_keys'],
      ])('matches %s with %s', (source, target) => {
        expect(resolver.isSameEntity(source, target)).toBe(true);
      });

      it('is one-directional: the target is never depluralised', () => {
        expect(resolver.isSameEntity('cr9_widgets', 'cr9_widget')).toBe(false);
      });

      it('does not match unrelated names', () => {
        expect(resolver.isSameEntity('cr9_widget', 'cr9_gadgets')).toBe(false);
      });

      it('is not applied when the source is in scope', () => {
        const irregular = createEntityNameResolver([
          { LogicalName: 'cr9_order', EntitySetName: 'cr9_orders_custom' },
        ]);
        expect(irregular.isSameEntity('cr9_order', 'cr9_orders')).toBe(false);
      });

      it('is not applied when the target is in scope', () => {
        const inScope = createEntityNameResolver([
          { LogicalName: 'cr9_orders', EntitySetName: 'cr9_orderses' },
        ]);
        expect(inScope.isSameEntity('cr9_order', 'cr9_orders')).toBe(false);
      });
    });
  });
});
