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
                console.log(group.length != name.length);
                // if (group.length != name.length) return null;

                // // df.vector.push(x);
                // df.vector[i] = [];
                // for (const j in group.length)
                //     df.vector[i][j] = {
                //         normalized: {
                //             source: `${k};${name[j]};${group[j]}`,
                //             target: `${k};${name[j]};${group[j]}`,
                //         },
                //         id: j,
                //         name: name[j],
                //         group: group[j],
                //         links: {
                //             source: [],
                //             target: [],
                //         },
                //     };

                console.log(source.length != target.length);
                // if (source.length != target.length) return null;

                // for (const j in source.length) {
                //     let t = target[j];
                //     let s = source[j];

                //     if (!df.vector[t].links.source.includes(s)) {
                //         df.vector[t].links.source.push(s);
                //         df.vector[t].normalized.source += ';' + s;
                //     }

                //     if (!df.vector[s].links.target.includes(t)) {
                //         df.vector[s].links.target.push(t);
                //         df.vector[s].normalized.target += ';' + t;
                //     }
                // }
            }
        });

        return df;
    },
};
