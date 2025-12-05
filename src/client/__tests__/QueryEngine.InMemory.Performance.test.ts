import { describe, it, beforeAll, afterAll } from 'vitest';
import { InMemoryStore } from '../../stores/InMemoryStore.js';
import { QueryEngine } from '../QueryEngine.js';
import type { StoredCTC } from '../../stores/Store.interface.js';
import { 
  ObjectType, 
  MorphismType, 
  CategoryType, 
  FunctorType,
  ObjectMappingType,
  MorphismMappingType,
} from '../../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

interface SizeConfig {
  name: string;
  categories: number;
  objectsPerCategory: number;
  morphismsPerCategory: number;
  functors: number;
  objectMappingsPerFunctor: number;
  morphismMappingsPerFunctor: number;
  iterations: number; // Number of times to call each method for averaging
}

const SIZES: SizeConfig[] = [
  {
    name: 'Small',
    categories: 5,
    objectsPerCategory: 10,
    morphismsPerCategory: 15,
    functors: 3,
    objectMappingsPerFunctor: 5,
    morphismMappingsPerFunctor: 3,
    iterations: 100,
  },
  {
    name: 'Medium',
    categories: 50,
    objectsPerCategory: 100,
    morphismsPerCategory: 150,
    functors: 20,
    objectMappingsPerFunctor: 30,
    morphismMappingsPerFunctor: 20,
    iterations: 50,
  },
  {
    name: 'Large',
    categories: 100,
    objectsPerCategory: 500,
    morphismsPerCategory: 750,
    functors: 50,
    objectMappingsPerFunctor: 100,
    morphismMappingsPerFunctor: 50,
    iterations: 10,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────────────────────────

interface TestData {
  store: InMemoryStore;
  queryEngine: QueryEngine;
  categories: StoredCTC[];
  objects: Map<string, StoredCTC[]>; // categoryId -> objects
  morphisms: Map<string, StoredCTC[]>; // categoryId -> morphisms
  functors: StoredCTC[];
  objectMappings: Map<string, StoredCTC[]>; // functorId -> object mappings
  morphismMappings: Map<string, StoredCTC[]>; // functorId -> morphism mappings
}

interface MethodResult {
  method: string;
  avgMs: number;
  minMs: number;
  maxMs: number;
  totalMs: number;
  iterations: number;
}

interface SizeResult {
  size: SizeConfig;
  setupTimeMs: number;
  totalConstructs: number;
  methods: MethodResult[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup Functions
// ─────────────────────────────────────────────────────────────────────────────

async function setupTestData(config: SizeConfig): Promise<TestData> {
  const store = new InMemoryStore({ id: `perf-store-${config.name}`, name: `Performance ${config.name}` });
  const queryEngine = new QueryEngine([store]);

  const categories: StoredCTC[] = [];
  const objects = new Map<string, StoredCTC[]>();
  const morphisms = new Map<string, StoredCTC[]>();
  const functors: StoredCTC[] = [];
  const objectMappings = new Map<string, StoredCTC[]>();
  const morphismMappings = new Map<string, StoredCTC[]>();

  console.log(`  Creating ${config.categories} categories...`);
  
  // Create categories
  for (let i = 0; i < config.categories; i++) {
    const cat = await store.create(CategoryType, { properties: { index: i } }, { name: `Category-${i}` });
    categories.push(cat);
    objects.set(cat.signature.id, []);
    morphisms.set(cat.signature.id, []);
  }

  console.log(`  Creating ${config.categories * config.objectsPerCategory} objects...`);
  
  // Create objects in each category
  for (const cat of categories) {
    const catObjects: StoredCTC[] = [];
    for (let i = 0; i < config.objectsPerCategory; i++) {
      const obj = await store.create(ObjectType, { categoryId: cat.signature.id }, { name: `Object-${i}` });
      catObjects.push(obj);
    }
    objects.set(cat.signature.id, catObjects);
  }

  console.log(`  Creating ${config.categories * config.morphismsPerCategory} morphisms...`);
  
  // Create morphisms in each category
  for (const cat of categories) {
    const catObjects = objects.get(cat.signature.id)!;
    const catMorphisms: StoredCTC[] = [];
    for (let i = 0; i < config.morphismsPerCategory; i++) {
      const sourceIdx = i % catObjects.length;
      const targetIdx = (i + 1) % catObjects.length;
      const mor = await store.create(MorphismType, {
        sourceId: catObjects[sourceIdx].signature.id,
        targetId: catObjects[targetIdx].signature.id,
        categoryId: cat.signature.id,
      }, { name: `Morphism-${i}` });
      catMorphisms.push(mor);
    }
    morphisms.set(cat.signature.id, catMorphisms);
  }

  console.log(`  Creating ${config.functors} functors with mappings...`);
  
  // Create functors between categories
  for (let i = 0; i < config.functors && i < categories.length - 1; i++) {
    const sourceCategory = categories[i];
    const targetCategory = categories[(i + 1) % categories.length];
    
    const fun = await store.create(FunctorType, {
      sourceCategoryId: sourceCategory.signature.id,
      targetCategoryId: targetCategory.signature.id,
    }, { name: `Functor-${i}` });
    functors.push(fun);
    
    // Create object mappings
    const sourceObjects = objects.get(sourceCategory.signature.id)!;
    const targetObjects = objects.get(targetCategory.signature.id)!;
    const funObjMappings: StoredCTC[] = [];
    
    for (let j = 0; j < config.objectMappingsPerFunctor && j < sourceObjects.length && j < targetObjects.length; j++) {
      const mapping = await store.create(ObjectMappingType, {
        functorId: fun.signature.id,
        sourceObjectId: sourceObjects[j].signature.id,
        targetObjectId: targetObjects[j].signature.id,
      });
      funObjMappings.push(mapping);
    }
    objectMappings.set(fun.signature.id, funObjMappings);
    
    // Create morphism mappings
    const sourceMorphisms = morphisms.get(sourceCategory.signature.id)!;
    const targetMorphisms = morphisms.get(targetCategory.signature.id)!;
    const funMorMappings: StoredCTC[] = [];
    
    for (let j = 0; j < config.morphismMappingsPerFunctor && j < sourceMorphisms.length && j < targetMorphisms.length; j++) {
      const mapping = await store.create(MorphismMappingType, {
        functorId: fun.signature.id,
        sourceMorphismId: sourceMorphisms[j].signature.id,
        targetMorphismId: targetMorphisms[j].signature.id,
      });
      funMorMappings.push(mapping);
    }
    morphismMappings.set(fun.signature.id, funMorMappings);
  }

  return {
    store,
    queryEngine,
    categories,
    objects,
    morphisms,
    functors,
    objectMappings,
    morphismMappings,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Benchmark Functions
// ─────────────────────────────────────────────────────────────────────────────

async function benchmark(
  name: string, 
  fn: () => Promise<any>, 
  iterations: number
): Promise<MethodResult> {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const total = times.reduce((a, b) => a + b, 0);
  return {
    method: name,
    avgMs: total / iterations,
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
    totalMs: total,
    iterations,
  };
}

async function runBenchmarks(data: TestData, config: SizeConfig): Promise<MethodResult[]> {
  const results: MethodResult[] = [];
  const { queryEngine, categories, objects, morphisms, functors } = data;
  
  // Pick random samples for testing
  const sampleCategory = categories[0];
  const sampleCategoryObjects = objects.get(sampleCategory.signature.id)!;
  const sampleObject = sampleCategoryObjects[0];
  const sampleCategoryMorphisms = morphisms.get(sampleCategory.signature.id)!;
  const sampleMorphism = sampleCategoryMorphisms[0];
  const sampleFunctor = functors[0];
  
  console.log(`  Benchmarking getObjectsInCategory (${config.iterations} iterations)...`);
  results.push(await benchmark('getObjectsInCategory', 
    () => queryEngine.getObjectsInCategory(sampleCategory.signature.id), 
    config.iterations
  ));
  
  console.log(`  Benchmarking getObjectInCategory (${config.iterations} iterations)...`);
  results.push(await benchmark('getObjectInCategory', 
    () => queryEngine.getObjectInCategory(sampleCategory.signature.id, sampleObject.signature.id), 
    config.iterations
  ));
  
  console.log(`  Benchmarking getMorphismsInCategory (${config.iterations} iterations)...`);
  results.push(await benchmark('getMorphismsInCategory', 
    () => queryEngine.getMorphismsInCategory(sampleCategory.signature.id), 
    config.iterations
  ));
  
  console.log(`  Benchmarking getMorphismInCategory (${config.iterations} iterations)...`);
  results.push(await benchmark('getMorphismInCategory', 
    () => queryEngine.getMorphismInCategory(sampleCategory.signature.id, sampleMorphism.signature.id), 
    config.iterations
  ));
  
  console.log(`  Benchmarking getFunctorsFromCategory (${config.iterations} iterations)...`);
  results.push(await benchmark('getFunctorsFromCategory', 
    () => queryEngine.getFunctorsFromCategory(sampleCategory.signature.id), 
    config.iterations
  ));
  
  console.log(`  Benchmarking getFunctorsToCategory (${config.iterations} iterations)...`);
  results.push(await benchmark('getFunctorsToCategory', 
    () => queryEngine.getFunctorsToCategory(sampleCategory.signature.id), 
    config.iterations
  ));
  
  console.log(`  Benchmarking getMorphismsFromObject (${config.iterations} iterations)...`);
  results.push(await benchmark('getMorphismsFromObject', 
    () => queryEngine.getMorphismsFromObject(sampleObject.signature.id), 
    config.iterations
  ));
  
  console.log(`  Benchmarking getMorphismsToObject (${config.iterations} iterations)...`);
  results.push(await benchmark('getMorphismsToObject', 
    () => queryEngine.getMorphismsToObject(sampleObject.signature.id), 
    config.iterations
  ));
  
  console.log(`  Benchmarking getSourceObject (${config.iterations} iterations)...`);
  results.push(await benchmark('getSourceObject', 
    () => queryEngine.getSourceObject(sampleMorphism.signature.id), 
    config.iterations
  ));
  
  console.log(`  Benchmarking getTargetObject (${config.iterations} iterations)...`);
  results.push(await benchmark('getTargetObject', 
    () => queryEngine.getTargetObject(sampleMorphism.signature.id), 
    config.iterations
  ));
  
  if (sampleFunctor) {
    console.log(`  Benchmarking getSourceCategory (${config.iterations} iterations)...`);
    results.push(await benchmark('getSourceCategory', 
      () => queryEngine.getSourceCategory(sampleFunctor.signature.id), 
      config.iterations
    ));
    
    console.log(`  Benchmarking getTargetCategory (${config.iterations} iterations)...`);
    results.push(await benchmark('getTargetCategory', 
      () => queryEngine.getTargetCategory(sampleFunctor.signature.id), 
      config.iterations
    ));
    
    console.log(`  Benchmarking getObjectMappings (${config.iterations} iterations)...`);
    results.push(await benchmark('getObjectMappings', 
      () => queryEngine.getObjectMappings(sampleFunctor.signature.id), 
      config.iterations
    ));
    
    console.log(`  Benchmarking getMorphismMappings (${config.iterations} iterations)...`);
    results.push(await benchmark('getMorphismMappings', 
      () => queryEngine.getMorphismMappings(sampleFunctor.signature.id), 
      config.iterations
    ));
    
    console.log(`  Benchmarking getSourceObjects (${config.iterations} iterations)...`);
    results.push(await benchmark('getSourceObjects', 
      () => queryEngine.getSourceObjects(sampleFunctor.signature.id), 
      config.iterations
    ));
    
    console.log(`  Benchmarking getTargetObjects (${config.iterations} iterations)...`);
    results.push(await benchmark('getTargetObjects', 
      () => queryEngine.getTargetObjects(sampleFunctor.signature.id), 
      config.iterations
    ));
    
    console.log(`  Benchmarking getSourceMorphisms (${config.iterations} iterations)...`);
    results.push(await benchmark('getSourceMorphisms', 
      () => queryEngine.getSourceMorphisms(sampleFunctor.signature.id), 
      config.iterations
    ));
    
    console.log(`  Benchmarking getTargetMorphisms (${config.iterations} iterations)...`);
    results.push(await benchmark('getTargetMorphisms', 
      () => queryEngine.getTargetMorphisms(sampleFunctor.signature.id), 
      config.iterations
    ));
  }
  
  console.log(`  Benchmarking get (${config.iterations} iterations)...`);
  results.push(await benchmark('get', 
    () => queryEngine.get(sampleObject.signature.id), 
    config.iterations
  ));
  
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML Generation
// ─────────────────────────────────────────────────────────────────────────────

function generateHTML(results: SizeResult[]): string {
  const timestamp = new Date().toISOString();
  
  const methodsSet = new Set<string>();
  for (const result of results) {
    for (const method of result.methods) {
      methodsSet.add(method.method);
    }
  }
  const allMethods = Array.from(methodsSet);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QueryEngine Performance Results - ${timestamp}</title>
  <style>
    :root {
      --bg: #0f0f0f;
      --surface: #1a1a1a;
      --surface-2: #252525;
      --text: #e0e0e0;
      --text-dim: #888;
      --accent: #00d4aa;
      --accent-2: #ff6b6b;
      --accent-3: #4ecdc4;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      background: var(--bg);
      color: var(--text);
      padding: 2rem;
      line-height: 1.6;
    }
    
    header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--surface-2);
    }
    
    h1 {
      font-size: 2rem;
      font-weight: 300;
      letter-spacing: 0.1em;
      color: var(--accent);
      margin-bottom: 0.5rem;
    }
    
    .timestamp {
      color: var(--text-dim);
      font-size: 0.85rem;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    
    .summary-card {
      background: var(--surface);
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid var(--surface-2);
    }
    
    .summary-card h2 {
      color: var(--accent);
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    .stat {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--surface-2);
    }
    
    .stat:last-child { border-bottom: none; }
    
    .stat-label { color: var(--text-dim); }
    .stat-value { font-weight: 500; }
    
    .results-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2rem;
      background: var(--surface);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .results-table th,
    .results-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid var(--surface-2);
    }
    
    .results-table th {
      background: var(--surface-2);
      color: var(--accent);
      font-weight: 500;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.1em;
    }
    
    .results-table tr:hover {
      background: var(--surface-2);
    }
    
    .method-name {
      font-weight: 500;
      color: var(--accent-3);
    }
    
    .fast { color: #4caf50; }
    .medium { color: #ff9800; }
    .slow { color: #f44336; }
    
    .section-title {
      font-size: 1.25rem;
      color: var(--accent);
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--surface-2);
    }
    
    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 1rem 0;
    }
    
    .bar-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .bar-label {
      width: 200px;
      font-size: 0.8rem;
      color: var(--text-dim);
      text-align: right;
    }
    
    .bar-container {
      flex: 1;
      height: 20px;
      background: var(--surface-2);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .bar {
      height: 100%;
      background: linear-gradient(90deg, var(--accent), var(--accent-3));
      transition: width 0.3s ease;
    }
    
    .bar-value {
      width: 80px;
      font-size: 0.8rem;
      color: var(--text);
    }
    
    footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid var(--surface-2);
      color: var(--text-dim);
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>QueryEngine Performance Results</h1>
    <p class="timestamp">Generated: ${timestamp}</p>
  </header>

  <section class="summary">
    ${results.map(r => `
    <div class="summary-card">
      <h2>${r.size.name} Dataset</h2>
      <div class="stat">
        <span class="stat-label">Total Constructs</span>
        <span class="stat-value">${r.totalConstructs.toLocaleString()}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Categories</span>
        <span class="stat-value">${r.size.categories}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Objects</span>
        <span class="stat-value">${(r.size.categories * r.size.objectsPerCategory).toLocaleString()}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Morphisms</span>
        <span class="stat-value">${(r.size.categories * r.size.morphismsPerCategory).toLocaleString()}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Functors</span>
        <span class="stat-value">${r.size.functors}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Setup Time</span>
        <span class="stat-value">${r.setupTimeMs.toFixed(0)}ms</span>
      </div>
    </div>
    `).join('')}
  </section>

  ${results.map(r => `
  <section>
    <h3 class="section-title">${r.size.name} Dataset Results (${r.size.iterations} iterations each)</h3>
    
    <div class="bar-chart">
      ${r.methods.map(m => {
        const maxAvg = Math.max(...r.methods.map(x => x.avgMs));
        const pct = (m.avgMs / maxAvg) * 100;
        return `
      <div class="bar-row">
        <span class="bar-label">${m.method}</span>
        <div class="bar-container">
          <div class="bar" style="width: ${pct}%"></div>
        </div>
        <span class="bar-value">${m.avgMs.toFixed(3)}ms</span>
      </div>
        `;
      }).join('')}
    </div>
    
    <table class="results-table">
      <thead>
        <tr>
          <th>Method</th>
          <th>Avg (ms)</th>
          <th>Min (ms)</th>
          <th>Max (ms)</th>
          <th>Total (ms)</th>
          <th>Iterations</th>
        </tr>
      </thead>
      <tbody>
        ${r.methods.map(m => {
          const speedClass = m.avgMs < 1 ? 'fast' : m.avgMs < 10 ? 'medium' : 'slow';
          return `
        <tr>
          <td class="method-name">${m.method}</td>
          <td class="${speedClass}">${m.avgMs.toFixed(4)}</td>
          <td>${m.minMs.toFixed(4)}</td>
          <td>${m.maxMs.toFixed(4)}</td>
          <td>${m.totalMs.toFixed(2)}</td>
          <td>${m.iterations}</td>
        </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </section>
  `).join('')}

  <section>
    <h3 class="section-title">Cross-Size Comparison (Average ms)</h3>
    <table class="results-table">
      <thead>
        <tr>
          <th>Method</th>
          ${results.map(r => `<th>${r.size.name}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${allMethods.map(method => `
        <tr>
          <td class="method-name">${method}</td>
          ${results.map(r => {
            const m = r.methods.find(x => x.method === method);
            if (!m) return '<td>-</td>';
            const speedClass = m.avgMs < 1 ? 'fast' : m.avgMs < 10 ? 'medium' : 'slow';
            return `<td class="${speedClass}">${m.avgMs.toFixed(4)}</td>`;
          }).join('')}
        </tr>
        `).join('')}
      </tbody>
    </table>
  </section>

  <footer>
    <p>CTKR QueryEngine Performance Test</p>
    <p>Node.js ${typeof process !== 'undefined' ? process.version : 'N/A'}</p>
  </footer>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('QueryEngine InMemory Performance', () => {
  const allResults: SizeResult[] = [];
  
  afterAll(() => {
    // Write HTML results file
    const html = generateHTML(allResults);
    const resultsDir = path.join(import.meta.dirname, 'results');
    
    // Ensure results directory exists
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(resultsDir, `performance-${timestamp}.html`);
    fs.writeFileSync(filePath, html);
    
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`Performance results written to:`);
    console.log(`  ${filePath}`);
    console.log(`${'═'.repeat(60)}\n`);
  });
  
  for (const config of SIZES) {
    describe(`${config.name} dataset`, () => {
      let data: TestData;
      let setupTime: number;
      
      beforeAll(async () => {
        console.log(`\n${'─'.repeat(60)}`);
        console.log(`Setting up ${config.name} dataset...`);
        console.log(`${'─'.repeat(60)}`);
        
        const start = performance.now();
        data = await setupTestData(config);
        setupTime = performance.now() - start;
        
        const totalConstructs = 
          config.categories + 
          config.categories * config.objectsPerCategory +
          config.categories * config.morphismsPerCategory +
          config.functors +
          config.functors * config.objectMappingsPerFunctor +
          config.functors * config.morphismMappingsPerFunctor;
        
        console.log(`  Setup complete in ${setupTime.toFixed(0)}ms`);
        console.log(`  Total constructs: ${totalConstructs.toLocaleString()}`);
        console.log(`${'─'.repeat(60)}`);
        console.log(`Running benchmarks...`);
      });
      
      it('benchmarks all QueryEngine methods', async () => {
        const methodResults = await runBenchmarks(data, config);
        
        const totalConstructs = 
          config.categories + 
          config.categories * config.objectsPerCategory +
          config.categories * config.morphismsPerCategory +
          config.functors +
          config.functors * config.objectMappingsPerFunctor +
          config.functors * config.morphismMappingsPerFunctor;
        
        allResults.push({
          size: config,
          setupTimeMs: setupTime,
          totalConstructs,
          methods: methodResults,
        });
        
        console.log(`\n  ${config.name} benchmark complete!`);
        console.log(`  Slowest method: ${methodResults.reduce((a, b) => a.avgMs > b.avgMs ? a : b).method}`);
        console.log(`  Fastest method: ${methodResults.reduce((a, b) => a.avgMs < b.avgMs ? a : b).method}`);
      }, 300000); // 5 minute timeout
    });
  }
});

