function camelize (str, initialCaps) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, idx) => {
    return idx === 0 && !initialCaps ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

function decamelize (str) {
  return str.replace(/(?<!^)[A-Z]/g, '-$&').toLowerCase();
}

function defineElements (visitorKeys) {
  // espree.VisitorKeys
  const elementNames = Object.keys(visitorKeys);
  const elementNamesForKeys = [
    ...new Set(Object.values(visitorKeys).flat())
  ].sort();

/*
      <j-test>
        <j-binary-expression operator="%">
          <j-left>
            <j-call-expression>
              <j-callee>
                <j-member-expression>
                  <j-object_>
                    <j-identifier name="Date"></j-identifier>
                  </j-object_>
                  <j-property>
                    <j-identifier name="now"></j-identifier>
                  </j-property>
                </j-member-expression>
              </j-callee>
            </j-call-expression>
          </j-left>
          <j-right>
            <j-literal value="2"></j-literal>
          </j-right>
        </j-binary-expression>
      </j-test>
      <j-consequent>
        <j-block-statement>
          <j-body_>
            <j-expression-statement>
              <j-expression>
                <j-call-expression>
                  <j-callee>
                    <j-identifier name="alert"></j-identifier>
                  </j-callee>
                  <j-arguments>
                    <j-literal
                    */

  function define (els, prefix) {
    els.forEach((el) => {
      // Can't reuse across elements
      const Element = class extends HTMLElement {};
      const elementName = decamelize(el);
      Object.defineProperty(Element, 'name', {value: elementName});
      customElements.define(`${prefix}-${elementName}`, Element);
    });
  }

  console.log(visitorKeys);
  console.log(Object.keys(visitorKeys));
  console.log(elementNamesForKeys);

  define(elementNames, 'j');
  define(elementNamesForKeys, 'jk');
}


(async () => {
  const req = await fetch(
    './node_modules/eslint-visitor-keys/lib/visitor-keys.json'
  );
  const visitorKeys = await req.json();
  const elementNames = Object.keys(visitorKeys);

  defineElements(visitorKeys);

  const ast = astForJElement(document.querySelector('body'), 'program');
  console.log('ast', ast[0]);

  function getKeyForElement (tag, prefix, initialCaps) {
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
    console.log(
      'ELE', prefix, `${prefix}-${customElement}`, matchingChildren
    );

    return matchingChildren.map((tag) => {
      const type = getKeyForElement(tag, prefix, prefix === 'j')
      return cb(tag, type);
    });
  }

  function handleJKElement (ast, containerElem, key) {
    handleCustomElement(containerElem, key, 'jk', (tag) => {
      console.log('type', tag, key);

      const elemNames = [...tag.children].map((child) => {
        console.log('ee', elementNames, getKeyForElement(child, 'j', true));
        return getKeyForElement(child, 'j', true);
      }).filter((locaName) => {
        return elementNames.includes(locaName);
      }).map((localName) => {
        return decamelize(localName);
      });
      elemNames.forEach((elemName) => {
        console.log('elemName', elemName, tag);
        const ast = astForJElement(tag, elemName)[0];
        const isArrayAST = [
          // Deprecated: head, handlers, guardedHandlers, blocks, contents
          'arguments', 'attributes',
          'body', 'children', 'cases', 'consequent', 'declarations',
          'elements', 'expressions',
          'params', 'properties',
          'quasis', 'specifiers'
        ].includes(key);
        ast[key] = isArrayAST ? ast : ast;
      });
    });
  }

  function astForJElement (containerElem, jElement) {
    return handleCustomElement(containerElem, jElement, 'j', (tag, type) => {
      const ast = {[type]: {
        type
      }};
      const keys = visitorKeys[type];
      keys.forEach((key) => {
        handleJKElement(ast, tag, key);
      });
      console.log('aaa', type, visitorKeys, keys);
      console.log(ast);

      return ast;
    });
  }
})();
