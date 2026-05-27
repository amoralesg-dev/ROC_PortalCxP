from PIL import Image
from collections import Counter

def get_colors(filename):
    im = Image.open(filename).convert('RGB')
    colors = Counter(im.getdata())
    print(f'Top colors for {filename}:')
    for color, count in colors.most_common(10):
        print(f'#{color[0]:02x}{color[1]:02x}{color[2]:02x} - {count}')

get_colors('src/app/img/RASSINI_Logo_color.png')
get_colors('src/app/img/Logo naranja - blanco.png')
