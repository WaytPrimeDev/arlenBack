import express from "express";
import cors from "cors";

import { env } from "utils/env";

export const startServer = () => {
  const server = express();
  server.use(cors());
  server.use(express.json());

  server
    .listen(Number(env.PORT), () => {
      console.log(`Server started on port ${env.PORT}`);
    })
    .on("error", (err) => {
      console.error("Server error:", err);
    });
};
