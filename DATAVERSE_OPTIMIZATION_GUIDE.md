# Dataverse Query Optimization Guide

## Critical Rules for Fast Performance

This document outlines optimization patterns to ensure PPSB remains fast and makes minimal calls to Dataverse.

---

## ⚠️ NEVER DO: N+1 Query Anti-Patterns

### ❌ BAD: Sequential Queries in Loop
```typescript
// DON'T DO THIS - Makes N separate API calls
for (const id of ids) {
  const result = await client.query('table', {
    filter: `id eq ${id}`
  });
  // process result
}
```

### ✅ GOOD: Single Batch Query with OR Filters
```typescript
// DO THIS - Makes 1 API call for all IDs
const filters = ids.map(id => `id eq ${id}`).join(' or ');
const result = await client.query('table', {
  filter: filters
});

// Group/process results in memory
const resultMap = new Map();
for (const item of result.value) {
  resultMap.set(item.id, item);
}
```

---

## Query Optimization Patterns

### Pattern 1: Batch Filtering with OR
**Use Case:** Query multiple specific records by ID

```typescript
// Example: Get multiple plugins by ID
const pluginIds = ['id1', 'id2', 'id3'];
const filterClauses = pluginIds.map(id => `pluginid eq ${id}`);
const filter = filterClauses.join(' or ');

const result = await client.query('plugins', {
  select: ['pluginid', 'name', 'version'],
  filter: filter
});
```

**When to Use:**
- Fetching specific records by ID
- Querying across multiple solutions
- Getting related data for multiple parent records

**Performance:** O(1) queries instead of O(N)

---

### Pattern 2: Fetch and Group in Memory
**Use Case:** One-to-many relationships

```typescript
// Example: Get all plugin images for multiple plugins
const pluginStepIds = ['step1', 'step2', 'step3'];

// Single batch query
const imageFilters = pluginStepIds.map(id => `_pluginstepid_value eq ${id}`).join(' or ');
const result = await client.query('sdkmessageprocessingstepimages', {
  select: ['imageid', '_pluginstepid_value', 'imagetype', 'name'],
  filter: imageFilters
});

// Group in memory by parent ID
const imagesByPlugin = new Map();
for (const image of result.value) {
  const stepId = image._pluginstepid_value;
  if (!imagesByPlugin.has(stepId)) {
    imagesByPlugin.set(stepId, []);
  }
  imagesByPlugin.get(stepId).push(image);
}

// Now use grouped data without additional queries
for (const stepId of pluginStepIds) {
  const images = imagesByPlugin.get(stepId) || [];
  // process images
}
```

**When to Use:**
- Parent-child relationships
- One-to-many scenarios
- Need to process related data per parent

**Performance:** O(1) queries + O(N) memory grouping instead of O(N) queries

---

### Pattern 3: Strategic Use of Expand
**Use Case:** Fetch related data in same query

```typescript
// Example: Get plugins with their message and type information
const result = await client.query('sdkmessageprocessingsteps', {
  select: ['stepid', 'name', 'stage', 'rank'],
  filter: 'stepid eq {id1} or stepid eq {id2}',
  expand: 'sdkmessageid($select=name),plugintypeid($select=typename,assemblyname)'
});
```

