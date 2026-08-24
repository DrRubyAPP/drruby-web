import { defineRailway, project, service } from "railway/iac";

export default defineRailway(() => {
  const web = service("drruby-web", {
    // preDeployCommand from CaC: "pnpm prisma migrate deploy"
  });

  return project("drruby-web", {
    resources: [web],
  });
});
