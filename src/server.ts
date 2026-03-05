import express from "express";
import cors from "cors";

import { env } from "utils/env";
import { router } from "routers";
import { notFoundRoutes } from "middlewares/notFoundRoutes";
import { errorHandler } from "middlewares/errorHandler";

export const startServer = () => {
  const server = express();
  server.use(cors());
  server.use(express.json());
  server.use(router);
  server.use(notFoundRoutes);
  server.use(errorHandler);

  server
    .listen(Number(env.PORT), () => {
      console.log(`Server started on port ${env.PORT}`);
    })
    .on("error", (err) => {
      console.error("Server error:", err);
    });
};
