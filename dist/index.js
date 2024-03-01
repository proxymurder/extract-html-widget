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
            table: [],
            vector: [],
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
                    keys: [],
                    normalized: [],
                    size: 0,
                    raw: x,
                };

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
                const { group, name } = x.nodes;
                const { source, target } = x.links;

                let s_n, s_l;
                if ((s_n = group.length) != name.length) return null;
                if ((s_l = source.length) != target.length) return null;

                df.vector[i] = {
                    size: {
                        links: 0,
                        nodes: 0,
                    },
                    data: [],
                    raw: x,
                };

                for (let j = 0; j < s_n; j++) {
                    df.vector[i].data[j] = {
                        normalized: {
                            source: `${j};${name[j]};${group[j]}`,
                            target: `${j};${name[j]};${group[j]}`,
                        },
                        id: j,
                        name: name[j],
                        group: group[j],
                        source: [],
                        target: [],
                    };
                }

                for (let j = 0; j < s_l; j++) {
                    let t = target[j];
                    let s = source[j];

                    if (!df.vector[i].data[t].source.includes(s)) {
                        df.vector[i].data[t].source.push(s);
                        df.vector[i].data[t].normalized.source += ';' + s;
                    }

                    if (!df.vector[i].data[s].target.includes(t)) {
                        df.vector[i].data[s].target.push(t);
                        df.vector[i].data[s].normalized.target += ';' + t;
                    }
                }
            }
        });

        return df;
    },
};
