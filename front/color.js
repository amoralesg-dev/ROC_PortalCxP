const fs = require('fs');
const PNG = require('pngjs').PNG;

function getTopColors(filename) {
    fs.createReadStream(filename)
        .pipe(new PNG())
        .on('parsed', function() {
            const counts = {};
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const idx = (this.width * y + x) << 2;
                    const r = this.data[idx];
                    const g = this.data[idx + 1];
                    const b = this.data[idx + 2];
                    const a = this.data[idx + 3];
                    if (a > 10) { // ignore mostly transparent
                        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                        counts[hex] = (counts[hex] || 0) + 1;
                    }
                }
            }
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
            console.log(`Top colors in ${filename}:`);
            sorted.forEach(([hex, count]) => console.log(`${hex} - ${count}`));
        });
}

getTopColors('src/app/img/RASSINI_Logo_color.png');
getTopColors('src/app/img/Logo naranja - blanco.png');
