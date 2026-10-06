const cors = {'Access-Control-Allow-Origin':'https://agendamentos-jupter.vercel.app','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const base=Deno.env.get('SUPABASE_URL')!;
const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
async function adminFetch(path:string,method='GET',body?:unknown){
 return fetch(base+path,{method,headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return reply({error:'Método não permitido.'},405);
 try{
  const authorization=req.headers.get('Authorization')||'';
  if(!authorization.startsWith('Bearer '))return reply({error:'Entre na área interna.'},401);
  const userResponse=await fetch(base+'/auth/v1/user',{headers:{apikey:secret,Authorization:authorization}});
  if(!userResponse.ok)return reply({error:'Sessão inválida. Entre novamente.'},401);
  const caller=await userResponse.json();
  if(!caller.id||!caller.email||!caller.email_confirmed_at)return reply({error:'Acesso não autorizado.'},403);
  const allowed=await adminFetch('/rest/v1/admin_emails?select=email&email=eq.'+encodeURIComponent(caller.email.toLowerCase()));
  if(!allowed.ok)return reply({error:'Não foi possível verificar as permissões.'},503);
  if(!(await allowed.json()).length)return reply({error:'Somente administradores podem gerenciar usuários.'},403);
  const input=await req.json();
  if(input.action!=='create')return reply({error:'Ação inválida.'},400);
  const email=String(input.email||'').trim().toLowerCase(),name=String(input.name||'').trim(),password=String(input.password||'');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||name.length<2||name.length>100||password.length<10||password.length>128)return reply({error:'Informe nome, e-mail válido e senha de 10 a 128 caracteres.'},400);
  const created=await adminFetch('/auth/v1/admin/users','POST',{email,password,email_confirm:true,user_metadata:{name}});
  const result=await created.json();
  if(!created.ok)return reply({error:created.status===422?'Este e-mail já está cadastrado ou os dados são inválidos.':'Não foi possível cadastrar o usuário.'},400);
  const access=await adminFetch('/rest/v1/admin_emails','POST',{email});
  if(!access.ok){
   await adminFetch('/auth/v1/admin/users/'+encodeURIComponent(result.id),'DELETE');
   return reply({error:'Não foi possível liberar a permissão. O cadastro foi desfeito.'},500);
  }
  return reply({user:{id:result.id,email,name},message:'Usuário cadastrado. O acesso com a senha já está liberado.'});
 }catch{return reply({error:'Não foi possível concluir. Tente novamente.'},500);}
});
