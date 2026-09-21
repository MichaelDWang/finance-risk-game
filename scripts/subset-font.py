"""Rebuild local, renamed Noto subset after changing report or UI content.
Requires fonttools[woff] and brotli. Download upstream font to tmp/fonts first.
"""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
root=Path(__file__).resolve().parents[1]
original=root/'tmp/fonts/NotoSansCJKtc-Regular.otf'
chars=set(chr(i) for i in range(32,127))
for folder in ['src','shared','worker']:
    for path in (root/folder).rglob('*.ts'):
        chars.update(path.read_text())
chars.update('香港時區年月日財務未完成—−×÷Σ✓◐◆●→↗／｜・')
font=TTFont(original)
cmap=font.getBestCmap()
cps={ord(c) for c in chars if not c.isspace()} | {32}
missing=cps-set(cmap)
if missing:
    print('Non-font syntax / unsupported source characters:', ''.join(chr(x) for x in sorted(missing)))
options=subset.Options(); options.layout_features=['*'];options.name_IDs=['*'];options.name_legacy=True;options.name_languages=['*']
sub=subset.Subsetter(options=options);sub.populate(unicodes=sorted(cps & set(cmap)));sub.subset(font)
for rec in font['name'].names:
    if rec.nameID in (1,4,6):
        value='FinanceLabTC' if rec.nameID==6 else 'Finance Lab TC'
        rec.string=value.encode(rec.getEncoding(),errors='replace')
font['CFF '].cff.fontNames=['FinanceLabTC']
font['CFF '].cff.topDictIndex[0].FamilyName='Finance Lab TC'
font['CFF '].cff.topDictIndex[0].FullName='Finance Lab TC'
out=root/'public/assets/fonts';out.mkdir(parents=True,exist_ok=True)
font.save(out/'FinanceLabTC.otf')
# Convert CFF outlines to TrueType for consistent PDF support. Drop layout
# substitutions: this subset is used only for Traditional Chinese and English.
glyph_set=font.getGlyphSet(); glyphs={}
for name in font.getGlyphOrder():
    pen=TTGlyphPen(glyph_set)
    glyph_set[name].draw(Cu2QuPen(pen,1.0,reverse_direction=True))
    glyphs[name]=pen.glyph()
fb=FontBuilder(font['head'].unitsPerEm,isTTF=True)
fb.setupGlyphOrder(font.getGlyphOrder())
fb.setupCharacterMap(font.getBestCmap())
fb.setupGlyf(glyphs)
fb.setupHorizontalMetrics(font['hmtx'].metrics)
fb.setupHorizontalHeader(ascent=font['hhea'].ascent,descent=font['hhea'].descent)
fb.setupOS2(sTypoAscender=font['OS/2'].sTypoAscender,sTypoDescender=font['OS/2'].sTypoDescender,usWinAscent=font['OS/2'].usWinAscent,usWinDescent=font['OS/2'].usWinDescent)
fb.setupNameTable({'familyName':'Finance Lab TC','styleName':'Regular','uniqueFontIdentifier':'FinanceLabTC-Regular-1.0','fullName':'Finance Lab TC Regular','psName':'FinanceLabTC-Regular','version':'Version 1.0','licenseDescription':'SIL Open Font License 1.1. Derived from Noto Sans CJK TC. See OFL.txt.'})
fb.setupPost();fb.setupMaxp()
fb.save(out/'FinanceLabTC.ttf')
fb.font.flavor='woff2';fb.save(out/'FinanceLabTC.woff2')
(out/'FinanceLabTC.otf').unlink()
print('Subset codepoints:',len(cps & set(cmap)))
print('TTF bytes:',(out/'FinanceLabTC.ttf').stat().st_size)
