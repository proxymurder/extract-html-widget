import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';

export const { extract_data } = {
    extract_data: function (file) {
        const input = readFileSync(file, {
            encoding: 'utf8',
            flag: 'r',
        });

        const { window } = new JSDOM(input);

        const html_widget = window.document.querySelectorAll('div.html-widget');

        let df = {
            vector: [],
            table: [],
        };

        html_widget.forEach((w, i) => {
            let id = w.getAttribute('id');
            var s = window.document.querySelector(`script[data-for="${id}"]`);

            if (!s) return null;

            let { x } = JSON.parse(s.textContent || s.text || '{}');

            const o = x.options;

            if (o.hasOwnProperty('columnDefs')) {
                const defs = o.columnDefs;

                df.table[i] = {
                    raw: [],
                    keys: [],
                    normalized: [],
                    size: 0,
                };

                df.table[i].raw.push(x);

                for (const j in defs) {
                    if (!defs[j].name || defs[j].name == 'Id') continue;

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

                        df.table[i].normalized = df.table[i].normalized.map(
                            (r, i) => {
                                return r + ';' + target[i];
                            }
                        );
                    } else {
                        let target = x.data[defs[j].targets];

                        df.table[i].size = target.length;
                        df.table[i].normalized = target;
                    }
                }
            } else if (o.hasOwnProperty('NodeID')) {
                df.vector.push(x);

                const { group, name } = x.nodes;
                const { source, target } = x.links;

                if (group.length != name.length) return null;

                for (const i in group.length)
                    df.vector[i] = {
                        id: j,
                        name: name[j],
                        group: group[j],
                        links: {
                            source: [],
                            target: [],
                        },
                    };

                if (source.length != target.length) return null;

                for (const i in source.length) {
                    let t = target[i];
                    let s = source[i];

                    if (!df.vector[t].links.source.includes(s))
                        df.vector[t].links.source.push(s);

                    if (!df.vector[s].links.target.includes(t))
                        df.vector[s].links.target.push(t);
                }
            }
        });

        return df;
    },
};
