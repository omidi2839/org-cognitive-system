export default function handler(req,res){
  res.statusCode=200;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.end(JSON.stringify({
    status:'ok',
    probe:'isolated-serverless',
    version:'0.9.0.7'
  }));
}
