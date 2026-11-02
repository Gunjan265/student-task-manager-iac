const HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Student Task Manager</title>
<style>
 body{font-family:Arial,sans-serif;max-width:760px;margin:30px auto;padding:0 12px}
 h1{color:#f6821f}
 input,select,button{padding:8px;margin:3px;font-size:14px}
 input{width:300px}
 table{width:100%;border-collapse:collapse;margin-top:16px}
 td,th{border:1px solid #ccc;padding:8px;text-align:left}
 th{background:#f4f4f4}
</style></head><body>
<h1 id="heading">Student Task Manager</h1>
<div>
 <input id="title" placeholder="Task title">
 <select id="priority"><option>High</option><option>Medium</option><option>Low</option></select>
 <button id="add">Add Task</button>
</div>
<table><thead><tr><th>ID</th><th>Task</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>
<tbody id="list"></tbody></table>
<script>
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
async function load(){
  var r=await fetch('/api/tasks');var tasks=await r.json();
  document.getElementById('list').innerHTML=tasks.map(function(t){
    return '<tr><td>'+esc(t.id)+'</td><td>'+esc(t.title)+'</td><td>'+esc(t.priority)+'</td><td>'+esc(t.status)+'</td><td>'+
      '<button data-a="toggle" data-id="'+t.id+'" data-s="'+t.status+'">Toggle</button> '+
      '<button data-a="del" data-id="'+t.id+'">Delete</button></td></tr>';
  }).join('');
}
document.getElementById('add').addEventListener('click',async function(){
  var title=document.getElementById('title').value.trim(); if(!title) return;
  await fetch('/api/tasks',{method:'POST',body:JSON.stringify({title:title,priority:document.getElementById('priority').value,status:'Pending'})});
  document.getElementById('title').value=''; load();
});
document.getElementById('list').addEventListener('click',async function(e){
  var b=e.target; if(!b.dataset.a) return;
  if(b.dataset.a==='toggle'){
    await fetch('/api/tasks/'+b.dataset.id,{method:'PUT',body:JSON.stringify({status:b.dataset.s==='Pending'?'Completed':'Pending'})});
  } else {
    await fetch('/api/tasks/'+b.dataset.id,{method:'DELETE'});
  }
  load();
});
load();
</script></body></html>`;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const method = request.method;

    if (path === "/") {
      return new Response(HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (path === "/api/tasks") {
      if (method === "GET") {
        const list = await env.TASKS_KV.list({ prefix: "T" });
        const tasks = await Promise.all(list.keys.map(k => env.TASKS_KV.get(k.name, "json")));
        return json(tasks.filter(Boolean));
      }
      if (method === "POST") {
        let body;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
        if (!body.title) return json({ error: "title is required" }, 400);
        const id = "T" + Date.now().toString().slice(-7);
        const task = {
          id,
          title: body.title,
          priority: body.priority || "Medium",
          status: body.status || "Pending",
          createdDate: new Date().toISOString(),
        };
        await env.TASKS_KV.put(id, JSON.stringify(task));
        return json(task, 201);
      }
    }

    const m = path.match(/^\/api\/tasks\/(\w+)$/);
    if (m) {
      const id = m[1];
      const existing = await env.TASKS_KV.get(id, "json");
      if (!existing) return json({ error: "Task not found" }, 404);
      if (method === "GET") return json(existing);
      if (method === "PUT") {
        let body;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
        const updated = { ...existing, ...body, id };
        await env.TASKS_KV.put(id, JSON.stringify(updated));
        return json(updated);
      }
      if (method === "DELETE") {
        await env.TASKS_KV.delete(id);
        return json({ message: "Task deleted" });
      }
    }

    return json({ error: "Not found" }, 404);
  },
};
