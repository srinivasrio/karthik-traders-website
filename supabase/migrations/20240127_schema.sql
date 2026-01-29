-- Drop tables if they exist to ensure clean setup
drop table if exists public.contact_inquiries;
drop table if exists public.order_items;
drop table if exists public.orders;
drop table if exists public.products;
drop table if exists public.profiles;


-- 1. Profiles Table
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  mobile text unique not null,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 2. Products Table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  category text not null check (category in ('aerators', 'spares', 'motors', 'gearboxes')),
  price numeric(10,2) not null,
  mrp numeric(10,2),
  stock integer default 0,
  is_active boolean default true,
  images text[],
  specifications jsonb,
  description text,
  created_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "Public can view active products" on public.products
  for select using (is_active = true);

create policy "Admins can insert products" on public.products
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update products" on public.products
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete products" on public.products
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 3. Orders Table
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric(10,2) not null,
  shipping_address jsonb,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users can view own orders" on public.orders
  for select using (auth.uid() = user_id);

create policy "Users can insert own orders" on public.orders
  for insert with check (auth.uid() = user_id);

create policy "Admins can view all orders" on public.orders
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update orders" on public.orders
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 4. Order Items Table
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null check (quantity > 0),
  price_at_purchase numeric(10,2) not null
);

alter table public.order_items enable row level security;

create policy "Users can view own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );

create policy "Users can insert own order items" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );

create policy "Admins can view all order items" on public.order_items
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 5. Contact Inquiries Table
create table public.contact_inquiries (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  mobile text not null,
  message text not null,
  status text default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz default now()
);

alter table public.contact_inquiries enable row level security;

create policy "Public can insert inquiries" on public.contact_inquiries
  for insert with check (true);

create policy "Admins can view inquiries" on public.contact_inquiries
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update inquiries" on public.contact_inquiries
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
