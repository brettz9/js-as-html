import * as jsAsHTML from './index.js';

(async () => {
  const container = document.querySelector('body');
  const {json, code} = await (await jsAsHTML.setup({
    container
  })).get();

  const cols = 70;
  const rows = 20;

  const taHTML = document.createElement('textarea');
  taHTML.setAttribute('cols', cols);
  taHTML.setAttribute('rows', rows);
  const program = document.querySelector('j-program').outerHTML;
  taHTML.textContent = program;
  document.body.append(taHTML);

  const ta = document.createElement('textarea');
  ta.setAttribute('cols', cols);
  ta.setAttribute('rows', rows);
  ta.textContent = json;
  document.body.append(ta);

  const taCode = document.createElement('textarea');
  taCode.setAttribute('cols', cols);
  taCode.setAttribute('rows', rows);
  taCode.textContent = code;
  document.body.append(taCode);

  const evalButton = document.createElement('button');
  evalButton.textContent = 'Eval()';
  evalButton.addEventListener('click', () => {
    eval(code);
  });
  document.body.append(evalButton);
})();
