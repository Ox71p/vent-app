import GoTrue from 'gotrue-js';

const auth = new GoTrue({
  APIUrl: 'https://ventt.netlify.app/.netlify/identity',
  audience: '',
  setCookie: true,
});

auth.signup('testuser124@example.com', 'Password123!')
  .then(res => console.log('SUCCESS:', res))
  .catch(err => console.log('ERROR:', err.message, err.json, err));
