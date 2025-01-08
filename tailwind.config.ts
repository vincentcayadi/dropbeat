import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        playToPause: {
          "0%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        pauseToPlay: {
          "0%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "play-to-pause": "playToPause 0.3s ease-in-out",
        "pause-to-play": "pauseToPlay 0.3s ease-in-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
