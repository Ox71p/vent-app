import GoTrue from 'gotrue-js';

const auth = new GoTrue({
  APIUrl: 'https://ventt.netlify.app/.netlify/identity',
  audience: '',
  setCookie: true,
});

export { auth };
