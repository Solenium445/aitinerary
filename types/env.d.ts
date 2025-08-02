declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_OLLAMA_URL: string;
      EXPO_PUBLIC_OLLAMA_MODEL: string;
      EXPO_PUBLIC_GOOGLE_PLACES_API_KEY: string;
      EXPO_PUBLIC_AVIATION_STACK_API_KEY: string;
    }
  }
}

// Ensure this file is treated as a module
export {};