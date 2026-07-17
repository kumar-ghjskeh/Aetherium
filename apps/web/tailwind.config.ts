import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        aether: {
          canvas: "#101417",
          copper: "#c7895a",
          fog: "#d9e2dc",
          glass: "#1f2a2d",
          moss: "#6f8f72",
          signal: "#8fd1c7"
        }
      }
    }
  }
};

export default config;
