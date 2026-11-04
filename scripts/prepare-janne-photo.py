"""Derive web assets and a conservative sky matte; never overwrite the source photograph.
Requires Pillow, numpy, opencv-python-headless. Optional local tools: .build-tools/photo-tools.
"""
import sys
from pathlib import Path
sys.path.insert(0,str(Path('.build-tools/photo-tools').resolve()))
import argparse,hashlib,json
import cv2
import numpy as np
from PIL import Image

parser=argparse.ArgumentParser();parser.add_argument('source');args=parser.parse_args()
source=Path(args.source);image=Image.open(source).convert('RGB');w,h=image.size
if (w,h)!=(1672,941):raise ValueError('This matte is traced for the 1672 × 941 Janne photograph only.')
rgb=np.asarray(image);hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV)
# Conservative photo-space skyline, including the barn, roof, chimney, and treeline.
# Fine dark foliage is preserved by the color matte within the narrow tree boundary band.
skyline=np.array([[0,407],[74,366],[325,396],[345,408],[377,399],[416,394],[452,397],
 [456,403],[536,304],[689,302],[690,291],[700,290],[701,286],[710,286],
 [710,291],[727,291],[732,301],[1049,298],[1114,400],
 [1128,392],[1190,390],[1240,384],[1300,388],[1360,382],[1410,386],
 [1450,377],[1490,383],[1530,378],[1570,381],[1610,376],[1671,379]],dtype=float)
line=np.interp(np.arange(w),skyline[:,0],skyline[:,1]);yy=np.arange(h)[:,None]
sky=np.clip((line[None,:]-.7-yy)/1.5+.5,0,1)
tree_columns=((np.arange(w)>1116)|((np.arange(w)>415)&(np.arange(w)<452)))
near_tree=tree_columns[None,:]&(yy>line[None,:]-10)&(yy<line[None,:]+13)
color=np.clip((hsv[:,:,2].astype(float)-80)/55,0,1)*np.clip((65-hsv[:,:,1].astype(float))/35,0,1)
sky=np.where(near_tree,color*np.clip((line[None,:]+12-yy)/3,0,1),sky)
roof=np.zeros((h,w),dtype=np.uint8);cv2.fillPoly(roof,[np.int32([[0,409],[74,366],[325,396],[411,446],[0,446]])],255)
building=json.loads(Path('In/hemkontroll_3d_komplett/src/system/calibration/janne-house-surfaces.json').read_text(encoding='utf-8'))
if building['sourceSha256']!=hashlib.sha256(source.read_bytes()).hexdigest():raise ValueError('Building mask source hash mismatch.')
cv2.fillPoly(roof,[np.int32(building['outline'])],255)
alpha=np.maximum(np.uint8(np.round((1-sky)*255)),roof);rgba=np.dstack((rgb,alpha))
out=Path('In/hemkontroll_3d_komplett/public/images/yard/janne');out.mkdir(parents=True,exist_ok=True)
for width in [640,960,1280,1672]:
 height=round(h*width/w)
 image.resize((width,height),Image.Resampling.LANCZOS).save(out/f'photo-{width}.webp',quality=92,method=6)
 Image.fromarray(rgba).resize((width,height),Image.Resampling.LANCZOS).save(out/f'foreground-{width}.webp',quality=92,alpha_quality=100,method=6)
Image.fromarray(alpha).save(out/'foreground-mask.png')
metadata={'sourceName':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
 'width':w,'height':h,'widths':[640,960,1280,1672],
 'skyMatte':'photo-space skyline plus conservative color matting for treeline; visually approximate',
 'sourcePreserved':True,'nativeResolutionLimit':True}
(out/'source.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
print(json.dumps(metadata))
