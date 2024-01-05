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
                const { group, name } = x.nodes;
                const { source, target } = x.links;

                let s_n, s_l;
                if ((s_n = group.length) != name.length) return null;
                if ((s_l = source.length) != target.length) return null;

                // // df.vector.push(x);
                df.vector[i] = {
                    size: {
                        links: 0,
                        nodes: 0,
                    },
                    data: [],
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

                    if (!df.vector[t].data[j].source.includes(s)) {
                        df.vector[t].data[j].source.push(s);
                        df.vector[t].data[j].normalized.source += ';' + s;
                    }

                    if (!df.vector[s].data[j].target.includes(t)) {
                        df.vector[s].data[j].target.push(t);
                        df.vector[s].data[j].normalized.target += ';' + t;
                    }
                }
            }
        });

        return df;
    },
};
