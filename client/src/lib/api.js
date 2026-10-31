export const api = async (url, options = {}) => {
  const isForm = options.body instanceof FormData;
  let response;
  try {
    response = await fetch(`/api${url}`, {
      credentials: "same-origin",
      ...options,
      headers: isForm ? undefined : { "Content-Type": "application/json" },
      body:
        options.body && !isForm ? JSON.stringify(options.body) : options.body,
    });
  } catch {
    throw new Error("Could not reach the server");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.status = response.status;
    throw error;
  }
  return data;
};

export const post = (url, body) => api(url, { method: "POST", body });
