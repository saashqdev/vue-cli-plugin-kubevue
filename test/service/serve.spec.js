const gitClone = require('../helpers/gitClone');
const serve = require('../helpers/serveWithPuppeteer');
const { expect } = require('chai');
const sleep = require('../helpers/sleep');

describe('vue-cli-service serve', () => {
    it('cloud-admin-lite', async () => {
        const project = gitClone('https://github.com/saashqdev/kubevue-templates/cloud-admin-lite.git');
        await serve(
            () => project.execa('npm run dev'),
            async ({ page, nextUpdate, helpers }) => {
                expect((await helpers.getText('[class^="u-sidebar_item"][selected]')).trim()).to.equal('Overview');
                expect((await helpers.getText('[class^="s-navbar-right_username"]')).trim()).to.equal('Username');

                await page.evaluate(() => location = '#/demo/form/basic');
                await sleep(1000)
                expect((await helpers.getText('[class^="u-sidebar_item"][selected]')).trim()).to.equal('Basic form');
                expect((await helpers.getText('[class^="u-radios_radio"]')).trim()).to.equal('Yearly and monthly subscription');
            },
        );
    });
});
