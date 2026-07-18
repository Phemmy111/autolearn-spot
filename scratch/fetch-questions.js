const url = "https://kvnprkfdbhseqtfqymgl.supabase.co/rest/v1/questions?quiz_id=eq.f8ca1ede-a7a9-4d81-8a1b-d1df049ee7d5";
const key = "sb_publishable_ZO1vLkzpJ8AFp7aso1OWHA_POwXlJ9V";

fetch(url, {
  headers: {
    "apikey": key,
    "Authorization": "Bearer " + key
  }
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(err => console.error(err));
