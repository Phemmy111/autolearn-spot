import sys

file_path = "app/api/certificate/download/route.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

text_to_replace = """    // Fetch font for the cursive name
    const fontRes = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/great-vibes@latest/latin-400-normal.ttf')
    const fontData = await fontRes.arrayBuffer()"""

replacement = """    // Fetch font for the cursive name
    const fontRes = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-600-normal.ttf')
    const fontData = await fontRes.arrayBuffer()"""

content = content.replace(text_to_replace, replacement)

text_to_replace2 = """          {
            name: 'GreatVibes',
            data: fontData,
            style: 'normal',
            weight: 400
          }"""

replacement2 = """          {
            name: 'Playfair Display',
            data: fontData,
            style: 'normal',
            weight: 600
          }"""

content = content.replace(text_to_replace2, replacement2)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated route.tsx")
