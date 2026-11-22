const CLIENT_ID_STORAGE_KEY = "clientId";

export function getClientId() {
  const savedClientId = localStorage.getItem(
    CLIENT_ID_STORAGE_KEY
  );

  if (savedClientId) {
    return savedClientId;
  }

  const clientId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `client-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}`;

  localStorage.setItem(
    CLIENT_ID_STORAGE_KEY,
    clientId
  );

  return clientId;
}
