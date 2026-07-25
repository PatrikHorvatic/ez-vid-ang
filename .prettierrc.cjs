/** @type {import("prettier").Config} */
module.exports = {
  // Zagrade oko jedinog parametra arrow funkcije, npr. (x) => x umjesto x => x.
  arrowParens: "always",

  // Kod HTML/JSX elemenata, stavlja ">" otvarajućeg taga u novi red umjesto na kraj zadnjeg atributa.
  bracketSameLine: false,

  // Ispisuje razmake unutar vitičastih zagrada objekta, npr. { foo: bar } umjesto {foo: bar}.
  bracketSpacing: true,

  // Formatira samo fajlove čiji prvi docblock komentar sadrži "@noprettier" ili "@noformat" (obrnuto od requirePragma).
  checkIgnorePragma: false,

  // Koristi se samo kod formatiranja preko API-ja/editora - vraća poziciju kursora nakon formatiranja. -1 = ne prati.
  cursorOffset: -1,

  // Formatira kod ugniježđen u stringovima (npr. CSS u template literalima) kad Prettier prepozna jezik.
  embeddedLanguageFormatting: "auto",

  // Koji znak za kraj retka koristiti: lf, crlf, cr ili auto (zadrži postojeći iz fajla).
  endOfLine: "lf",

  // Gdje ispisati operator (+, &&, itd.) kad se binarni izraz prelomi u više redaka - "end" = na kraju prethodnog retka.
  experimentalOperatorPosition: "end",

  // Eksperimentalni format ternary izraza (upitnik odmah iza uvjeta, a ne na početku sljedećeg retka).
  experimentalTernaries: false,

  // Kako tretirati razmake u HTML-u. "ignore" = razmaci između elemenata se ne smatraju značajnima za prikaz.
  htmlWhitespaceSensitivity: "ignore",

  // Automatski ubacuje "@format" pragma komentar na vrh formatiranih fajlova.
  insertPragma: false,

  // Koristi jednostruke navodnike u JSX atributima (odvojeno od singleQuote, koji vrijedi za običan JS/TS).
  jsxSingleQuote: false,

  // Ako je objekt u izvornom kodu već napisan prelomljen u više redaka (novi red odmah nakon "{"), Prettier to zadržava.
  objectWrap: "preserve",

  // Popis dodatnih Prettier plugin paketa koje treba učitati.
  plugins: [],

  // Ciljna maksimalna širina retka prije nego Prettier pokuša prelomiti kod u više redaka.
  printWidth: 250,

  // Kako lomiti tekst u Markdown fajlovima. "preserve" = zadrži postojeće prelome redaka iz izvora.
  proseWrap: "preserve",

  // Navodnici oko imena propertyja u objektu samo kad su nužni (npr. sadrže razmak ili poseban znak).
  quoteProps: "as-needed",

  // Formatiraj počevši od zadanog znaka u fajlu - koristi se za formatiranje samo dijela fajla (npr. selekcije u editoru).
  rangeStart: 0,

  // Formatiraj samo fajlove koji imaju "@prettier" ili "@format" u prvom docblock komentaru.
  requirePragma: false,

  // Ispisuje točku-zarez na kraju naredbi.
  semi: true,

  // Prisili točno jedan atribut po retku u HTML/Vue/JSX elementima, čak i kad bi više atributa stalo u jedan red.
  singleAttributePerLine: false,

  // Koristi dvostruke navodnike umjesto jednostrukih u JS/TS kodu.
  singleQuote: false,

  // Broj razmaka po razini uvlačenja.
  tabWidth: 2,

  // Ispisuje zarez iza zadnjeg elementa/argumenta kad je lista prelomljena u više redaka.
  trailingComma: "all",

  // Koristi tabove umjesto razmaka za uvlačenje.
  useTabs: false,

  // Uvlači <script>/<style> blokove unutar Vue fajlova. Nebitno za ovaj projekt (nema Vue komponenti).
  vueIndentScriptAndStyle: false,

  // Postavke specifične za pojedini tip fajla.
  overrides: [
    {
      // Angular predlošci (.component.html) koriste "angular" parser - jedini koji ispravno
      // indentira @if / @for / @switch control-flow blokove umjesto da ih ostavi neuvučene.
      files: "*.html",
      options: {
        parser: "angular",
      },
    },
  ],
};
