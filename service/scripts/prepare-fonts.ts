import { promisify } from 'util';
import { pipeline } from 'stream';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import asciiArt from 'ascii-art-font';
import { Font } from '../interfaces/font';
import { FontData, FontVariant } from '../interfaces/fontData';

let publicPath = path.join(__dirname, '../public');
let fontsPath = path.join(publicPath, 'fonts');
let configPath = path.join(__dirname, '../fontless.config.json');

let printStartMessage = async () => {
  console.log(`
${await asciiArt.create('Fontless', 'Doom')}               Made by Varld.
      Learn more at https://varld.co/

Fonts are copyright of their respective authors. 
Licenses at https://fonts.google.com/attribution

Font data supplied by google-webfonts-helper.
Learn more at https://github.com/majodev/google-webfonts-helper
`);
};

function sleeper(ms: number) {
  return function() {
    return new Promise<void>(resolve => setTimeout(() => resolve(), ms));
  };
}

function getRandomArbitrary(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

let fetchFontData = async (font: Font, subsets = 'vietnamese,latin-ext,latin,greek-ext,greek,cyrillic-ext,cyrillic,khmer,korean'): Promise<FontData> => {
  console.log(`> Fetching font data for "${font.id}" ${subsets ? '' : '(retry)'}`);
  let res = await axios.get(
    `https://gwfh.mranftl.com/api/fonts/${font.id}${subsets ? `?subsets=${subsets}` : ''}`
  );

  return res.data;
};

let fetchFontsData = (fonts: Font[]) => {
  const promises = [];
  fonts.forEach((font) => {
      promises.push(
          Promise.all(promises)
            .then(sleeper(getRandomArbitrary(200, 800)))
            .then(() => fetchFontData(font))
            .catch(() => {
              return Promise.resolve()
                .then(sleeper(getRandomArbitrary(200, 800)))
                .then(() => fetchFontData(font, null));
            })
      );
  });
  return Promise.all(promises);
};

let getVariantFileName = (variant: FontVariant, type: string) =>
  `${variant.fontStyle || 'normal'}-${variant.fontWeight || '400'}.${type}`;

const streamPipeline = promisify(pipeline);

let fetchVariant = async (fontId: string, variant: FontVariant) => {
  let downloadAndCreateFont = async (type: 'woff' | 'woff2', retries = 5) => {
    let url = variant[type];
    let dest = path.join(fontsPath, fontId, getVariantFileName(variant, type));
    for (let i = 0; i < retries; i += 1) {
      try {
        console.log(`\t- ${variant.id}: ${type}${ i ? ` (retry ${i}/${retries})` : ''}`);
        let res = await axios.get(url, {
          responseType: 'stream',
          timeout: 20000 // 20 second timeout
        });
        await streamPipeline(
          res.data,
          fs.createWriteStream(dest)
        );
        return;
      } catch (err) {
        const isLastRetry = i === retries - 1;
        if (!isLastRetry) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
        console.error(`   🚨 Failed ${fontId} ${variant.id} ${type}: ${err.message}`);
        throw err;
      }
    }
  };

  await downloadAndCreateFont('woff');
  await downloadAndCreateFont('woff2');
};

let presentFont = (font: FontData) => ({
  id: font.id,
  family: font.family,
  category: font.category,
  lastModified: font.lastModified,
  variants: font.variants.map(variant => ({
    id: variant.id,
    local: variant.local,
    fontStyle: variant.fontStyle,
    fontWeight: variant.fontWeight,
    fontFamily: variant.fontFamily,
    woff: `/fonts/${font.id}/${getVariantFileName(variant, 'woff')}`,
    woff2: `/fonts/${font.id}/${getVariantFileName(variant, 'woff2')}`
  }))
});

let fetchFont = async (font: FontData) => {
  console.log(`> Downloading ${font.family}`);

  await fs.ensureDir(path.join(fontsPath, font.id));
  await fs.writeFile(
    path.join(fontsPath, font.id, 'data.json'),
    JSON.stringify(presentFont(font))
  );

  for (const variant of font.variants) {
      await fetchVariant(font.id, variant);
  }
};

let setupFonts = async (fonts: FontData[]) => {
  for (const font of fonts) {
      await fetchFont(font);
  }
};

let writeFontsData = async (fonts: FontData[], config: any) => {
  console.log(`> Writing font manifest`);

  await fs.writeFile(
    path.join(publicPath, 'fonts.json'),
    JSON.stringify({
      name: config.name || 'Varld Fontless',
      fonts: fonts.map(font => presentFont(font))
    })
  );
};

let main = async () => {
  if (!fs.existsSync(configPath)) {
    console.error('🚨 Missing `fontless.config.json`');
    process.exit(1);
  }

  let config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

  if (
    !config ||
    config.version != 'v1' ||
    config.type != 'varld-fontless-config' ||
    typeof config.fonts != 'object'
  ) {
    console.error('🚨 Invalid configuration file');
    process.exit(1);
  }

  let fonts = Object.values(config.fonts) as Font[];

  if (fonts.length < 1) {
    console.error('🚨 At least one font must be selected');
    process.exit(1);
  }

  await printStartMessage();

  let fontData = await fetchFontsData(fonts);
  await fs.ensureDir(fontsPath);
  await setupFonts(fontData);
  await writeFontsData(fontData, config);

  console.log('🔥 Fontless setup done.');
};

main().catch(err => {
  console.error('🚨 An error occurred during font fetching', err);
  process.exit(1);
});
