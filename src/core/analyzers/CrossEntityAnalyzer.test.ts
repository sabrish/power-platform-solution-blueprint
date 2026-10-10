/**
 * CrossEntityAnalyzer tests for entity set name resolution.
 *
 * ASSUMPTION (unverified): the fixtures are synthetic. They assume
 * DataverseAction.targetEntity can carry an entity SET name (e.g. "accounts")
 * as well as a logical name (e.g. "account"). See crossEntity.fixtures.ts.
 */
import { describe, expect, it } from 'vitest';
import type { Flow } from '../types/blueprint.js';
import { CrossEntityAnalyzer } from './CrossEntityAnalyzer.js';
import { deepFreeze, makeAction, makeBlueprint, makeFlow } from './crossEntity.fixtures.js';

const analyzer = new CrossEntityAnalyzer();

const account = (flows: Flow[] = []): ReturnType<typeof makeBlueprint> =>
  makeBlueprint('account', 'accounts', flows);
const contact = (flows: Flow[] = []): ReturnType<typeof makeBlueprint> =>
  makeBlueprint('contact', 'contacts', flows);

describe('CrossEntityAnalyzer - entity set name resolution', () => {
  describe('self-reference checks', () => {
    it('skips an entity-scoped flow writing to its own entity via the set name', () => {
      const flow = makeFlow({ id: 'f1', entity: 'account', actions: [makeAction('Update', 'accounts', ['name'])] });
      const result = analyzer.analyze([account([flow])]);

      expect(result.totalEntryPoints).toBe(0);
      expect(result.entityViews.size).toBe(0);
      expect(result.chainLinks).toHaveLength(0);
      expect(result.allEntityPipelines.has('accounts')).toBe(false);
    });

    it('still skips self-references expressed as the logical name', () => {
      const flow = makeFlow({ id: 'f1', entity: 'account', actions: [makeAction('Update', 'account')] });
      const result = analyzer.analyze([account([flow])]);

      expect(result.totalEntryPoints).toBe(0);
      expect(result.entityViews.size).toBe(0);
    });

    it('skips an unscoped flow writing to its own entity via the set name', () => {
      const flow = makeFlow({
        id: 'f2',
        entity: 'account',
        triggerType: 'Manual',
        triggerEvent: 'Manual',
        actions: [makeAction('Update', 'accounts')],
      });
      const result = analyzer.analyze([account()], [], [flow]);

      expect(result.totalEntryPoints).toBe(0);
      expect(result.entityViews.size).toBe(0);
    });

    it('skips a child flow writing back to the parent source entity via the set name', () => {
      // The child is also scanned standalone as an unscoped flow, so give it the same
      // source entity to keep the assertion about the via-parent path only.
      const child = makeFlow({
        id: 'child',
        name: 'Child',
        entity: 'account',
        actions: [makeAction('Update', 'accounts')],
      });
      const parent = makeFlow({ id: 'parent', entity: 'account', childFlowIds: ['child'] });
      const result = analyzer.analyze([account([parent])], [], [parent, child]);

      expect(result.totalEntryPoints).toBe(0);
      expect(result.entityViews.size).toBe(0);
    });

    it('does not report a downstream branch for a same-entity write via the set name', () => {
      const flow = makeFlow({
        id: 'f3',
        entity: 'account',
        triggerEvent: 'Create',
        actions: [makeAction('Create', 'accounts')],
      });
      const result = analyzer.analyze([account([flow])]);

      const steps = result.allEntityPipelines.get('account')?.messagePipelines.flatMap((mp) => mp.steps) ?? [];
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.every((s) => s.downstream === undefined)).toBe(true);
    });
  });

  describe('cross-entity targets expressed as set names', () => {
    it('keys the entry point by the in-scope logical name and links it to the target pipeline', () => {
      const writer = makeFlow({
        id: 'writer',
        name: 'Writer',
        entity: 'account',
        actions: [makeAction('Create', 'contacts', ['firstname'])],
      });
      const listener = makeFlow({ id: 'listener', name: 'Listener', entity: 'contact', triggerEvent: 'Create' });
      const result = analyzer.analyze([account([writer]), contact([listener])]);

      expect(result.entityViews.has('contacts')).toBe(false);
      const view = result.entityViews.get('contact');
      expect(view?.entityDisplayName).toBe('Display contact');
      expect(view?.traces).toHaveLength(1);
      expect(view?.traces[0].entryPoint.sourceEntity).toBe('account');
      expect(view?.traces[0].activations.map((a) => a.automationName)).toEqual(['Listener']);
      expect(result.chainLinks).toHaveLength(1);
      expect(result.chainLinks[0].targetEntity).toBe('contact');
      expect(result.chainLinks[0].targetEntityDisplayName).toBe('Display contact');
      expect(result.allEntityPipelines.get('contact')?.inboundEntryPoints).toHaveLength(1);
      expect(result.allEntityPipelines.has('contacts')).toBe(false);
    });

    it('resolves the downstream branch target to the logical name', () => {
      const flow = makeFlow({
        id: 'f4',
        entity: 'contact',
        triggerEvent: 'Create',
        actions: [makeAction('Update', 'accounts', ['name'])],
      });
      const result = analyzer.analyze([contact([flow]), account()]);

      const steps = result.allEntityPipelines.get('contact')?.messagePipelines.flatMap((mp) => mp.steps) ?? [];
      expect(steps[0].downstream?.targetEntity).toBe('account');
      expect(steps[0].downstream?.pipelineRef).toBe('account');
      expect(steps[0].downstream?.targetEntityDisplayName).toBe('Display account');
    });

    it('resolves unscoped and child-flow targets to the logical name', () => {
      const child = makeFlow({
        id: 'child',
        name: 'Child',
        entity: 'account',
        actions: [makeAction('Create', 'contacts')],
      });
      const parent = makeFlow({
        id: 'parent',
        name: 'Parent',
        entity: 'account',
        childFlowIds: ['child'],
        actions: [],
      });
      const scheduled = makeFlow({
        id: 'sched',
        triggerType: 'Scheduled',
        triggerEvent: 'Scheduled',
        actions: [makeAction('Update', 'contacts')],
      });
      const result = analyzer.analyze([account([parent]), contact()], [], [parent, child, scheduled]);

      expect(result.entityViews.has('contacts')).toBe(false);
      const names = result.entityViews.get('contact')?.traces.map((t) => t.entryPoint.automationName).sort();
      // The standalone "Child" entry point is deduplicated against the via-parent one
      // (same automation id, operation and source entity); the bp-scoped scan runs first.
      expect(names).toEqual(['Child (via Parent)', 'sched']);
    });
  });

  describe('names outside the in-scope entities', () => {
    it('applies the one-directional pluralisation heuristic when both sides are out of scope', () => {
      const selfByPlural = makeFlow({
        id: 'o1',
        entity: 'cr9_widget',
        triggerType: 'Manual',
        triggerEvent: 'Manual',
        actions: [makeAction('Update', 'cr9_widgets')],
      });
      const result = analyzer.analyze([account()], [], [selfByPlural]);

      expect(result.totalEntryPoints).toBe(0);
    });

    it('keeps an out-of-scope target unchanged when it is not a plural of the source', () => {
      const flow = makeFlow({
        id: 'o2',
        entity: 'cr9_widget',
        triggerType: 'Manual',
        triggerEvent: 'Manual',
        actions: [makeAction('Update', 'cr9_gadgets')],
      });
      const result = analyzer.analyze([account()], [], [flow]);

      expect(Array.from(result.entityViews.keys())).toEqual(['cr9_gadgets']);
    });

    it('never depluralises the target', () => {
      const flow = makeFlow({
        id: 'o3',
        entity: 'cr9_widgets',
        triggerType: 'Manual',
        triggerEvent: 'Manual',
        actions: [makeAction('Update', 'cr9_widget')],
      });
      const result = analyzer.analyze([account()], [], [flow]);

      expect(Array.from(result.entityViews.keys())).toEqual(['cr9_widget']);
    });

    it('does not apply the heuristic when the source entity is in scope', () => {
      const bp = makeBlueprint('cr9_order', 'cr9_orders_custom');
      const flow = makeFlow({
        id: 'o4',
        entity: 'cr9_order',
        triggerType: 'Manual',
        triggerEvent: 'Manual',
        actions: [makeAction('Update', 'cr9_orders')],
      });
      const result = analyzer.analyze([bp], [], [flow]);

      expect(Array.from(result.entityViews.keys())).toEqual(['cr9_orders']);
    });
  });

  describe('collisions', () => {
    it('lets a logical name win over another entity set name', () => {
      const task = makeBlueprint('cr_task', 'cr_tasks', [
        makeFlow({ id: 'c1', entity: 'cr_task', actions: [makeAction('Update', 'cr_tasks')] }),
      ]);
      const tasks = makeBlueprint('cr_tasks', 'cr_taskses');
      const result = analyzer.analyze([task, tasks]);

      expect(Array.from(result.entityViews.keys())).toEqual(['cr_tasks']);
      expect(result.entityViews.get('cr_tasks')?.traces[0].entryPoint.sourceEntity).toBe('cr_task');
    });
  });

  describe('input handling', () => {
    it('does not mutate inputs and leaves raw target values untouched', () => {
      const flow = makeFlow({
        id: 'm1',
        entity: 'account',
        actions: [makeAction('Update', 'accounts'), makeAction('Create', 'contacts')],
      });
      const unscoped = makeFlow({
        id: 'm2',
        entity: 'account',
        triggerType: 'Manual',
        triggerEvent: 'Manual',
        actions: [makeAction('Update', 'accounts'), makeAction('Create', 'contacts')],
      });
      const blueprints = deepFreeze([account([flow]), contact()]);
      const flows = deepFreeze([flow, unscoped]);

      expect(() => analyzer.analyze(blueprints, [], flows)).not.toThrow();
      expect(flow.definition.dataverseActions?.map((a) => a.targetEntity)).toEqual(['accounts', 'contacts']);
      expect(unscoped.definition.dataverseActions?.map((a) => a.targetEntity)).toEqual(['accounts', 'contacts']);
    });
  });
});
