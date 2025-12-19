import axios from 'axios';

const API_BASE = 'https://api.vultr.com/v2';

function headers(apiKey){
  return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
}

export async function listInstances(apiKey){
  const res = await axios.get(`${API_BASE}/instances`, { headers: headers(apiKey) });
  return res.data;
}

export async function getInstance(apiKey, instanceId){
  const res = await axios.get(`${API_BASE}/instances/${instanceId}`, { headers: headers(apiKey) });
  return res.data;
}

export async function createInstance(apiKey, opts){
  // opts: {region, plan, os, label}
  const body = {
    region: opts.region,
    plan: opts.plan,
    label: opts.label || undefined,
  };
  if (opts.os) body.os = opts.os;
  const res = await axios.post(`${API_BASE}/instances`, body, { headers: headers(apiKey) });
  return res.data;
}

export async function startInstance(apiKey, instanceId){
  const res = await axios.post(`${API_BASE}/instances/${instanceId}/start`, {}, { headers: headers(apiKey) });
  return res.data;
}

export async function stopInstance(apiKey, instanceId){
  const res = await axios.post(`${API_BASE}/instances/${instanceId}/stop`, {}, { headers: headers(apiKey) });
  return res.data;
}

export async function pauseInstance(apiKey, instanceId){
  // We'll map pause to "halt" / power off
  const res = await axios.post(`${API_BASE}/instances/${instanceId}/halt`, {}, { headers: headers(apiKey) });
  return res.data;
}

export async function getInstanceStatus(apiKey, instanceId){
  const data = await getInstance(apiKey, instanceId);
  // some responses return instance under "instance"
  return data.instance || data;
}

export default { listInstances, getInstance, createInstance, startInstance, stopInstance, pauseInstance, getInstanceStatus };
