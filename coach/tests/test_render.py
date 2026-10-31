#!/usr/bin/env python3
"""Render the authored coach through the real Rive CLI, without network use."""
import os
from pathlib import Path
import subprocess
import tempfile
from PIL import Image, ImageChops

ROOT=Path(__file__).resolve().parents[1]
CLI=os.environ.get('RIVE_CLI','rive')

def run(*args):
    subprocess.run([CLI,str(ROOT),*args],check=True,stdout=subprocess.DEVNULL)

def capture(folder,name,*args):
    target=folder/(name+'.png')
    run('--screenshot='+str(target),*args)
    with Image.open(target) as source:return source.convert('RGB')

def changed(a,b,rect):
    diff=ImageChops.difference(a.crop(rect),b.crop(rect))
    return sum(pixel!=(0,0,0) for pixel in diff.getdata())

def main():
    run('--verify')
    with tempfile.TemporaryDirectory(prefix='codi-coach-test-') as temporary:
        folder=Path(temporary)
        neutral=capture(folder,'neutral','--advance=1')
        alert=capture(folder,'alert','--data=danger=0.9','--advance=60')
        reset=capture(folder,'reset','--data=danger=0.9','--advance=60','--data=danger=0.2','--advance=60')
        assert changed(neutral,alert,(25,35,155,125))>1000
        assert changed(neutral,reset,(25,35,155,125))<20
        combo=capture(folder,'combo','--data=combo=3','--advance=1')
        assert changed(neutral,combo,(38,127,145,138))>100
        still=capture(folder,'still','--data=reducedMotion=true','--advance=146')
        blink=capture(folder,'blink','--data=reducedMotion=false','--advance=146')
        assert changed(neutral,still,(50,60,130,95))<20
        assert changed(neutral,blink,(50,60,130,95))>50
        interrupted=capture(folder,'interrupted','--advance=1','--data=celebrate=1','--advance=5','--data=reducedMotion=true','--advance=5')
        assert changed(neutral,interrupted,(45,95,135,130))<20
        for key in ['celebrate','topOut']:

            reaction=capture(folder,key,'--advance=1','--data='+key+'=1','--advance=5')
            recovered=capture(folder,key+'-reset','--advance=1','--data='+key+'=1','--advance=90')
            assert changed(neutral,reaction,(45,95,135,130))>25,key
            assert changed(neutral,recovered,(45,95,135,130))<20,key
        states={key:capture(folder,key,'--data=menuState='+key,'--advance=30').getpixel((90,13)) for key in ['title','playing','paused','result']}
        assert len(set(states.values()))==4,states
        print('PASS coach alert/recovery, both reactions/recovery and four game states:',states)

if __name__=='__main__':main()