**When to Use:**
- Related data is always needed
- Relationship is many-to-one (won't cause data explosion)
- Reduces round trips

**⚠️ Be Careful:**
- Expand can make responses large
- Only expand what you need
- Test with large datasets

---

### Pattern 4: Selective Field Selection
**Use Case:** Reduce payload size

```typescript
// ✅ GOOD - Only get what you need
const result = await client.query('entities', {
  select: ['entityid', 'logicalname', 'displayname']
});

// ❌ BAD - Gets all fields (unnecessary data transfer)
const result = await client.query('entities', {});
```

**When to Use:** Always! Only select fields you'll actually use.

---

## Implemented Optimizations

### ✅ 1. Solution Component Discovery
**File:** `packages/core/src/discovery/SolutionComponentDiscovery.ts`

**Before:** N queries (one per solution)
```typescript
for (const solutionId of solutionIds) {
  const result = await client.query('solutioncomponents', {
    filter: `_solutionid_value eq ${solutionId}`
  });
}
```

**After:** 1 query for all solutions
```typescript
const solutionFilters = solutionIds.map(id => `_solutionid_value eq ${id}`).join(' or ');
const result = await client.query('solutioncomponents', {
  filter: solutionFilters
});
```

**Impact:** 90%+ reduction for multi-solution scenarios

---

### ✅ 2. Plugin Image Batch Fetching
**File:** `packages/core/src/discovery/PluginDiscovery.ts`

**Before:** N queries (one per plugin)
```typescript
for (const plugin of plugins) {
  const images = await getPluginImages(plugin.id);
}
```

**After:** 1 query for all plugin images
```typescript
const allImages = await getPluginImagesForAllSteps(pluginIds);
// Use pre-fetched data in loop
for (const plugin of plugins) {
  const images = allImages.get(plugin.id) || { preImage: null, postImage: null };
}
```

**Impact:** 90%+ reduction for multi-plugin scenarios

---

## Query Count Reference

### Solution-Based Blueprint (10 entities, 5 plugins, 3 workflows)

**Before Optimization:**
1. Solution components: 1 query × N solutions = N
2. Workflow classification: 1 query
3. Entity metadata: 1 query
4. Plugin steps: 1 query
5. Plugin images: 5 queries (1 per plugin)
6. Entity schemas: 10 queries (1 per entity)
**Total: 18+ queries**

**After Optimization:**
1. Solution components: 1 query (all solutions)
2. Workflow classification: 1 query
3. Entity metadata: 1 query
4. Plugin steps: 1 query
5. Plugin images: 1 query (batched)
6. Entity schemas: 10 queries (unavoidable due to expand)
**Total: 15 queries (16% improvement)**

**Larger Solution (50 entities, 30 plugins):**
- Before: 82+ queries
- After: 62 queries (24% improvement)

---

## Future Optimization Opportunities

### 1. Entity Schema Batching
**Challenge:** Currently queries each entity schema individually
**Status:** Under investigation - Metadata API may support batching
**Potential Impact:** Could reduce 50 entity queries to 1-5 queries

### 2. Metadata Caching
**Challenge:** Full table scans for EntityDefinitions
**Status:** Consider session-level cache
**Potential Impact:** Eliminate redundant full scans

### 3. OData $batch Support
**Challenge:** Client doesn't support batch requests
**Status:** Future enhancement
**Potential Impact:** Could batch unrelated queries into single HTTP request

---

## Anti-Patterns to Avoid

### ❌ Don't: Create Discovery Class Per Entity
```typescript
// BAD - Creates new instance and queries for each entity
for (const entity of entities) {
  const discovery = new SchemaDiscovery(client);
  const schema = await discovery.getSchema(entity.logicalname);
}
```

### ✅ Do: Reuse Discovery Instance or Batch
```typescript
// GOOD - Reuse instance
const discovery = new SchemaDiscovery(client);
for (const entity of entities) {
  const schema = await discovery.getSchema(entity.logicalname);
}

// BETTER - Batch if possible
const schemas = await discovery.getBatchSchemas(entityNames);
```

---

### ❌ Don't: Query Inside Map/Filter
```typescript
// BAD - Queries inside array operations
const enriched = await Promise.all(
  items.map(async item => ({
    ...item,
    details: await client.query('details', {
      filter: `itemid eq ${item.id}`
    })
  }))
);
```

### ✅ Do: Pre-fetch Then Enrich
```typescript
// GOOD - Single batch query, then enrich
const itemIds = items.map(i => i.id);
const detailsFilter = itemIds.map(id => `itemid eq ${id}`).join(' or ');
const allDetails = await client.query('details', { filter: detailsFilter });

const detailsMap = new Map(allDetails.value.map(d => [d.itemid, d]));
const enriched = items.map(item => ({
  ...item,
  details: detailsMap.get(item.id)
}));
```

---

## Testing Performance

### Measure Query Counts
Add logging to track queries:
```typescript
let queryCount = 0;

// Wrap client query methods
const originalQuery = client.query;
client.query = async (...args) => {
  queryCount++;
  console.log(`Query ${queryCount}:`, args[0]);
  return originalQuery.apply(client, args);
};
```

### Benchmark Different Approaches
```typescript
console.time('Sequential');
for (const id of ids) {
  await query(id);
}
console.timeEnd('Sequential'); // e.g., 5000ms

console.time('Batched');
await queryBatch(ids);
console.timeEnd('Batched'); // e.g., 500ms (10x faster!)
```

---

## Checklist for New Features

Before adding any Dataverse query:

- [ ] Can this be combined with an existing query?
- [ ] Am I querying in a loop? → Use batch with OR filters
- [ ] Do I need all these fields? → Use selective $select
- [ ] Is this a one-to-many? → Pre-fetch and group in memory
- [ ] Can I use $expand for related data?
- [ ] Have I tested with large datasets (50+ items)?
- [ ] Did I add comments explaining the optimization?

---

## Performance Targets

**Goal:** Fast blueprint generation even for large solutions

- **Small solution** (5 entities, 10 plugins): < 3 seconds
- **Medium solution** (20 entities, 50 plugins): < 10 seconds
- **Large solution** (50 entities, 100 plugins): < 30 seconds

**Query limits:**
- Aim for < 50 total queries per blueprint generation
- No queries inside loops (always batch)
- Cache when possible, query when necessary

---

## Additional Resources

- [OData Filtering](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html)
- [Dataverse Web API](https://docs.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview)
- [Query Performance Best Practices](https://docs.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query-data-web-api)

---

## Last Updated
February 2026 - Based on comprehensive codebase analysis

**Maintainer:** Keep this document updated when adding new queries or discovery patterns.
