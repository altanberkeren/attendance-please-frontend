import { defineConfig } from "orval"

export default defineConfig({
  attendanceApi: {
    input: {
      target: "./v1.json",
    },
    output: {
      mode: "tags-split",
      target: "./lib/api",
      schemas: "./lib/api/model",
      client: "react-query",
      httpClient: "axios",
      override: {
        mutator: {
          path: "./lib/axios-instance.ts",
          name: "customInstance",
        },
      },
    },
  },
})
