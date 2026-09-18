Finance Lab TC is a renamed, locally hosted derivative of Noto Sans CJK TC
Regular, distributed under the SIL Open Font License 1.1 (see OFL.txt).

Source:
https://github.com/notofonts/noto-cjk/blob/main/Sans/OTF/TraditionalChinese/NotoSansCJKtc-Regular.otf

The source font was subset to this application's Traditional Chinese, Latin and
symbol repertoire with fontTools. Its CFF outlines were converted to TrueType
quadratic outlines for PDF reader compatibility. The font name was changed to
Finance Lab TC. FinanceLabTC.ttf is embedded in PDFs; FinanceLabTC.woff2 is used
on the website. Both files must be included in source uploads.

Rebuild only when changing the character repertoire:
  1. Download the licensed source to tmp/fonts/NotoSansCJKtc-Regular.otf.
  2. Install fonttools[woff]==4.59.0 and brotli==1.2.0 in a Python environment.
  3. Run python scripts/subset-font.py from the project root.
  4. Rebuild and inspect the generated PDFs.

Normal npm ci / npm run build does not need Python, an upstream download,
or this font generation step. The finished font files are supplied locally.
