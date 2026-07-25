const url = "https://ventt.netlify.app/.netlify/identity/signup";
const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "testuser125@example.com", password: "Password123!" })
});
console.log(res.status);
console.log(await res.text());
