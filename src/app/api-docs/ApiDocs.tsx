"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

// Scalar reads the generated spec served from /openapi.json (public/).
export function ApiDocs() {
  return (
    <ApiReferenceReact
      configuration={{ _integration: "nextjs", url: "/openapi.json" }}
    />
  );
}
