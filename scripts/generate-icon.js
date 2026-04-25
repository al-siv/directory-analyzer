const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

async function main() {
  const svgPath = path.resolve(__dirname, '../resources/icon.svg')
  const pngPath = path.resolve(__dirname, '../resources/icon.png')

  const svg = fs.readFileSync(svgPath, 'utf-8')

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } })

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; background: transparent; }
          svg { width: 512px; height: 512px; display: block; }
        </style>
      </head>
      <body>
        ${svg}
      </body>
    </html>
  `)

  await page.screenshot({ path: pngPath, type: 'png', omitBackground: false })
  await browser.close()

  console.log('Generated', pngPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
