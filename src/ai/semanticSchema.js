export const semanticSchema={
 type:'object',additionalProperties:false,required:['documentZones','claims'],
 properties:{
  documentZones:{type:'array',items:{type:'object',additionalProperties:false,required:['text','zone','reason'],properties:{
   text:{type:'string'},zone:{type:'string',enum:['title','heading','label','ceremonial','preamble','body','footnote','unknown']},reason:{type:'string'}
  }}},
  claims:{type:'array',items:{type:'object',additionalProperties:false,required:['text','claimType','concepts','relations','ambiguities','questions'],properties:{
   text:{type:'string'},claimType:{type:'string'},
   concepts:{type:'array',items:{type:'object',additionalProperties:false,required:['label','role','meaningCandidate','confidence'],properties:{label:{type:'string'},role:{type:'string'},meaningCandidate:{type:'string'},confidence:{type:'number'}}}},
   relations:{type:'array',items:{type:'object',additionalProperties:false,required:['source','target','type','interpretation','confidence'],properties:{source:{type:'string'},target:{type:'string'},type:{type:'string'},interpretation:{type:'string'},confidence:{type:'number'}}}},
   ambiguities:{type:'array',items:{type:'object',additionalProperties:false,required:['target','reason','priority'],properties:{target:{type:'string'},reason:{type:'string'},priority:{type:'string'}}}},
   questions:{type:'array',items:{type:'object',additionalProperties:false,required:['question','reason','targets','kind','priority'],properties:{question:{type:'string'},reason:{type:'string'},targets:{type:'array',items:{type:'string'}},kind:{type:'string'},priority:{type:'string'}}}}
  }}}
 }
};
