/**
 * Deploy-time overlay for this fork. Not an upstream change.
 *
 * Enables the KV binding wrangler auto-provisions, and attaches the custom
 * domain. Run before `wrangler deploy` / `cf deploy`. Safe to run twice.
 */
import fs from "node:fs"

const path = "wrangler.jsonc"
const hostname = process.env.OPENLIST_HOSTNAME || "openlist.f1nd.fun"
let text = fs.readFileSync(path, "utf8")

const kvEnabled = /^\s*"kv_namespaces"\s*:/m.test(text)
if (!kvEnabled) {
  const next = text.replace(
    /\/\/\s*"kv_namespaces":\s*\[\s*\{\s*"binding":\s*"KV"\s*\}\s*\],/,
    `  "kv_namespaces": [{ "binding": "KV" }],`,
  )
  if (next === text || !/^\s*"kv_namespaces"\s*:/m.test(next)) {
    throw new Error("could not enable kv_namespaces in wrangler.jsonc")
  }
  text = next
}

if (!text.includes(hostname)) {
  const idx = text.lastIndexOf("}")
  if (idx < 0) throw new Error("wrangler.jsonc has no closing brace")
  const route = `
  "routes": [
    { "pattern": "${hostname}", "custom_domain": true }
  ],
`
  text = text.slice(0, idx) + route + text.slice(idx)
}

fs.writeFileSync(path, text)
console.log(`overlay applied: KV + ${hostname}`)
