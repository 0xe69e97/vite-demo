import Koa from 'koa'
import { buildSync, transformSync } from 'esbuild'
import fs from 'fs'
import chokidar from 'chokidar'
import { WebSocketServer } from 'ws';
import path from 'path'

const PORT = 24678

const app = new Koa()
const Websocket = new WebSocketServer({ port: 1123 })

// HMR
Websocket.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  chokidar.watch('./vitesrc').on('change', changePath => {
    const filePath = path.resolve(__dirname, changePath);
    const data = fs.readFileSync(filePath, 'utf-8');
    ws.send('message', data);
  });

});

const __dirname = path.resolve(path.dirname(''));

app.use(async ctx => {
  const requestUrl = ctx.request.url

  if (requestUrl === '/') {
    // 根路径返回模版 HTML 文件
    const html = fs.readFileSync(`${__dirname}/index.html`, 'utf-8')
    ctx.type = 'text/html'
    ctx.body = html
  } else if (requestUrl.endsWith('.jsx')) {
    // jsx 文件返回 JavaScript 文件类型以及获取文件路径返回前端
    const filePath = path.join(__dirname, `/${requestUrl}`)
    const JSXFile = rewriteImport(fs.readFileSync(filePath).toString())

    const out = transformSync(JSXFile, {
      jsxFragment: 'Fragment',
      loader: 'jsx'
    })
    ctx.type = 'application/javascript'
    ctx.body = out.code
    return
  } else if (requestUrl.startsWith('/@modules/')) {
    const modulesName = requestUrl.replace('/@modules/', '')
    const entryFile = JSON.parse(fs.readFileSync(`${__dirname}/node_modules/${modulesName}/package.json`, 'utf8')).main
    const pkgPath = `${__dirname}/node_modules/${modulesName}/${entryFile}`
    let body = {}

    try {
      body = fs.readFileSync(`${__dirname}/node_modules/.vite/${modulesName}.js`)
    } catch (err) {
      // 使用 ESBuild 打包裸模块里的内容，转换为 ESM 供浏览器使用
      buildSync({
        entryPoints: [pkgPath],
        bundle: true,
        outfile: `${__dirname}/node_modules/.vite/${modulesName}.js`,
        format: 'esm',
      })
      body = fs.readFileSync(`${__dirname}/node_modules/.vite/${modulesName}.js`)
    }

    ctx.type = 'application/javascript'
    ctx.body = body
  } else if (requestUrl.endsWith('.css')) {
    const filePath = path.join(__dirname, `/${requestUrl}`)
    const CSSFile = JSON.stringify(fs.readFileSync(filePath).toString())

    const file = `
    const style = document.createElement('style')
    style.textContent = ${CSSFile}
    document.head.appendChild(style)
    export default {}`
    ctx.type = 'application/javascript'
    ctx.body = file
  } else if (requestUrl.endsWith('.svg')) {
    const filePath = path.join(__dirname, `/${requestUrl}`)
    const imageFile = fs.readFileSync(filePath)
    ctx.type = 'application/javascript'
    ctx.body = `export default 'data:image/svg+xml;base64,${Buffer.from(imageFile, 'binary').toString('base64')}'`
  } else {
    ctx.type = 'application/javascript'
    ctx.body = fs.readFileSync(path.join(__dirname, `/${requestUrl}`))
  }
})

function rewriteImport(content) {
  return content.replace(/ from ['"](.*)['"]/g, function (s0, s1) {
    if (s1.startsWith("./") || s1.startsWith("/") || s1.startsWith("../")) {
      return s0;
    } else {
      // 裸模块
      return ` from '/@modules/${s1}'`;
    }
  });
}

app.listen(PORT, () => {
  console.log(`听我号令： ${PORT} 端口，走！`)
})
