/* eslint-disable */
const http = require('http')
const https = require('https')
const url = require('url')

function getJson(u) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(u)
    const lib = parsed.protocol === 'https:' ? https : http
  const req = lib.request(u, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

function isSortedNumberAsc(arr) {
  if (!arr) return false
  for (let i = 1; i < arr.length; i++) if (arr[i] < arr[i - 1]) return false
  return true
}

function isSortedNumberDesc(arr) {
  if (!arr) return false
  for (let i = 1; i < arr.length; i++) if (arr[i] > arr[i - 1]) return false
  return true
}

function isSortedStringAsc(arr) {
  if (!arr) return false
  for (let i = 1; i < arr.length; i++) {
    const a = String(arr[i - 1])
    const b = String(arr[i])
    if (a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }) > 0) return false
  }
  return true
}

async function run() {
  const BASE = process.env.TEST_API_URL || 'http://localhost:3000'
  try {
    console.log('Testing price_asc...')
    const r1 = await getJson(`${BASE}/products?sort=price_asc`)
    const pricesAsc = (r1.items || []).map((it) => Number(it.price))
    console.log('prices:', pricesAsc)
    console.log('price_asc sorted:', isSortedNumberAsc(pricesAsc))

    console.log('\nTesting price_desc...')
    const r2 = await getJson(`${BASE}/products?sort=price_desc`)
    const pricesDesc = (r2.items || []).map((it) => Number(it.price))
    console.log('prices:', pricesDesc)
    console.log('price_desc sorted:', isSortedNumberDesc(pricesDesc))

    console.log('\nTesting name_asc...')
    const r3 = await getJson(`${BASE}/products?sort=name_asc`)
    const names = (r3.items || []).map((it) => String(it.name))
    console.log('names:', names)
    // detailed check to find first out-of-order pair
    let nameSorted = true
    for (let i = 1; i < names.length; i++) {
      const a = String(names[i - 1])
      const b = String(names[i])
      const cmp = a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
      if (cmp > 0) {
        console.log(`Out of order at index ${i - 1} -> ${i}: "${a}" > "${b}" (cmp=${cmp})`)
        nameSorted = false
        break
      }
    }
    console.log('name_asc sorted:', nameSorted)

    const allOk = isSortedNumberAsc(pricesAsc) && isSortedNumberDesc(pricesDesc) && isSortedStringAsc(names)
    if (!allOk) {
      console.error('\nOne or more sorting checks failed.')
      process.exit(2)
    }
    console.log('\nAll sorting checks passed ✅')
    process.exit(0)
  } catch (e) {
    console.error('Error during tests:', e && e.message ? e.message : e)
    process.exit(3)
  }
}

run()
