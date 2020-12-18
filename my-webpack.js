// const { import } = require("jscodeshift");

const fs = require("fs")
const path = require("path")
const parser = require("@babel/parser")
const traverse = require("@babel/traverse").default
const babel = require("@babel/core")
const ENTRY = "./src/index.js"

function createAST(fileName) {
  // 获取入口文件内容
  const content  = fs.readFileSync(fileName, "utf-8")
  // 转为AST
  const ast = parser.parse(content, {
    //babel官方规定必须加这个参数，不然无法识别ES Module
    sourceType: "module"
  })
  let dependencies = {}
  // 通过traverse的ImportDeclaration的方法获取当前文件导入文件路径
  traverse(ast, {
    ImportDeclaration({node}) {
      //  node.source.value依赖文件的相对路径
      let relativePath = node.source.value
      const dirname = path.dirname(fileName)
      const absolutePath = path.join(dirname, relativePath)
      // dependencies: { './instance.js': 'src/instance.js' },
      // relative:absolute
      // 这样做的原因在于 build的代码文件引用路径都是相对路径。
      // 但是相对路径会导致依赖文件不能正确访问
      dependencies[relativePath] = absolutePath
    }
  })
  // //通过@babel/core和@babel/preset-env进行代码的转换
  const { code } = babel.transformFromAst(ast, null, {
    presets: ['@babel/preset-env']
  })
  return {
    dependencies,
    fileName,
    code,
  }
}

function creatGraph(entry) {
  const modules = createAST(entry)
  const graphArray = [modules]
  for (const module of graphArray) {
    let dependenciesArr = Object.values(module.dependencies)
    if (dependenciesArr && dependenciesArr.length) {
      // 循环执行转成AST、解析依赖获取导入文件路径、babel转义
      // 由单文件依赖图构建整个项目的依赖图
      dependenciesArr.forEach((dependenciesPath) => {
        graphArray.push(createAST(dependenciesPath))
      })
    }
  }
  let graphs = {}
  // src/instance: {dependencies: { './person/person.js': 'src/person/person.js' }, code:.....}
  graphArray.forEach(item => {
    graphs[item.fileName] = {
      dependencies: item.dependencies,
      code: item.code,
    }
  })
  return JSON.stringify(graphs)
}

function build(entry) {
  const graphs = creatGraph(entry)
  let result = ""
  !(function(graphs) {
    result = `
    !(function(graphs) {
      function require(module) {
        function localRequire(relativePath) {
          return require(graphs[module].dependencies[relativePath]);
        }
        const exports = {};
        !(function(require, exports, code) {
          eval(code);
        })(localRequire, exports, graphs[module].code);
        return exports;
      }
      require('${entry}');
    })(${graphs})
  `
  })(`${graphs}`)
  return result
}
build(ENTRY)