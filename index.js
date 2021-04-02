import escodegen from './vendor/escodegen.js';

const VISITOR_KEY_PREFIX = 'j';
const AST_PROPERTY_PREFIX = 'jk';

let DEBUG = 0;
export function debug (val) {
  DEBUG = val;
}

function log (...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

function camelize (str, initialCaps) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, idx) => {
    return idx === 0 && !initialCaps ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

function decamelize (str) {
  return str.replace(/(?<!^)[A-Z]/g, '-$&').toLowerCase();
}

export function defineElements (visitorKeys) {
  // espree.VisitorKeys
  const elementNames = Object.keys(visitorKeys);
  const elementNamesForKeys = [
    ...new Set(Object.values(visitorKeys).flat())
  ].sort();

  function define (els, prefix) {
    els.forEach((el) => {
      // Can't reuse across elements
      const Element = class extends HTMLElement {};
      const elementName = decamelize(el);
      Object.defineProperty(Element, 'name', {value: elementName});
      customElements.define(`${prefix}-${elementName}`, Element);
    });
  }

  log(visitorKeys);
  log(Object.keys(visitorKeys));
  log(elementNamesForKeys);

  define(elementNames, VISITOR_KEY_PREFIX);
  define(elementNamesForKeys, AST_PROPERTY_PREFIX);
}

function getKeyForElement (tag, prefix) {
  const initialCaps = prefix === VISITOR_KEY_PREFIX;
  return camelize(
    tag.localName.slice(prefix.length + 1), initialCaps
  ).replace(/-/g, '');
}

function handleCustomElement (containerElem, customElement, prefix, cb) {
  const matchingChildren = [
    ...containerElem.children
  ].filter((child) => {
    return child.localName === `${prefix}-${customElement}`;
  });
  log(
    'ELE', prefix, `${prefix}-${customElement}`, matchingChildren
  );

  return matchingChildren.map((tag) => {
    const type = getKeyForElement(tag, prefix)
    return cb(tag, type);
  });
}

export async function setup ({
  visitorKeys = './node_modules/eslint-visitor-keys/lib/visitor-keys.json',
  container = document.body,
  autoDefine = true
} = {}) {
  if (typeof visitorKeys === 'string') {
    const req = await fetch(visitorKeys);
    visitorKeys = await req.json();
  }

  const elementNames = Object.keys(visitorKeys);

  function handleJKElement (ast, containerElem, key) {
    handleCustomElement(containerElem, key, AST_PROPERTY_PREFIX, (tag) => {
      log('type', tag, key);

      const elemNames = [...tag.children].map((child) => {
        log('ee', elementNames, getKeyForElement(child, VISITOR_KEY_PREFIX));
        return getKeyForElement(child, VISITOR_KEY_PREFIX);
      }).filter((locaName) => {
        return elementNames.includes(locaName);
      }).map((localName) => {
        return decamelize(localName);
      });

      const isArrayAST = [
        // See https://github.com/estree/estree (searched for `: [`)
        // Deprecated: head, handlers, guardedHandlers, blocks, contents
        'arguments', 'attributes',
        'body', 'children', 'cases',
        // 'consequent',
        'declarations',
        'elements', 'expressions',
        'params', 'properties',
        'quasis', 'specifiers'
      ].includes(key);

      if (!elemNames.length) {
        ast[key] = isArrayAST ? [] : null;
        return;
      }
      elemNames.forEach((elemName) => {
        log('elemName', elemName, tag);
        let elementAST = astForJElement(tag, elemName);
        elementAST = elementAST.map((ast) => {
          return Object.values(ast);
        })[0];
        ast[key] = isArrayAST ? elementAST : elementAST[0];
      });
    });
  }

  function astForJElement (containerElem, jElement) {
    return handleCustomElement(containerElem, jElement, VISITOR_KEY_PREFIX, (tag, type) => {
      const childAST = {
        type
      };
      const ast = {[type]: childAST};
      const keys = visitorKeys[type];
      keys.forEach((key) => {
        log('key', key, childAST);
        handleJKElement(childAST, tag, key);
      });

      const key = getKeyForElement(tag, VISITOR_KEY_PREFIX);

      // Todo: Specify or detect type, e.g., to parse as float?
      const map = new Map([
        ['Identifier', {allowableAttributes: ['name']}],
        ['Literal', {allowableAttributes: ['value'], json: ['value']}],
        ['BinaryExpression', {allowableAttributes: ['operator']}]
      ]);

      [...tag.attributes].forEach(({name: attName, value}) => {
        if (map.has(key)) {
          const {allowableAttributes, json} = map.get(key);
          if (allowableAttributes.includes(attName)) {
            childAST[attName] = json?.includes(attName) ? JSON.parse(value) : value;
            log('attribute', key, attName);
          }
        }
      });
      log('aaa', type, visitorKeys, keys);
      log(ast);

      return ast;
    });
  }

  if (autoDefine) {
    defineElements(visitorKeys);
  }

  return {
    evaluate () {
      (0, eval)(this.getCode());
    },
    get () {
      return {
        ast: this.ast,
        json: this.getJSON(),
        code: this.getCode()
      };
    },
    getAST () {
      const program = astForJElement(container, 'program');
      const ast = program[0].Program;
      log('ast', ast);
      this.ast = ast;

      return ast;
    },
    getJSON () {
      const ast = this.ast || this.getAST();
      const json = JSON.stringify(ast, null, 2);
      log('json', json);

      return json;
    },
    getCode () {
      const ast = this.ast || this.getAST();
      const code = escodegen.generate(ast, {
        // Need for `raw`
        // parse: true
      });
      log('code', code);

      return code;
    }
  };
}
