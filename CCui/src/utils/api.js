
export const api = {
  get: async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      return await res.json();
    } catch (e) {
      console.error("GET Error:", e);
      throw e;
    }
  },
  post: async (url, body) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      return await res.json();
    } catch (e) {
      console.error("POST Error:", e);
      throw e;
    }
  }
};
