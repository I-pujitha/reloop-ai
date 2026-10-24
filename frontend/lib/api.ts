const BASE=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000/api';
export function getToken(){if(typeof window==='undefined')return '';return localStorage.getItem('reloop_token')||''}
export async function api<T=any>(path:string,options:RequestInit & {auth?:boolean}={}):Promise<T>{
 const headers=new Headers(options.headers);
 if(options.auth!==false){const token=getToken();if(token)headers.set('Authorization',`Bearer ${token}`)}
 if(options.body && !(options.body instanceof FormData) && !headers.has('Content-Type'))headers.set('Content-Type','application/json');
 const res=await fetch(`${BASE}${path}`,{...options,headers,cache:'no-store'});
 const data=await res.json().catch(()=>({error:'Server returned an unreadable response.'}));
 if(!res.ok)throw new Error(data.error||`Request failed (${res.status})`);
 return data as T;
}
export function saveSession(token:string){localStorage.setItem('reloop_token',token)}
export function logout(){localStorage.removeItem('reloop_token');window.location.href='/login'}
