import handler from './index.js';
import { requireAuthenticated } from '../src/infrastructure/authSession.js';

export default async function authenticatedApiProxy(req,res){
  if(!requireAuthenticated(req,res)) return;
  return handler(req,res);
}
