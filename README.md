# webpack原理手写



- 找到入口文件
- 构建AST **@babel/parser**

```js

Node {
  type: 'File',
  start: 0,
  end: 164,
  loc: SourceLocation {
    start: Position { line: 1, column: 0 },
    end: Position { line: 15, column: 0 },
    filename: undefined,
    identifierName: undefined
  },
  range: undefined,
  leadingComments: undefined,
  trailingComments: undefined,
  innerComments: undefined,
  extra: undefined,
  errors: [],
  program: Node {
    type: 'Program',
    start: 0,
    end: 164,
    loc: SourceLocation {
      start: [Position],
      end: [Position],
      filename: undefined,
      identifierName: undefined
    },
    range: undefined,
    leadingComments: undefined,
    trailingComments: undefined,
    innerComments: undefined,
    extra: undefined,
    sourceType: 'module',
    interpreter: null,
    body: [ [Node], [Node], [Node] ],
    directives: []
  },
  comments: []
}
```

- 遍历抽象语法树的工具，我们可以在语法树中解析特定的节点，然后做一些操作，
如ImportDeclaration获取通过import引入的模块,FunctionDeclaration获取函数 
**@babel/traverse**



- 重复以上两步骤，构建ast、babel转es5，递归将所有依赖文件都构建依赖图Graph

```js
{
	"./src/index.js": {
		"dependencies": {
			"./instance.js": "src/instance.js"
		},
		"code": "\"use strict\";\n\nvar _instance = _interopRequireDefault(require(\"./instance.js\"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { \"default\": obj }; }\n\nfunction logName() {\n  console.log(\"%c\".concat(JSON.stringify(_instance[\"default\"])), 'color:blue');\n  console.log(\"my name is \".concat(_instance[\"default\"].name));\n}\n\nlogName();"
	},
	"src/instance.js": {
		"dependencies": {
			"./person/person.js": "src/person/person.js"
		},
		"code": "\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports[\"default\"] = void 0;\n\nvar _person = _interopRequireDefault(require(\"./person/person.js\"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { \"default\": obj }; }\n\nvar person = new _person[\"default\"](\"小伟\");\nvar _default = person;\nexports[\"default\"] = _default;"
	},
	"src/person/person.js": {
		"dependencies": {},
		"code": "\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports[\"default\"] = void 0;\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nvar Person = function Person(name) {\n  _classCallCheck(this, Person);\n\n  this.name = name;\n};\n\nexports[\"default\"] = Person;"
	}
}

```


- 构建bundle。代码在页面中是需要立即执行的，所以bundle函数返回的应该是一个IIFE。

我们写模块的时候，用的是 import/export.经转换后,变成了require/exports
我们要让require/exports能正常运行，那么我们得定义这两个东西，并加到bundle.js里
在依赖图谱里，代码都成了字符串。要执行，可以使用eval
定义一个require函数，require函数的本质是执行一个模块的代码，然后将相应变量挂载到exports对象上
获取整个项目的依赖图谱，从入口开始，调用require方法。 


```js

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
      require('./src/index.js');
    })({"./src/index.js":{"dependencies":{"./instance.js":"src/instance.js"},"code":"\"use strict\";\n\nvar _instance = _interopRequireDefault(require(\"./instance.js\"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { \"default\": obj }; }\n\nfunction logName() {\n  console.log(\"%c\".concat(JSON.stringify(_instance[\"default\"])), 'color:blue');\n  console.log(\"my name is \".concat(_instance[\"default\"].name));\n}\n\nlogName();"},"src/instance.js":{"dependencies":{"./person/person.js":"src/person/person.js"},"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports[\"default\"] = void 0;\n\nvar _person = _interopRequireDefault(require(\"./person/person.js\"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { \"default\": obj }; }\n\nvar person = new _person[\"default\"](\"小伟\");\nvar _default = person;\nexports[\"default\"] = _default;"},"src/person/person.js":{"dependencies":{},"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports[\"default\"] = void 0;\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nvar Person = function Person(name) {\n  _classCallCheck(this, Person);\n\n  this.name = name;\n};\n\nexports[\"default\"] = Person;"}})
```
