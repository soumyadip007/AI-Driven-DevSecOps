/** Explicit permission and tool boundary model for the demo agent. */

const PERMISSIONS = Object.freeze({
  READ_CODE: "READ_CODE",
  READ_FINDINGS: "READ_FINDINGS",
  RUN_CHECKS: "RUN_CHECKS",
  WRITE_BRANCH: "WRITE_BRANCH",
  OPEN_PR: "OPEN_PR",
});

/** Default demo profile: can read + write sandbox outputs, cannot merge. */
const DEFAULT_GRANT = new Set([
  PERMISSIONS.READ_CODE,
  PERMISSIONS.READ_FINDINGS,
  PERMISSIONS.RUN_CHECKS,
  PERMISSIONS.WRITE_BRANCH,
  // OPEN_PR intentionally omitted unless --allow-open-pr is passed
]);

const TOOL_REQUIREMENTS = Object.freeze({
  read_security_summary: [PERMISSIONS.READ_FINDINGS],
  read_file: [PERMISSIONS.READ_CODE],
  read_manifest: [PERMISSIONS.READ_CODE],
  propose_patch: [PERMISSIONS.WRITE_BRANCH],
  write_evidence: [PERMISSIONS.WRITE_BRANCH],
  run_tests: [PERMISSIONS.RUN_CHECKS],
  open_pr: [PERMISSIONS.OPEN_PR],
  merge_pr: [], // never granted
  production_deploy: [], // never granted
});

function createPermissionContext({ allowOpenPr = false } = {}) {
  const granted = new Set(DEFAULT_GRANT);
  if (allowOpenPr) granted.add(PERMISSIONS.OPEN_PR);
  return {
    granted,
    can(permission) {
      return granted.has(permission);
    },
    assertTool(toolName) {
      const required = TOOL_REQUIREMENTS[toolName];
      if (!required) {
        const err = new Error(`Tool not in allowlist: ${toolName}`);
        err.code = "TOOL_DENIED";
        throw err;
      }
      if (required.length === 0) {
        const err = new Error(`Tool permanently denied: ${toolName}`);
        err.code = "TOOL_DENIED";
        throw err;
      }
      for (const perm of required) {
        if (!granted.has(perm)) {
          const err = new Error(
            `Missing permission ${perm} for tool ${toolName}`
          );
          err.code = "PERMISSION_DENIED";
          throw err;
        }
      }
    },
  };
}

module.exports = {
  PERMISSIONS,
  TOOL_REQUIREMENTS,
  createPermissionContext,
};
