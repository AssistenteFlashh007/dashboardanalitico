import { Router } from 'express'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dirname, '..', 'data', 'abtests.json')

function loadTests() {
  if (!existsSync(DATA_FILE)) return []
  try { return JSON.parse(readFileSync(DATA_FILE, 'utf-8')) } catch { return [] }
}

function saveTests(tests) {
  writeFileSync(DATA_FILE, JSON.stringify(tests, null, 2))
}

const router = Router()

router.get('/', (req, res) => {
  res.json({ success: true, data: loadTests() })
})

router.post('/', (req, res) => {
  const tests = loadTests()
  const test = req.body
  if (!test.id) test.id = Date.now().toString()
  tests.push(test)
  saveTests(tests)
  res.json({ success: true, data: test })
})

router.delete('/:id', (req, res) => {
  let tests = loadTests()
  tests = tests.filter(t => t.id !== req.params.id)
  saveTests(tests)
  res.json({ success: true })
})

export default router
