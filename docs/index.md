<!-- docs/index.md -->

# Quickbase JS API Documentation

Explore the methods available in the quickbase-js library.

<script setup>
import { ref } from 'vue';
import apiDocs from '../docs-data/api-docs.json'; // ESM import from project root

const methods = ref(apiDocs);
</script>

<div v-for="method in methods" :key="method.name" :id="method.name" class="method-card">
  <h2>{{ method.name }}</h2>
  <code>{{ method.method }} {{ method.path }}</code>
  <p>{{ method.summary }}</p>
  <h3 v-if="method.parameters.length">Parameters</h3>
  <ul v-if="method.parameters.length">
    <li v-for="param in method.parameters" :key="param.name">
      <strong>{{ param.name }}</strong> ({{ param.type }}, {{ param.required ? 'required' : 'optional' }}): {{ param.description || 'No description' }}
      <ul v-if="param.properties && param.properties.length">
        <li v-for="prop in param.properties" :key="prop.name">
          <strong>{{ prop.name }}</strong> ({{ prop.type }}, {{ prop.required ? 'required' : 'optional' }}): {{ prop.jsdoc || 'No description' }}
        </li>
      </ul>
    </li>
  </ul>
  <h3>Returns</h3>
  <p><code>{{ method.returns }}</code></p>
  <ul v-if="method.returnTypeDetails && method.returnTypeDetails.length">
    <li v-for="prop in method.returnTypeDetails" :key="prop.name">
      <strong>{{ prop.name }}</strong> ({{ prop.type }}, {{ prop.required ? 'required' : 'optional' }}): {{ prop.jsdoc || 'No description' }}
    </li>
  </ul>
  <a :href="method.docLink" target="_blank">Official Docs</a>
</div>

<style>
.method-card { border: 1px solid #ddd; padding: 16px; margin-bottom: 16px; border-radius: 4px; }
</style>
