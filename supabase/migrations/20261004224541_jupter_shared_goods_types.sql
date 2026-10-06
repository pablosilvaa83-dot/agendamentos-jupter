create table public.goods_types (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 2 and 100 and name=upper(btrim(name)) and name !~ '[\r\n]'),
 created_at timestamptz not null default now()
);
create unique index goods_types_name_unique on public.goods_types(lower(name));
alter table public.goods_types enable row level security;
grant select on public.goods_types to anon,authenticated;
grant insert on public.goods_types to authenticated;
grant all on public.goods_types to service_role;
create policy goods_types_read on public.goods_types for select to anon,authenticated using (true);
create policy goods_types_admin_insert on public.goods_types for insert to authenticated with check ((select public.is_admin()));
revoke insert,update,delete on public.admin_emails from anon,authenticated;
insert into public.goods_types(name) values ('CHOCOLATES/RECHEIOS'),('LEITE EM PÓ'),('MARGARINA/GORDURAS'),('MOLHOS'),('VINHOS'),('LEITE CONDENSADO/ CREME DE LEITE'),('EPS'),('TERMOFORMADOS'),('PS'),('ALUMÍNIO'),('ACRÍLICO'),('PAPEL/ PAPELÃO'),('SACOLAS'),('PP/ BD');