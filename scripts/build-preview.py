#!/usr/bin/env python3
"""
Build a single self-contained HTML preview of the web build.

  EXPO_OFFLINE=1 npx expo export -p web --output-dir dist-web
  python3 scripts/build-preview.py dist-web preview/index.html

Inlines the JS bundle and CSS, and subsets Zen Maru Gothic down to the glyphs the
app actually uses (the full fonts are ~3.7 MB each) so the page stays small.
Requires: pip install fonttools brotli
"""
import base64, io, pathlib, re, sys
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
dist = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2])

# Every character the UI can render in the accent font.
text = ''.join(p.read_text(encoding='utf-8') for p in [*ROOT.glob('app/**/*.tsx'), *ROOT.glob('src/**/*.ts*')])
chars = set(text) | {chr(c) for c in range(0x20, 0x7F)}
chars = ''.join(sorted(c for c in chars if c.isprintable()))

def font_face(weight_dir: str, family: str) -> str:
    src = next((ROOT / 'node_modules/@expo-google-fonts/zen-maru-gothic' / weight_dir).glob('*.ttf'))
    f = TTFont(src)
    opts = subset.Options()
    opts.flavor = 'woff2'
    s = subset.Subsetter(opts)
    s.populate(text=chars)
    s.subset(f)
    buf = io.BytesIO()
    f.flavor = 'woff2'
    f.save(buf)
    b64 = base64.b64encode(buf.getvalue()).decode()
    return f"@font-face{{font-family:'{family}';src:url(data:font/woff2;base64,{b64}) format('woff2');font-display:block}}"

fonts = '\n'.join(
    font_face(d, fam)
    for d, fam in [('500Medium', 'ZenMaruGothic_500Medium'), ('700Bold', 'ZenMaruGothic_700Bold'), ('900Black', 'ZenMaruGothic_900Black')]
)

html = (dist / 'index.html').read_text()
css = ''.join((dist / p.lstrip('/')).read_text() for p in re.findall(r'<link rel="stylesheet" href="([^"]+)"', html))
scripts = re.findall(r'<script src="([^"]+)" defer></script>', html)
js = '\n;\n'.join((dist / p.lstrip('/')).read_text() for p in scripts).replace('</script', '<\\/script')

html = re.sub(r'<link rel="preload"[^>]*>\s*', '', html)
html = re.sub(r'<link rel="stylesheet"[^>]*>', '', html)
html = re.sub(r'<script src="[^"]+" defer></script>', '', html)
html = html.replace('<meta httpEquiv="X-UA-Compatible" content="IE=edge" />\n', '')

# Expo Router reads location.pathname; the preview may be served from any path, so start at "/".
boot = (
    "try{if(location.pathname!=='/')history.replaceState(null,'','/'+location.search+location.hash)}catch(e){}"
    # Wide panels: report a phone-sized viewport to react-native-web so layout matches the framed #root.
    "try{var vv=window.visualViewport,P=VisualViewport.prototype,"
    "gw=Object.getOwnPropertyDescriptor(P,'width').get,gh=Object.getOwnPropertyDescriptor(P,'height').get;"
    "Object.defineProperty(vv,'width',{get:function(){return Math.min(gw.call(vv),430)}});"
    "Object.defineProperty(vv,'height',{get:function(){var h=gh.call(vv);return gw.call(vv)>430?Math.min(h-32,900):h}})}catch(e){}"
)
head_extra = f"""
<meta name="color-scheme" content="light dark" />
<style>{fonts}
{css}
:root{{--bg:#F6F3EE}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--bg:#121019}}}}
:root[data-theme="dark"]{{--bg:#121019}}
body{{background:var(--bg);margin:0}}
@media (min-width:431px){{
  html,body{{background:#E9E4DC}}
  @media (prefers-color-scheme: dark){{html,body{{background:#0A0910}}}}
  body{{display:flex;align-items:center;justify-content:center}}
  #root{{flex:none;width:430px;height:min(900px,calc(100% - 32px));border-radius:36px;overflow:hidden;
    box-shadow:0 0 0 2px #1B1A1F,0 24px 60px rgba(0,0,0,.25);background:var(--bg);transform:translateZ(0)}}
}}
</style>
<script>{boot}</script>
"""
# The artifact viewer supplies the document skeleton, so emit content only.
reset = re.search(r'<style id="expo-reset">.*?</style>', html, re.S).group(0)
html = (
    '<title>Shūchū</title>\n' + reset + head_extra
    + '<noscript>You need to enable JavaScript to run this app.</noscript>\n<div id="root"></div>\n'
    + f'<script>{js}</script>\n'
)
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'{out} {out.stat().st_size / 1024:.0f} KB, {len(chars)} glyphs')
