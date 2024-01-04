import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';

export const { extract_data } = {
    extract_data: function (file) {
        const input = readFileSync(file, {
            encoding: 'utf8',
            flag: 'r',
        });

        const { window } = new JSDOM(input);

        const d = window.document;

        const html_widgets = d.querySelectorAll('div.html-widget');

        let data = [];
        html_widgets.forEach((e) => {
            let id = e.getAttribute('id');
            var script = d.querySelector(`script[data-for="${id}"]`);

            if (!script) return;

            let { x } = JSON.parse(script.textContent || script.text || '{}');

            data.push(x);
        });

        return data;
    },
};
