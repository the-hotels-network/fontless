import { FontVariant } from '../interfaces/fontData';

export let getCss = (
  host: string,
  variants: FontVariant[],
  display?: string,
  suffix?: string
) => {
  return variants
    .map(variant => {
      // Manifest family names arrive already quoted (e.g. "'Inknut Antiqua'") from the
      // google-webfonts-helper API, so the suffix has to go inside those quotes.
      let fontFamily = suffix
        ? `'${variant.fontFamily.replace(/^['"]|['"]$/g, '')} ${suffix}'`
        : variant.fontFamily;

      return `/* ${fontFamily} - ${variant.fontStyle} - ${variant.fontWeight} */
@font-face {
  font-family: ${fontFamily};
  font-style: ${variant.fontStyle};
  font-weight: ${variant.fontWeight};
  font-display: ${display || 'swap'};
  src: ${
    Array.isArray(variant.local)
      ? variant.local.map(l => `local('${l}')`).join(', ')
      : "local('')"
  },
        url('${host}${variant.woff2}') format('woff2'),
        url('${host}${variant.woff}') format('woff');
}
`;
    })
    .join('\n');
};
