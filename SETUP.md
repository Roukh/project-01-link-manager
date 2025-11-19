# Link Manager - Setup & Troubleshooting Guide

## 🚀 Quick Start

### 1. Create the Database Tables

Go to your Supabase SQL Editor and run this:

```sql
-- Create folders table
create table folders (
  id bigserial primary key,
  name text not null,
  parent_folder_id bigint references folders(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Create links table with folder support
create table links (
  id bigserial primary key,
  url text not null,
  title text not null,
  tags text[] default '{}',
  folder_id bigint references folders(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security on folders
alter table folders enable row level security;

-- Create policy to allow all operations on folders
create policy "folders-policy"
on "public"."folders"
as PERMISSIVE
for ALL
to public
using (true)
with check (true);

-- Enable Row Level Security on links
alter table links enable row level security;

-- Create policy to allow all operations on links
create policy "links-policy"
on "public"."links"
as PERMISSIVE
for ALL
to public
using (true)
with check (true);
```

**Note:** Empty folders are fully supported! Folders don't need to contain any links or subfolders to exist.

### 2. Run on a Local Server

**IMPORTANT:** ES6 modules (import/export) require a server. You CANNOT just open `index.html` directly in your browser!

#### Option A: VS Code Live Server (Recommended)
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"
3. Your browser will open at `http://127.0.0.1:5500`

#### Option B: Python Simple Server
```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

#### Option C: Node.js http-server
```bash
npx http-server -p 8000

# Then open: http://localhost:8000
```

### 3. Open Browser Console

Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac) to open Developer Tools and check the Console tab for debug messages.

## 🔍 What You Should See

### Console Output (If Working)
```
🚀 Initializing Link Manager...
📡 Supabase URL: https://eshmrgmtwghuhmlrbmmo.supabase.co
🔍 Fetching links from Supabase...
✅ Successfully fetched 0 links
📦 Loaded links: 0 links
✅ Link Manager initialized successfully
```

### Console Output (If NOT Working)
You'll see error messages with ❌ that tell you what's wrong.

## ⚠️ Common Issues

### Issue 1: "import declarations may only appear at top level of a module"
**Problem:** Opened `index.html` directly with `file://` protocol
**Solution:** Use a local server (see step 2 above)

### Issue 2: Database error - "relation 'links' does not exist" or "relation 'folders' does not exist"
**Problem:** Database tables not created
**Solution:** Run the SQL from step 1 in Supabase SQL Editor

### Issue 3: 401 Unauthorized error or "permission denied for table links/folders"
**Problem:** RLS policies not configured
**Solution:** Run the complete SQL from step 1, including all RLS policies

### Issue 4: Links don't display but no errors
**Problem:** Database is empty
**Solution:** Try adding a link using the form

### Issue 5: Network error / CORS error
**Problem:** Supabase credentials might be wrong
**Solution:** Double-check your Supabase URL and anon key in `app.js`

## 🧪 Testing Checklist

- [ ] Created `folders` and `links` tables in Supabase
- [ ] Set up RLS policies for both tables
- [ ] Running on a local server (not `file://`)
- [ ] Browser console shows green checkmarks (✅)
- [ ] Can create folders
- [ ] Can add links to folders
- [ ] Empty folders display correctly
- [ ] Links and folders persist after page refresh

## 📊 Debugging

The app now includes visual error messages! If something goes wrong, you'll see:
- A red error box in the UI
- Detailed error information
- A troubleshooting checklist

Check both:
1. **The UI** - for user-friendly error messages
2. **The Console** - for technical details

## 🎉 Success Indicators

When everything works, you should:
1. See "Loading links from database..." briefly
2. See your links displayed (or "No links saved yet" if database is empty)
3. Be able to add a new link and see it immediately
4. See the link still there after refreshing the page
5. Be able to delete links

## 🆘 Still Not Working?

Check the browser console for specific error messages and compare them to the common issues above.
