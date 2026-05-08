import { rm } from "node:fs/promises"
import { resolve } from "node:path"

const targets = [resolve(".next"), resolve(".next-build")]

for (const target of targets) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(target, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 150
      })
      break
    } catch (error) {
      if (attempt === 4) {
        throw error
      }
    }
  }
}
