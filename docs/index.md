<!-- docs/index.md -->

<script setup>
import { ref } from 'vue';
import apiDocs from '../docs-data/api-docs.json'; // ESM import from project root

const methods = ref(apiDocs);
</script>

Documentation of the available API methods. For full project details and features, see the [GitHub repository](https://github.com/DrewBradfordXYZ/quickbase-js).

<div v-for="method in methods" :key="method.name" :id="method.name" class="method-card">
  <h2>{{ method.name }}</h2>
  <code>{{ method.method }} {{ method.path }}</code>
  <p>{{ method.summary }}</p>
  <p>
    <a :href="method.docLink" target="_blank" rel="noopener noreferrer">{{ method.docLink }}</a>
  </p>
  <h3 v-if="method.parameters.length">Parameters</h3>
  <ul v-if="method.parameters.length">
    <li v-for="param in method.parameters" :key="param.name">
      <code class="prop-bubble">{{ param.name }}</code> ({{ param.type }}, {{ param.required ? 'required' : 'optional' }}): {{ param.description || 'No description' }}
      <ul v-if="param.properties && param.properties.length">
        <li v-for="prop in param.properties" :key="prop.name">
          <code class="prop-bubble">{{ prop.name }}</code> ({{ prop.type }}, {{ prop.required ? 'required' : 'optional' }}): {{ prop.jsdoc || 'No description' }}
        </li>
      </ul>
    </li>
  </ul>
  <h3>Returns</h3>
  <p><code>{{ method.returns }}</code></p>
  <ul v-if="method.returnTypeDetails && method.returnTypeDetails.length">
    <li v-for="prop in method.returnTypeDetails" :key="prop.name">
      <code class="prop-bubble">{{ prop.name }}</code> ({{ prop.type }}, {{ prop.required ? 'required' : 'optional' }}): {{ prop.jsdoc || 'No description' }}
      <ul v-if="prop.properties && prop.properties.length">
        <li v-for="subProp in prop.properties" :key="subProp.name">
          <code class="prop-bubble">{{ subProp.name }}</code> ({{ subProp.type }}, {{ subProp.required ? 'required' : 'optional' }}): {{ subProp.jsdoc || 'No description' }}
        </li>
      </ul>
    </li>
  </ul>
</div>

<style>
.method-card { 
  border: 1px solid #ddd; 
  padding: 16px; 
  margin-bottom: 16px; 
  border-radius: 4px; 
}
.prop-bubble {
  background-color: #f6f8fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
  color: #24292e;
}
</style>
