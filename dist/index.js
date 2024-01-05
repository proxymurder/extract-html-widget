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

        let df = {
            node: [],
            table: [],
        };

        for (const i in html_widgets) {
            let id = html_widgets[i].getAttribute('id');
            var s = d.querySelector(`script[data-for="${id}"]`);

            if (!s) return null;

            let { x } = JSON.parse(s.textContent || s.text || '{}');

            const o = x.options;

            if (o.hasOwnProperty('columnDefs')) {
                const defs = o.columnDefs;

                df.table[i] = {
                    keys: [],
                    raw: [],
                    size: 0,
                };

                for (const j in defs) {
                    if (defs[j].name && defs[j].name != 'Id') {
                        if (defs[j].name != ' ') {
                            const name = `${defs[j].name}`
                                .split('.')
                                .join('_')
                                .toLowerCase();

                            const target = x.data[defs[j].targets];

                            if (target.length != df.table[i].size) return null;

                            df.table[i].keys.push(name);

                            df.table[i][name] = {
                                data: target,
                            };

                            df.table[i].raw = df.table[i].raw.map((r, i) => {
                                return r + ';' + target[i];
                            });
                        } else {
                            let target = x.data[defs[j].targets];

                            df.table[i].size = target.length;
                            df.table[i].raw = target;
                        }
                    }
                }
            }
        }

        return df;
    },
};
