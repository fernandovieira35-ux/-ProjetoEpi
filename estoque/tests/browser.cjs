async function go(page, id) {
  if (
    await page.locator('#menu-toggle').isVisible() &&
    await page.locator('#menu-toggle').getAttribute('aria-expanded') === 'false'
  ) {
    await page.locator('#menu-toggle').click();
  }

  await page.locator('#navigation a[href="#' + id + '"]').click();
  await page.locator('#' + id).waitFor({ state: 'visible' });
}

const { chromium } = require('../../.tools/package');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');

async function poll(page, fn) {
  for (let i = 0; i < 100; i++) {
    if (await page.evaluate(fn)) return;
    await new Promise(r => setTimeout(r, 100));
  }

  throw new Error(
    'Condição não atingida: ' +
    await page.locator('#message').textContent()
  );
}

const server = http.createServer((req, res) => {
  const requestedPath = req.url.split('?')[0];
  const file = path.resolve(
    root,
    '.' + decodeURIComponent(
      requestedPath === '/' ? '/index.html' : requestedPath
    )
  );

  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404).end();
      return;
    }

    res.setHeader(
      'Content-Type',
      file.endsWith('.js') ? 'text/javascript' :
      file.endsWith('.css') ? 'text/css' :
      file.endsWith('.html') ? 'text/html' :
      'application/octet-stream'
    );

    res.end(data);
  });
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));

  const url = `http://127.0.0.1:${server.address().port}`;

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  try {
    const page = await browser.newPage();
    const errors = [];

    page.on('pageerror', e => errors.push(e.message));

    // 1. Testar a tela sem configuração do Supabase.
    // Interceptar antes do primeiro carregamento.

    const configRoute = '**/assets/js/config.js';

    await page.route(configRoute, r => r.fulfill({
      contentType: 'text/javascript',
      body: "export const config={url:'',publishableKey:''}"
    }));

    await page.goto(url);

    await poll(
      page,
      () => document.querySelector('#message')
        ?.textContent.includes('Configuração pendente')
    );

    assert.equal(
      await page.locator('#login-form button').isDisabled(),
      true
    );

    // 2. Substituir a configuração ausente
    // por valores simulados de teste.

    await page.unroute(configRoute);

    await page.route(configRoute, r => r.fulfill({
      contentType: 'text/javascript',
      body: "export const config={url:'https://teste.supabase.co',publishableKey:'sb_publishable_test'}"
    }));

    // 3. Simular a biblioteca Supabase.
    // Nenhuma conta real será criada.

    await page.route('**/assets/vendor/supabase.js', r => r.fulfill({
      contentType: 'text/javascript',
      body: `
        window.supabase = {
          createClient: () => ({
            auth: {
              signInWithPassword: async () => ({}),
              getUser: async () => ({
                data: {
                  user: {
                    id: 'user',
                    email: 'teste@example.test'
                  }
                }
              }),
              getSession: async () => ({
                data: { session: null },
                error: null
              }),
              onAuthStateChange: () => ({
                data: {
                  subscription: {
                    unsubscribe: () => {}
                  }
                }
              }),
              mfa: {
                listFactors: async () => ({
                  data: {
                    totp: [{
                      id: 'mfa',
                      status: 'verified'
                    }]
                  }
                }),
                challengeAndVerify: async () => ({}),
                getAuthenticatorAssuranceLevel: async () => ({
                  data: {
                    currentLevel: 'aal2',
                    nextLevel: 'aal2'
                  },
                  error: null
                })
              }
            },

            from: t => ({
              select: () => ({
                order: () => ({
                  range: async () => ({
                    data: ({
                      items: [{
                        id: 'item',
                        sku: 'L-1',
                        name: 'Luva <img src=x onerror=alert(1)>',
                        category_id: 'cat',
                        unit: 'par',
                        balance: 2,
                        minimum: 3
                      }],
                      categories: [{
                        id: 'cat',
                        name: 'Mãos'
                      }],
                      movements: [],
                      recipients: [{
                        id: 'recipient',
                        full_name: 'Recebedor Teste',
                        document_type: 'RG',
                        document_number: 'DEMO0001',
                        sector: 'Transporte'
                      }],
                      deliveries: [],
                      movement_reasons: [{
                        id: 'reason',
                        name: 'Entrega inicial de EPI',
                        guidance: 'Confira a entrega.',
                        active: true
                      }],
                      profiles: [{
                        id: 'user',
                        role: 'admin',
                        active: true
                      }]
                    })[t]
                  })
                })
              })
            }),

            rpc: async (name, args) => {
              if (name === 'access_status') {
                return {
                  data: {
                    active: true,
                    must_change_password: false
                  }
                };
              }

              if (name === 'epi_code_status') {
                return {
                  data: {
                    last_code: null,
                    next_code: 'EPI-001'
                  }
                };
              }

              window.lastRPC = { name, args };
              return { data: 1 };
            }
          })
        };
      `
    }));

    // 4. Recarregar usando apenas a API simulada.

    await page.reload();

    await page.locator('[name=email]').fill('teste@example.test');
    await page.locator('[name=password]').fill('AcessoTeste2026!');

    await page.locator('#login-form button').click();

    await page.locator('[name=code]').fill('123456');
    await page.locator('#mfa-form button').click();

    await page.locator('#workspace').waitFor({
      state: 'visible'
    });

    // 5. Validar indicadores e proteção XSS.

    assert.equal(
      await page.locator('#items-body img').count(),
      0
    );

    assert.equal(
      await page.locator('#low').textContent(),
      '1'
    );

    // 6. Validar responsividade e gerar capturas.

    fs.mkdirSync(
      path.resolve(__dirname, '../../.verificacao'),
      { recursive: true }
    );

    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({
        width,
        height: 1000
      });

      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth
        ),
        false
      );

      await page.screenshot({
        path: path.resolve(
          __dirname,
          `../../.verificacao/estoque-${width}.png`
        ),
        fullPage: true
      });
    }

    // 7. Testar os filtros do inventário.

    await go(page, 'inventario');

    await page.locator('#search').fill('inexistente');

    assert.match(
      await page.locator('#items-body').textContent(),
      /Nenhum item/
    );

    await page.locator('#search').fill('');

    // 8. Testar movimentação e entrega de EPI.

    await go(page, 'movimentacoes');

    await page.locator('#move-item').selectOption('item');
    await page.locator('[name=quantity]').fill('1');

    await page.locator('#move-recipient').selectOption('recipient');

    assert.equal(
      await page.locator('#delivered-by').getAttribute('readonly'),
      ''
    );

    await page.locator('#move-reason').selectOption(
      'Entrega inicial de EPI'
    );

    await page.locator('#move-form button').click();

    await poll(
      page,
      () => window.lastRPC?.name === 'deliver_epi'
    );

    assert.equal(
      (await page.evaluate(() => window.lastRPC.args)).p_quantity,
      1
    );

    // 9. Gerar planilha Excel simulada.

    const data = await page.evaluate(() => {
      const b = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        b,
        XLSX.utils.json_to_sheet([{
          codigo: 'L-2',
          nome: 'Outra luva',
          categoria: 'Mãos',
          unidade: 'par',
          minimo: 1
        }]),
        'Itens'
      );

      return Array.from(
        new Uint8Array(
          XLSX.write(b, {
            type: 'array',
            bookType: 'xlsx'
          })
        )
      );
    });

    await go(page, 'importacao');

    await page.locator('#file').setInputFiles({
      name: 'teste.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(data)
    });

    await poll(
      page,
      () => !document.querySelector('#confirm-import').disabled
    );

    assert.match(
      await page.locator('#preview').textContent(),
      /1 cadastros/
    );

    await page.locator('#confirm-import').click();

    await poll(
      page,
      () => window.lastRPC?.name === 'import_items'
    );

    // 10. Testar bloqueio de fórmulas em planilhas.

    const bad = await page.evaluate(() => {
      const b = XLSX.utils.book_new();

      const s = XLSX.utils.json_to_sheet([{
        codigo: 'L-3',
        nome: 'Luva',
        categoria: 'Mãos',
        unidade: 'par',
        minimo: 1
      }]);

      s.B2 = {
        t: 'n',
        f: '1+1',
        v: 2
      };

      XLSX.utils.book_append_sheet(b, s, 'Itens');

      return Array.from(
        new Uint8Array(
          XLSX.write(b, {
            type: 'array',
            bookType: 'xlsx'
          })
        )
      );
    });

    await page.locator('#file').setInputFiles({
      name: 'formula.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(bad)
    });

    await poll(
      page,
      () => document.querySelector('#message')
        .textContent.includes('Fórmulas não são permitidas')
    );

    assert.equal(
      await page.locator('#confirm-import').isDisabled(),
      true
    );

    // 11. Validar restauração de inventário.

    await page.locator('#import-mode').selectOption('restore');

    const backup = await page.evaluate(() => {
      const b = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        b,
        XLSX.utils.json_to_sheet([{
          codigo: 'L-1',
          nome: 'Luva',
          categoria: 'Mãos',
          unidade: 'par',
          minimo: 3,
          saldo: 5
        }]),
        'Inventario'
      );

      return Array.from(
        new Uint8Array(
          XLSX.write(b, {
            type: 'array',
            bookType: 'xlsx'
          })
        )
      );
    });

    await page.locator('#file').setInputFiles({
      name: 'backup.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(backup)
    });

    await poll(
      page,
      () => !document.querySelector('#confirm-import').disabled
    );

    await page.locator('#confirm-import').click();

    await poll(
      page,
      () => window.lastRPC?.name === 'restore_inventory'
    );

    assert.equal(
      (await page.evaluate(() => window.lastRPC.args))
        .p_rows[0].saldo,
      5
    );

    // 12. Validar impressão do relatório.

    await page.emulateMedia({ media: 'print' });

    assert.equal(
      await page.locator('.sidebar').isVisible(),
      false
    );

    assert.equal(
      await page.locator('#inventario').isVisible(),
      true
    );

    // 13. Verificar erros JavaScript capturados.

    assert.deepEqual(errors, []);

    console.log(
      'Navegador: login/MFA com API simulada, XSS, filtros, ' +
      'movimentação, Excel real, restauração, bloqueio de fórmula, ' +
      'impressão e 3 larguras: OK.'
    );

  } finally {
    await browser.close();
    server.close();
  }

})().catch(e => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});