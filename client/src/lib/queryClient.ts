import { QueryClient, QueryCache } from "@tanstack/react-query";

async function readErrorMessage(res: Response) {
  const fallback =
    res.status === 404
      ? "Serveur API indisponible. Vérifiez que le backend est lancé et configuré."
      : res.statusText || "Une erreur est survenue.";

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return fallback;
  }

  try {
    const error = await res.json();
    return error.message || fallback;
  } catch {
    return fallback;
  }
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Serveur API indisponible. Vérifiez que le backend est lancé et configuré.");
  }

  return res.json();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5000,
      queryFn: async ({ queryKey }) => {
        const [url] = queryKey;

        if (typeof url !== "string") {
          throw new Error("A string URL query key is required.");
        }

        return fetchJson(url);
      },
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      console.error("Query error:", error);
    },
  }),
});

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  return res;
}
