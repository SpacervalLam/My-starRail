import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

export async function getGachaUrl(): Promise<string> {
  const res = await API.get('/gacha/url');
  return res.data.url;
}

export async function fetchGachaLogs(): Promise<any[]> {
  const res = await API.post('/gacha/fetch');
  return res.data.logs;
}