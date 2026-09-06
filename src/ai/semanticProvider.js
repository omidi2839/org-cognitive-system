import { deterministicSemanticProvider } from './providers/deterministicSemanticProvider.js';
import { openAIResponsesSemanticProvider } from './providers/openAIResponsesSemanticProvider.js';

export function semanticProvider(){
 const name=String(process.env.AI_PROVIDER||'deterministic').toLowerCase();
 if(name==='openai')return openAIResponsesSemanticProvider;
 return deterministicSemanticProvider;
}
